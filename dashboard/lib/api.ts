const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface Product {
  id: string
  name: string
  category: string
  price: string
  created_at: string
  updated_at: string
}

export interface ProductsResponse {
  products: Product[]
  next_cursor: string | null
  has_more: boolean
}

export interface ProductFilters {
  cursor?: string | null
  limit?: number
  category?: string
  min_price?: number
  max_price?: number
  search?: string
}

export interface MetricsResponse {
  total_products: number
  average_response_time_ms: number
  average_pagination_time_ms: number
  database_query_time_ms: number
}

export interface BenchmarkResponse {
  cursor_query_time_ms: number
  offset_query_time_ms: number
  percentage_improvement: number
}

export interface SeedInfo {
  total_records: number
  generation_duration: number
  category_distribution: Record<string, number>
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(API_URL + path)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export async function fetchProducts(filters: ProductFilters): Promise<ProductsResponse> {
  const qs = new URLSearchParams()
  if (filters.cursor) qs.set('cursor', filters.cursor)
  if (filters.limit) qs.set('limit', String(filters.limit))
  if (filters.category) qs.set('category', filters.category)
  if (filters.min_price != null) qs.set('min_price', String(filters.min_price))
  if (filters.max_price != null) qs.set('max_price', String(filters.max_price))
  if (filters.search) qs.set('search', filters.search)
  return apiFetch<ProductsResponse>(`/products?${qs.toString()}`)
}

export async function fetchMetrics(): Promise<MetricsResponse> {
  return apiFetch<MetricsResponse>('/metrics')
}

export async function fetchBenchmarks(): Promise<BenchmarkResponse> {
  return apiFetch<BenchmarkResponse>('/benchmarks')
}

export async function fetchSeedInfo(): Promise<SeedInfo> {
  return apiFetch<SeedInfo>('/seed-info')
}

export async function fetchHealth(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>('/health')
}

export function decodeCursor(cursor: string): { updated_at: string; id: string } | null {
  try {
    return JSON.parse(atob(cursor))
  } catch {
    return null
  }
}