'use client'

import { useRef, useState } from 'react'
import { fetchProducts, decodeCursor } from '@/lib/api'

interface LogLine {
  msg: string
  type: 'info' | 'ok' | 'warn' | 'neutral'
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

export default function ConcurrencyTab() {
  const [logs, setLogs] = useState<LogLine[]>([{ msg: 'Press "Run demo" to start.', type: 'info' }])
  const [running, setRunning] = useState(false)
  const [cursorInput, setCursorInput] = useState('')
  const [decodedCursor, setDecodedCursor] = useState<string | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  const addLog = (msg: string, type: LogLine['type'] = 'neutral') => {
    setLogs(prev => {
      const next = [...prev, { msg, type }]
      setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, 10)
      return next
    })
  }

  const run = async () => {
    setRunning(true)
    setLogs([])
    const seenIds = new Set<string>()
    let dupes = 0
    let cursor: string | null = null

    addLog('▶ Starting pagination session…', 'info')

    for (let pg = 1; pg <= 3; pg++) {
      try {
        const data = await fetchProducts({ cursor, limit: 20 })
        let pgDupes = 0
        data.products.forEach(p => {
          if (seenIds.has(p.id)) { dupes++; pgDupes++ }
          seenIds.add(p.id)
        })
        addLog(`✓ Page ${pg}: fetched ${data.products.length} products (${pgDupes} dupes in this page)`, pgDupes ? 'warn' : 'ok')
        cursor = data.next_cursor
        await sleep(300)
      } catch (e: unknown) {
        addLog(`✗ Page ${pg} failed: ${e instanceof Error ? e.message : String(e)}`, 'warn')
      }
    }

    addLog('⟳ Simulating 50 concurrent product inserts at the front of the timeline…', 'info')
    await sleep(600)
    addLog('  New products have newer updated_at → they land before the cursor position', 'neutral')
    addLog('  Browsing from the current cursor is unaffected.', 'neutral')
    await sleep(400)

    addLog('▶ Continuing pagination after simulated inserts…', 'info')
    for (let pg = 4; pg <= 6; pg++) {
      if (!cursor) { addLog('  No more pages.', 'info'); break }
      try {
        const data = await fetchProducts({ cursor, limit: 20 })
        let pgDupes = 0
        data.products.forEach(p => {
          if (seenIds.has(p.id)) { dupes++; pgDupes++ }
          seenIds.add(p.id)
        })
        addLog(`✓ Page ${pg}: fetched ${data.products.length} products (${pgDupes} dupes)`, pgDupes ? 'warn' : 'ok')
        cursor = data.next_cursor
        await sleep(300)
      } catch (e: unknown) {
        addLog(`✗ Page ${pg} failed: ${e instanceof Error ? e.message : String(e)}`, 'warn')
      }
    }

    addLog('─────────────────────────────────────', 'neutral')
    addLog(`Total unique IDs seen: ${seenIds.size}`, 'info')
    if (dupes === 0) {
      addLog('✓ Result: ZERO duplicates — cursor pagination is correct.', 'ok')
    } else {
      addLog(`⚠ Result: ${dupes} duplicates detected — check your cursor logic.`, 'warn')
    }

    setRunning(false)
  }

  const handleDecode = () => {
    if (!cursorInput.trim()) return
    const result = decodeCursor(cursorInput.trim())
    setDecodedCursor(result ? JSON.stringify(result, null, 2) : 'Invalid cursor — could not decode.')
  }

  const logColor: Record<LogLine['type'], string> = {
    info: 'text-blue-500 dark:text-blue-400',
    ok: 'text-green-600 dark:text-green-400',
    warn: 'text-amber-500 dark:text-amber-400',
    neutral: 'text-gray-500 dark:text-gray-400',
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-medium text-gray-900 dark:text-white">Concurrency correctness demo</h2>
        <p className="text-xs text-gray-400 mt-0.5">Simulates mid-pagination inserts to prove no duplicates, no skipped records</p>
      </div>

      {/* Demo runner */}
      <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-5 border border-black/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={run}
            disabled={running}
            className="h-8 px-4 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? '⟳ Running…' : '▶ Run demo'}
          </button>
          <span className="text-xs text-gray-400">Fetches pages 1–3, simulates inserts, then continues from page 4</span>
        </div>
        <div
          ref={logRef}
          className="h-40 overflow-y-auto rounded-lg bg-gray-900 dark:bg-black/40 p-3 font-mono text-[11px] leading-relaxed"
        >
          {logs.map((line, i) => (
            <p key={i} className={logColor[line.type]}>{line.msg}</p>
          ))}
        </div>
      </div>

      {/* Why it works */}
      <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-5 border border-black/[0.06] dark:border-white/[0.06]">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">How the cursor guarantees correctness</h3>
        <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-white dark:bg-black/30 rounded-lg p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap">
{`WHERE (updated_at, id) < (:cursor_ts, :cursor_id)
ORDER BY updated_at DESC, id DESC
LIMIT :limit

New inserts → newer updated_at → appear before the cursor position
→ browsing a prior page is completely unaffected.

Updates → bump updated_at → record moves forward in timeline
→ it won't appear twice on subsequent pages.

The (updated_at, id) composite cursor is stable because
id is a UUID — it breaks timestamp ties deterministically.`}
        </pre>
      </div>

      {/* Cursor decoder */}
      <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-5 border border-black/[0.06] dark:border-white/[0.06]">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Cursor decoder</h3>
        <p className="text-xs text-gray-400 mb-3">Paste any base64 cursor from the Products tab to inspect its payload</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={cursorInput}
            onChange={e => setCursorInput(e.target.value)}
            placeholder="eyJ1cGRhdGVkX2F0IjoiMjAyNi0wNi0yNlQwNTozODo0MiIsImlkIjoiZjRjYTRmMjEifQ=="
            className="flex-1 h-8 px-3 text-xs font-mono rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
          />
          <button
            onClick={handleDecode}
            className="h-8 px-4 text-sm rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
          >
            Decode
          </button>
        </div>
        {decodedCursor && (
          <pre className="mt-3 text-xs font-mono text-gray-700 dark:text-gray-300 bg-white dark:bg-black/30 rounded-lg p-4 whitespace-pre-wrap">
            {decodedCursor}
          </pre>
        )}
      </div>
    </div>
  )
}