const ENDPOINTS = [
  {
    method: 'GET',
    path: '/products',
    desc: 'Browse products with cursor-based pagination. Stable across concurrent inserts and updates.',
    params: 'cursor=<base64>  limit=20  category=Electronics  min_price=10  max_price=500  search=laptop',
  },
  {
    method: 'GET',
    path: '/metrics',
    desc: 'Aggregated request latency, pagination time, and database query time from the metrics middleware.',
    params: null,
  },
  {
    method: 'GET',
    path: '/benchmarks',
    desc: 'Runs EXPLAIN ANALYZE on cursor and offset queries. Returns execution times and improvement percentage.',
    params: null,
  },
  {
    method: 'GET',
    path: '/seed-info',
    desc: 'Returns total record count, seed generation duration, and category distribution.',
    params: null,
  },
  {
    method: 'GET',
    path: '/health',
    desc: 'Simple health check. Returns { "status": "healthy" }.',
    params: null,
  },
  {
    method: 'GET',
    path: '/docs',
    desc: 'Auto-generated Swagger / OpenAPI documentation from FastAPI. Open in your browser.',
    params: null,
  },
]

const SCHEMA = `{
  "id":         "uuid — primary key",
  "name":       "string — product name (searchable)",
  "category":   "string — one of 10 categories",
  "price":      "decimal — range 1–2000",
  "created_at": "timestamptz",
  "updated_at": "timestamptz — used as cursor sort key"
}`

const INDEXES = `-- Primary pagination index (most important)
CREATE INDEX idx_products_cursor
  ON products(updated_at DESC, id DESC);

-- Category filter pushdown
CREATE INDEX idx_products_category
  ON products(category);

-- Price range filter
CREATE INDEX idx_products_price
  ON products(price);`

export default function ApiReferenceTab() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-medium text-gray-900 dark:text-white">API reference</h2>
        <p className="text-xs text-gray-400 mt-0.5">FastAPI backend — all endpoints</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {ENDPOINTS.map(ep => (
          <div key={ep.path} className="bg-gray-50 dark:bg-white/[0.03] rounded-xl px-4 py-3.5 border border-black/[0.06] dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                {ep.method}
              </span>
              <code className="text-sm text-gray-900 dark:text-white font-mono">{ep.path}</code>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{ep.desc}</p>
            {ep.params && (
              <pre className="mt-2 text-[11px] font-mono text-gray-500 dark:text-gray-400 bg-white dark:bg-black/20 rounded-lg px-3 py-2 overflow-x-auto">
                {ep.params}
              </pre>
            )}
          </div>
        ))}
      </div>

      {/* Schema */}
      <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-5 border border-black/[0.06] dark:border-white/[0.06]">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Product schema</h3>
        <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-white dark:bg-black/30 rounded-lg p-4 overflow-x-auto leading-relaxed">
          {SCHEMA}
        </pre>
      </div>

      {/* Indexes */}
      <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-5 border border-black/[0.06] dark:border-white/[0.06]">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Indexing strategy</h3>
        <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-white dark:bg-black/30 rounded-lg p-4 overflow-x-auto leading-relaxed">
          {INDEXES}
        </pre>
      </div>

      {/* Cursor design */}
      <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-5 border border-black/[0.06] dark:border-white/[0.06]">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Cursor design</h3>
        <p className="text-xs text-gray-400 mb-3">
          The cursor encodes <code className="bg-white dark:bg-black/20 px-1 rounded text-gray-700 dark:text-gray-300">updated_at</code> and <code className="bg-white dark:bg-black/20 px-1 rounded text-gray-700 dark:text-gray-300">id</code> as a Base64-encoded JSON blob.
        </p>
        <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-white dark:bg-black/30 rounded-lg p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap">
{`Cursor payload (before encoding):
{ "updated_at": "2026-06-26T05:38:42", "id": "f4ca4f21-..." }

SQL it generates:
WHERE (updated_at, id) < (:cursor_ts, :cursor_id)
ORDER BY updated_at DESC, id DESC
LIMIT :limit

Why composite? updated_at alone is not unique — two products
can have the same timestamp. Adding id (UUID) as a tiebreaker
makes the cursor 100% deterministic.`}
        </pre>
      </div>
    </div>
  )
}