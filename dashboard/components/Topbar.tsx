'use client'

import { useEffect, useState } from 'react'
import { fetchHealth } from '@/lib/api'

export default function Topbar() {
  const [status, setStatus] = useState<'connecting' | 'online' | 'offline'>('connecting')

  useEffect(() => {
    fetchHealth()
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'))
  }, [])

  const pill = {
    connecting: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    online: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    offline: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  }[status]

  const dot = {
    connecting: 'bg-yellow-400',
    online: 'bg-green-500',
    offline: 'bg-red-500',
  }[status]

  const label = {
    connecting: 'Connecting…',
    online: 'API connected',
    offline: 'API offline',
  }[status]

  return (
    <header className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.08] dark:border-white/[0.08]">
      <div className="flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">Product Catalog</span>
        <span className="text-xs text-gray-400">v1.0</span>
      </div>
      <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${pill}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot} ${status === 'online' ? 'animate-pulse' : ''}`} />
        {label}
      </span>
    </header>
  )
}