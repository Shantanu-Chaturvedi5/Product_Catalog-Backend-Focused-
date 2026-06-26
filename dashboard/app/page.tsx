'use client'

import { useState } from 'react'
import Topbar from '@/components/Topbar'
import ProductsTab from '@/components/ProductsTab'
import MetricsTab from '@/components/MetricsTab'
import BenchmarksTab from '@/components/BenchmarksTab'
import ConcurrencyTab from '@/components/ConcurrencyTab'
import ApiReferenceTab from '@/components/ApiReferenceTab'

const TABS = [
  { id: 'products', label: 'Products' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'benchmarks', label: 'Benchmarks' },
  { id: 'concurrency', label: 'Concurrency' },
  { id: 'docs', label: 'API reference' },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState('products')

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />

      {/* Nav tabs */}
      <div className="flex gap-0 border-b border-black/[0.08] dark:border-white/[0.08] px-5">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-2.5 text-sm border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-blue-500 text-gray-900 dark:text-white font-medium'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <main className="flex-1 p-5">
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'metrics' && <MetricsTab />}
        {activeTab === 'benchmarks' && <BenchmarksTab />}
        {activeTab === 'concurrency' && <ConcurrencyTab />}
        {activeTab === 'docs' && <ApiReferenceTab />}
      </main>
    </div>
  )
}