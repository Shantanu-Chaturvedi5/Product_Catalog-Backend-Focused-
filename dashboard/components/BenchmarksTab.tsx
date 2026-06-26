'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { fetchBenchmarks, type BenchmarkResponse } from '@/lib/api'

export default function BenchmarksTab() {
  const [data, setData] = useState<BenchmarkResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await fetchBenchmarks())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to run benchmarks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const chartData = data
    ? [
        { label: 'Cursor', value: parseFloat(data.cursor_query_time_ms.toFixed(2)), color: '#1baf7a' },
        { label: 'Offset', value: parseFloat(data.offset_query_time_ms.toFixed(2)), color: '#e34948' },
      ]
    : []

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-medium text-gray-900 dark:text-white">Cursor vs offset pagination</h2>
        <p className="text-xs text-gray-400 mt-0.5">EXPLAIN ANALYZE at page 5,000 (row 100,000 of 200,000)</p>
      </div>

      {/* Side-by-side cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-5 border border-black/[0.06] dark:border-white/[0.06]">
          <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-2">Cursor pagination</p>
          <p className="text-3xl font-medium text-green-600 dark:text-green-400">
            {loading ? '…' : data ? `${data.cursor_query_time_ms.toFixed(2)} ms` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-2">Uses composite index on (updated_at DESC, id DESC). Seeks directly to the cursor position.</p>
        </div>
        <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-5 border border-black/[0.06] dark:border-white/[0.06]">
          <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-2">Offset pagination</p>
          <p className="text-3xl font-medium text-red-500">
            {loading ? '…' : data ? `${data.offset_query_time_ms.toFixed(2)} ms` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-2">Must scan and discard the first 100,000 rows before returning results.</p>
        </div>
      </div>

      {/* Improvement badge */}
      {data && (
        <div className="text-center py-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/30">
          <p className="text-[11px] uppercase tracking-widest text-green-600/60 dark:text-green-400/60 mb-1">Performance improvement</p>
          <p className="text-4xl font-medium text-green-700 dark:text-green-400">{data.percentage_improvement.toFixed(1)}% faster</p>
          <p className="text-xs text-green-600/60 dark:text-green-400/60 mt-1">cursor pagination wins because it never reads rows it doesn't return</p>
        </div>
      )}

      {/* Chart */}
      <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-5 border border-black/[0.06] dark:border-white/[0.06]">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Query time comparison</h3>
        <div className="flex gap-4 mb-4">
          {[{ label: 'Cursor', color: '#1baf7a' }, { label: 'Offset', color: '#e34948' }].map(s => (
            <span key={s.label} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-sm text-gray-400">Running EXPLAIN ANALYZE…</div>
        ) : error ? (
          <div className="h-48 flex items-center justify-center text-sm text-red-500">{error}</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={60}>
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
        className="self-start h-8 px-4 text-sm rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
      >
        ↺ Run benchmarks
      </button>
    </div>
  )
}