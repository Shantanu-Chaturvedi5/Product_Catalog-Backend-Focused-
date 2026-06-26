# Product Catalog Backend

A production-grade backend for browsing 200,000+ products with **cursor-based pagination**,
built to demonstrate correctness under concurrent writes, query performance, and clean
backend architecture — explainable end-to-end in a live technical interview.

## 1. Architecture
Each layer only knows about the layer directly below it:
`Controller -> Service -> Repository -> Database`. This keeps pagination logic
(in `ProductService`) independent of HTTP concerns and independent of how
SQLAlchemy builds the query, which is what makes it possible to unit test
cursor encoding/decoding without a database connection.

Dependency injection is done via FastAPI's `Depends(get_db)`, which hands each
request its own `AsyncSession` — repositories and services are otherwise plain
classes constructed per-request, not singletons, so there's no shared mutable state.

## 2. Database Schema

```sql
CREATE TABLE products (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255),
    category    VARCHAR(100),
    price       NUMERIC(10,2),
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
```

`updated_at` is the field pagination is anchored on (not `created_at`), because the
requirement is "stable browsing during inserts **and updates**" — if a product the
user already paged past gets edited, it must not jump back into view or get
re-served out of order.

## 3. Cursor Pagination Design

**Sort key:** `(updated_at DESC, id DESC)` — composite, never `updated_at` alone.

**Why composite:** `updated_at` is not unique (many products can share a timestamp,
especially right after a bulk seed). Sorting on it alone means ties are ordered
arbitrarily by the database, which breaks pagination — the same row can appear on
two different pages, or never appear at all, depending on how Postgres happens to
order the tie. Adding `id` (which *is* unique) as a tiebreaker makes the sort
deterministic. This is the part of the design most candidates miss, and the part
most worth being able to defend in an interview.

**Cursor contents:** `{ "updated_at": "<iso8601>", "id": "<uuid>" }`, JSON-encoded
then Base64-encoded. The cursor is opaque to the client — it should never be
constructed manually — but it's also not encrypted, since it doesn't carry secrets,
just a literal position in the sort order.

**Query shape**, using a row-value comparison so the two columns are compared as a
single unit rather than independently:

```sql
SELECT * FROM products
WHERE (updated_at, id) < (:cursor_updated_at, :cursor_id)
ORDER BY updated_at DESC, id DESC
LIMIT :limit + 1;
```

The `LIMIT + 1` trick: the repository always fetches one extra row. If `limit + 1`
rows come back, there's a next page (`has_more = true`), and the extra row is
trimmed before encoding the next cursor — so the API never has to issue a separate
`COUNT` query to know whether more data exists.

**Filters compose with the cursor as `AND`-ed `WHERE` clauses** (category, price
range, name search) — they narrow the result set, but the comparison against the
cursor still anchors on the same `(updated_at, id)` pair, so a filtered browse
session is just as stable as an unfiltered one.

## 4. Why OFFSET Pagination Fails Here

`OFFSET n LIMIT m` asks Postgres to *generate then discard* the first `n` rows on
every single page request. Two separate failure modes follow:

- **Performance degrades linearly with depth.** Page 5,000 (`OFFSET 100000`) means
  scanning/sorting 100,000 rows just to throw them away before returning the next
  20. At 200k rows this is measurable and gets worse as the catalog grows — there's
  no index that fixes "skip N rows," because the work is proportional to N.
- **Correctness breaks under concurrent writes.** OFFSET is a position in an
  *unstable* row count, not a position in the data. If a new product is inserted
  while a user is on page 3, every row after it shifts by one offset position —
  the next page replays a row the user already saw (duplicate) or skips one
  entirely (missing record). Cursor pagination has no such failure mode because
  the cursor is a literal value (`updated_at`, `id`), not a row count — inserts
  elsewhere in the table don't move it.

The `/benchmarks` endpoint quantifies the first point directly using `EXPLAIN
ANALYZE` on both query shapes; `scripts/test_concurrency.py` proves the second
point by injecting writes mid-pagination and checking the result set.

## 5. Indexing Strategy

```sql
CREATE INDEX idx_products_cursor   ON products(updated_at DESC, id DESC);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price    ON products(price);
```

- `idx_products_cursor` matches the `ORDER BY` exactly, so the cursor query becomes
  an index range scan (seek to the cursor position, read forward) instead of a
  full sort of the table on every request.
