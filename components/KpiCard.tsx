const COLORS: Record<string, string> = {
  blue: 'text-blue-600',
  green: 'text-emerald-600',
  orange: 'text-orange-600',
  purple: 'text-purple-600',
  red: 'text-red-600',
}

export function KpiCard({ label, value, sub, loading, color = 'blue' }: {
  label: string
  value: string
  sub?: string
  loading?: boolean
  color?: keyof typeof COLORS
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
      <p className="text-xs text-zinc-500">{label}</p>
      {loading ? (
        <div className="h-7 w-20 bg-zinc-200 rounded animate-pulse mt-1.5" />
      ) : (
        <p className={`text-2xl font-bold mt-1 ${COLORS[color]}`}>{value}</p>
      )}
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  )
}
