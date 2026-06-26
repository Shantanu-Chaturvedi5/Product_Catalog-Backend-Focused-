# API Examples

## GET /products -- first page

```bash
curl "http://localhost:8000/products?limit=20"
```

```json
{
  "products": [
    {"id": "...", "name": "...", "category": "Electronics", "price": "199.99", "created_at": "...", "updated_at": "..."}
  ],
  "next_cursor": "eyJ1cGRhdGVkX2F0IjogIjIwMjYtMDYtMjVUMTA6MDA6MDArMDA6MDAiLCAiaWQiOiAiYWJjMTIzLi4uIn0=",
  "has_more": true
}
```

## GET /products -- next page

```bash
curl "http://localhost:8000/products?limit=20&cursor=eyJ1cGRhdGVkX2F0IjogIjIwMjYtMDYtMjVUMTA6MDA6MDArMDA6MDAiLCAiaWQiOiAiYWJjMTIzLi4uIn0="
```

The client never constructs this cursor itself -- it's always the
`next_cursor` value echoed back from the previous response.

## GET /products -- filtered + paginated

```bash
curl "http://localhost:8000/products?limit=20&category=Electronics&min_price=50&max_price=500&search=phone"
```

Filters are combined with `AND`; the cursor (once you start paging) continues
to anchor on `(updated_at, id)` regardless of which filters are active, as
long as the same filters are repeated on each request.

## GET /products -- last page

```json
{
  "products": [ /* fewer than `limit` items, or exactly `limit` */ ],
  "next_cursor": null,
  "has_more": false
}
```

## GET /seed-info

```bash
curl http://localhost:8000/seed-info
```

```json
{
  "total_records": 200000,
  "generation_duration_seconds": 0.0,
  "category_distribution": {
    "Electronics": 40000,
    "Books": 40000,
    "Fashion": 40000,
    "Sports": 40000,
    "Toys": 40000
  }
}
```

(Exact field names/values depend on `SeedRepository`/`SeedMetadata` -- run the
seed script and hit the endpoint for live data.)

## GET /benchmarks

```bash
curl http://localhost:8000/benchmarks
```

```json
{
  "cursor_query_time_ms": 0.0,
  "offset_query_time_ms": 0.0,
  "percentage_improvement": 0.0
}
```

## GET /metrics

```bash
curl http://localhost:8000/metrics
```

```json
{
  "total_products": 0,
  "average_response_time": 0.0,
  "average_pagination_time": 0.0,
  "database_query_time": 0.0
}
```

## GET /health

```bash
curl http://localhost:8000/health
```

```json
{"status": "healthy"}
```