- `idx_products_category` and `idx_products_price` support the filter predicates.
  They help most when a filter is highly selective; for a broad filter combined
  with the cursor sort, Postgres may still prefer the cursor index and filter the
  remainder in-memory — worth showing via `EXPLAIN ANALYZE` rather than asserting.
- A composite index covering `(category, updated_at DESC, id DESC)` would be the
  next step if category-filtered browsing becomes the dominant query pattern — not
  added by default here, to keep the schema simple to explain, since it duplicates
  most of `idx_products_cursor`'s leading column.

## 6. Concurrency Handling

`scripts/test_concurrency.py` simulates the exact failure scenario cursor
pagination is meant to prevent:

1. Start a pagination session and fetch several pages, collecting every product
   `id` seen.
2. Mid-session, insert 50 new products directly into the table.
3. Continue paginating to the end with the *same* cursor chain.
4. Assert: no `id` appears twice in the collected set, and no existing
   (pre-insert) product is missing from it.

Because the cursor is a snapshot of `(updated_at, id)` rather than a row offset,
the 50 new inserts simply appear ahead of or behind the cursor's position
depending on their own `updated_at` — they never shift the meaning of "everything
older than where I currently am," which is what the cursor actually encodes.

## 7. Benchmark Results

Run `GET /benchmarks` against a seeded database for live numbers; it reports
`EXPLAIN ANALYZE` execution time for the cursor query vs. an equivalent
`OFFSET 100000` query and the percentage improvement. Results vary by hardware
and Postgres configuration, which is why the endpoint computes them live rather
than hardcoding a number here. (See `docs/benchmarks.md` for methodology.)

## 8. Tradeoffs

- **No arbitrary "jump to page N."** Cursor pagination only supports forward
  traversal from a known position — no equivalent of "go to page 47." Fine for
  infinite-scroll/browse UX, not for a paginated admin table with numbered links.
- **Sort order is fixed at `updated_at DESC, id DESC`.** Supporting a
  user-selectable sort means the cursor and index need to be parameterized per
  sort field, which adds real complexity — intentionally out of scope here.
- **`MetricsStore` is process-local.** It resets on restart and doesn't
  aggregate across multiple API replicas — fine for a single-instance demo,
  not for production (see Future Improvements).

## 9. Future Improvements

- Forward + backward pagination (currently forward-only).
- Replace the in-process `MetricsStore` with Prometheus/StatsD before running
  more than one API replica.
- Rate limiting / pagination abuse protection on `/products`.
- Add a composite `(category, updated_at, id)` index if category-filtered
  pagination becomes the hot path, backed by query-plan evidence from `/benchmarks`.

## 10. AI Usage Disclosure

This project was built with AI assistance (Claude) for code generation,
architectural review, and documentation. The cursor pagination design, indexing
choices, and tradeoffs were reviewed against query plans and a concurrency test
rather than taken on faith. Two implementation bugs were caught during this
review and fixed: a broken regex in `BenchmarkService` (`EXPLAIN ANALYZE` time
parsing always returned `0.0`), and a `tests/test_cursor.py` stub that referenced
undefined variables and would never have run.A malformed or tampered pagination cursor previously raised an unhandled
`ValueError`/`binascii.Error` (resulting in a raw 500); this was replaced with
a typed `InvalidCursorError` and a centralized exception handler that returns
a clean `400` with a `request_id` for traceability.

## Running Locally

```bash
docker compose up --build
# API at http://localhost:8000, Swagger at http://localhost:8000/docs
```

Then seed the database and exercise the endpoints:

```bash
docker compose exec api python scripts/generate_products.py   # bulk-generate 200k rows
curl http://localhost:8000/seed-info
curl "http://localhost:8000/products?limit=20"
curl http://localhost:8000/benchmarks
docker compose exec api python scripts/test_concurrency.py
```

## API Surface

| Endpoint | Purpose |
|---|---|
| `GET /products` | Cursor-paginated product browse, with category/price/search filters |
| `GET /seed-info` | Seed run metadata: record count, generation duration, category distribution |
| `GET /benchmarks` | EXPLAIN ANALYZE comparison: cursor query vs. OFFSET query |
| `GET /metrics` | Aggregate request/response/database timing |
| `GET /health` | Liveness check |
| `GET /docs` | Auto-generated Swagger UI |

See `docs/pagination.md`, `docs/architecture.md`, `docs/benchmarks.md`, and
`docs/api_examples.md` for deeper detail on each area.#   P r o d u c t _ C a t a l o g - B a c k e n d - F o c u s e d -  
 