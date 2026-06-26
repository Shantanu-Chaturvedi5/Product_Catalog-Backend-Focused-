# Architecture

## Layering
## Request lifecycle for GET /products

1. `MetricsMiddleware` records a start timestamp (ASGI-level, wraps everything).
2. `logging_middleware` (HTTP middleware) attaches a request_id and will log
   latency/status/db_time on the way out.
3. `product_controller.get_products` validates query params (limit bounds,
   price >= 0, etc.) via FastAPI's `Query()`.
4. `ProductService.browse_products` decodes the cursor (if present) and calls
   `ProductRepository.get_products`.
5. `ProductRepository` builds one SQLAlchemy `select()`, applies filters, the
   cursor's row-value `WHERE`, the `ORDER BY`, and `LIMIT limit + 1`.
6. Service trims the lookahead row, computes `has_more`, encodes `next_cursor`.
7. Response is serialized through the `ProductPaginationResponse` Pydantic schema.

## Why this split matters in an interview

Cursor encode/decode logic is pure (no I/O) and lives in `utils/cursor.py`,
independent of the service -- so `tests/test_cursor.py` can verify
encode -> decode round-trips without a database connection. The pagination
*decision* logic (has_more, trimming the lookahead row) lives in the service,
not the repository, so it's testable against a fake repository returning
canned rows. Only raw SQL construction lives in the repository -- if the
project moved off Postgres, only that layer should need to change.

## Dependency Injection

FastAPI's `Depends(get_db)` yields a fresh `AsyncSession` per request and closes
it afterward. Services and repositories are constructed inline per-request
(`ProductService(db)`) rather than as app-level singletons -- there's no shared
mutable state between requests, which matters for an async app handling
concurrent traffic.

## Middleware Stack

- `MetricsMiddleware` (ASGI middleware, outermost): wall-clock timing per
  request, aggregated in the process-local `MetricsStore`, surfaced at
  `GET /metrics`.
- `logging_middleware` (HTTP middleware): structured JSON log line per request
  -- `request_id`, `endpoint`, `latency`, `status_code`, `database_time`.