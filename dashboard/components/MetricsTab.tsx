'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { fetchMetrics, type MetricsResponse } from '@/lib/api'
import KpiCard from './KpiCard'

export default function MetricsTab() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const m = await fetchMetrics()
      setMetrics(m)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const chartData = metrics
    ? [
        { label: 'Avg response', value: parseFloat(metrics.average_response_time_ms.toFixed(2)), color: '#2a78d6' },
        { label: 'Pagination', value: parseFloat(metrics.average_pagination_time_ms.toFixed(2)), color: '#1baf7a' },
        { label: 'DB query', value: parseFloat(metrics.database_query_time_ms.toFixed(2)), color: '#eda100' },
      ]
    : []

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-medium text-gray-900 dark:text-white">Live system metrics</h2>
        <p className="text-xs text-gray-400 mt-0.5">Collected by the request middleware across all endpoints</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <KpiCard label="Total products" value={metrics?.total_products?.toLocaleString() ?? null} />
        <KpiCard label="Avg response" value={metrics?.average_response_time_ms?.toFixed(1) ?? null} unit="ms" />
        <KpiCard label="Avg pagination" value={metrics?.average_pagination_time_ms?.toFixed(1) ?? null} unit="ms" />
        <KpiCard label="DB query" value={metrics?.database_query_time_ms?.toFixed(1) ?? null} unit="ms" />
      </div>

      <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-5 border border-black/[0.06] dark:border-white/[0.06]">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Response time breakdown</h3>
        <p className="text-xs text-gray-400 mb-4">Average latency by component (ms)</p>

        {/* Legend */}
        <div className="flex gap-4 mb-4">
          {[{ label: 'Avg response', color: '#2a78d6' }, { label: 'Pagination', color: '#1baf7a' }, { label: 'DB query', color: '#eda100' }].map(s => (
            <span key={s.label} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-sm text-gray-400">Loading…</div>
        ) : error ? (
          <div className="h-48 flex items-center justify-center text-sm text-red-500">{error}</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={40}>
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#898781' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#898781' }} axisLine={false} tickLine={false} tickFormatter={v => `${v} ms`} />
              <Tooltip
                formatter={(v: number) => [`${v} ms`, '']}
                contentStyle={{ background: 'var(--surface, #fff)', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <button
        onClick={load}
        className="self-start h-8 px-4 text-sm rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
      >
        ↺ Refresh metrics
      </button>
    </div>
  )
}