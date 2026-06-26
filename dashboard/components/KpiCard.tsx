interface KpiCardProps {
  label: string
  value: string | number | null
  unit?: string
}

export default function KpiCard({ label, value, unit }: KpiCardProps) {
  return (
    <div className="bg-gray-50 dark:bg-white/[0.04] rounded-lg p-4">
      <p className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">{label}</p>
      <p className="text-2xl font-medium text-gray-900 dark:text-white">
        {value ?? '—'}
        {unit && value != null && (
          <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
        )}
      </p>
    </div>
  )
}