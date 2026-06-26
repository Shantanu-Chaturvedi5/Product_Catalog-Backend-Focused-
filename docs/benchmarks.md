# Benchmarks

## What GET /benchmarks measures

`BenchmarkService.benchmark()` runs `EXPLAIN ANALYZE` on two query shapes
against the live `products` table and parses the reported `Execution Time`
out of the plan:

1. **Cursor-style query** -- `ORDER BY updated_at DESC, id DESC LIMIT 50`
   (no cursor WHERE clause for this baseline; it isolates the cost of the sort
   itself, served by `idx_products_cursor`).
2. **Offset-style query** -- the same `ORDER BY ... LIMIT 50` with
   `OFFSET 100000` added, simulating a user deep into offset-paginated browsing.

It returns:

```json
{
  "cursor_query_time_ms": 0.0,
  "offset_query_time_ms": 0.0,
  "percentage_improvement": 0.0
}
```

(Numbers above are illustrative -- run the endpoint against your own seeded
database for real figures, since they depend on hardware, Postgres
configuration, and how many of the 200k rows are actually present.)

## Known fix applied

The original regex used to pull the millisecond figure out of the
`EXPLAIN ANALYZE` text output was double-escaped (`r"...[\\d.]+..."`), which
matches a literal backslash-d rather than a digit class -- it would silently
return `0.0` for every query, making the endpoint look "correct" while
reporting nothing real. Fixed to `r"...[\d.]+..."` in `benchmark_service.py`.
Anyone re-deriving this endpoint from scratch should sanity-check it against
`psql`'s own `EXPLAIN ANALYZE` output before trusting the parsed number.

## How to read the EXPLAIN ANALYZE output yourself

```sql
EXPLAIN ANALYZE
SELECT * FROM products
ORDER BY updated_at DESC, id DESC
LIMIT 50;
```

Look for:
- `Index Scan using idx_products_cursor` (good -- using the composite index,
  not a full `Seq Scan` + `Sort`).
- `Execution Time: X ms` at the bottom of the plan.

```sql
EXPLAIN ANALYZE
SELECT * FROM products
ORDER BY updated_at DESC, id DESC
LIMIT 50 OFFSET 100000;
```

This plan should show the planner still walking the index, but discarding
100,000 rows before returning anything -- the `Execution Time` for this query
should scale up with the offset depth, while the cursor query's time stays
roughly flat regardless of where in the dataset the cursor points.

## Why these specific numbers aren't hardcoded into this doc

Benchmark numbers measured on a laptop's local Postgres container are not
representative of Neon's managed Postgres, connection pooling overhead, or
production load -- presenting a hardcoded number here would be misleading.
The endpoint exists specifically so the comparison can be regenerated live,
in front of an interviewer, against whatever environment it's actually
running in.