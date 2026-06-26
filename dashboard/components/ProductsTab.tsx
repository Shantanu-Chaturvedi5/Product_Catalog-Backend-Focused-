'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchProducts, fetchMetrics, type Product, type ProductFilters, type MetricsResponse } from '@/lib/api'
import KpiCard from './KpiCard'
import CategoryBadge from './CategoryBadge'

const CATEGORIES = [
  "Electronics",
  "Books",
  "Fashion",
  "Sports",
  "Toys",
]

function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
}

export default function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([])
  const [currentCursor, setCurrentCursor] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [limit, setLimit] = useState(20)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async (filters: ProductFilters) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProducts(filters)
      setProducts(data.products)
      setNextCursor(data.next_cursor)
      setHasMore(data.has_more)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }, [])

  const buildFilters = useCallback((cursor: string | null): ProductFilters => ({
    cursor,
    limit,
    category: category || undefined,
    min_price: minPrice ? Number(minPrice) : undefined,
    max_price: maxPrice ? Number(maxPrice) : undefined,
    search: search || undefined,
  }), [limit, category, minPrice, maxPrice, search])

  const reset = useCallback(() => {
    setCursorStack([])
    setCurrentCursor(null)
    setPage(1)
    load(buildFilters(null))
  }, [load, buildFilters])

  useEffect(() => { reset() }, [category, limit]) // eslint-disable-line

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(reset, 400)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search, minPrice, maxPrice]) // eslint-disable-line

  useEffect(() => {
    fetchMetrics().then(setMetrics).catch(() => {})
  }, [products])

  const nextPage = () => {
    if (!nextCursor) return
    setCursorStack(s => [...s, currentCursor])
    setCurrentCursor(nextCursor)
    setPage(p => p + 1)
    load(buildFilters(nextCursor))
  }

  const prevPage = () => {
    if (cursorStack.length === 0) return
    const prev = cursorStack[cursorStack.length - 1]
    setCursorStack(s => s.slice(0, -1))
    setCurrentCursor(prev)
    setPage(p => Math.max(1, p - 1))
    load(buildFilters(prev))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <KpiCard label="Total products" value={metrics?.total_products?.toLocaleString() ?? null} />
        <KpiCard label="Avg response" value={metrics?.average_response_time_ms?.toFixed(1) ?? null} unit="ms" />
        <KpiCard label="Avg pagination" value={metrics?.average_pagination_time_ms?.toFixed(1) ?? null} unit="ms" />
        <KpiCard label="DB query" value={metrics?.database_query_time_ms?.toFixed(1) ?? null} unit="ms" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-40 h-8 px-3 text-sm rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="h-8 px-3 text-sm rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white focus:outline-none"
        >
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input
          type="number"
          placeholder="Min $"
          value={minPrice}
          onChange={e => setMinPrice(e.target.value)}
          className="w-20 h-8 px-3 text-sm rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white focus:outline-none"
        />
        <input
          type="number"
          placeholder="Max $"
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
          className="w-20 h-8 px-3 text-sm rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white focus:outline-none"
        />
        <select
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          className="h-8 px-3 text-sm rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white focus:outline-none"
        >
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
        <button
          onClick={() => { setSearch(''); setCategory(''); setMinPrice(''); setMaxPrice(''); setLimit(20); reset() }}
          className="h-8 px-3 text-sm rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="border border-black/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] px-4 py-2.5 bg-gray-50 dark:bg-white/[0.02] border-b border-black/[0.06] dark:border-white/[0.06]">
          {['Product', 'Category', 'Price', 'Updated'].map(h => (
            <span key={h} className="text-[11px] uppercase tracking-widest text-gray-400">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">Loading products…</div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-red-500">{error}<br /><span className="text-gray-400 text-xs">Make sure your FastAPI server is running</span></div>
        ) : products.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">No products match your filters.</div>
        ) : (
          products.map(p => (
            <div key={p.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] px-4 py-2.5 border-b border-black/[0.05] dark:border-white/[0.05] last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors items-center">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                <p className="text-[11px] text-gray-400 font-mono truncate">{p.id.substring(0, 8)}…</p>
              </div>
              <div><CategoryBadge category={p.category} /></div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">${parseFloat(p.price).toFixed(2)}</div>
              <div className="text-xs text-gray-400">{fmtDate(p.updated_at)}</div>
            </div>
          ))
        )}
      </div>

      {/* Pagination bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className="text-sm text-gray-500">Page {page} · {products.length} products</span>
        <div className="flex items-center gap-2 flex-wrap">
          {nextCursor && (
            <span className="text-[11px] font-mono text-gray-400 bg-gray-100 dark:bg-white/[0.05] px-2 py-1 rounded max-w-[240px] truncate">
              {nextCursor}
            </span>
          )}
          <button
            onClick={prevPage}
            disabled={cursorStack.length === 0 || loading}
            className="h-8 px-3.5 text-sm rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
          >
            ← Prev
          </button>
          <button
            onClick={nextPage}
            disabled={!hasMore || loading}
            className="h-8 px-3.5 text-sm rounded-lg border border-transparent bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}