import { useId } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { formatINR } from '@/lib/formatters'

const COLORS = [
  '#2E8B57', '#1B3A5C', '#E8A317', '#D47559', '#5B8FA8',
  '#7B68EE', '#CD853F', '#6B8E23', '#B8860B', '#A0522D',
]

interface AllocationDonutProps {
  data: { category: string; value: number; percentage: number }[]
  loading: boolean
  totalValue: number
}

interface Payload {
  name: string
  value: number
  payload: { category: string; value: number; percentage: number }
}

export function AllocationDonut({ data, loading, totalValue }: AllocationDonutProps) {
  const id = useId()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Skeleton className="h-48 w-48 rounded-full" />
      </div>
    )
  }

  if (data.length === 0 || totalValue === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-body text-muted-foreground">
        No holdings data
      </div>
    )
  }

  const chartData = data.map(d => ({
    name: d.category,
    value: d.value,
    percentage: d.percentage,
  }))

  return (
    <div className="flex justify-center">
      <PieChart width={320} height={320}>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell key={`${id}-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, _name: string, entry: { payload: Payload['payload'] }) => [
            formatINR(value),
            entry.payload.category,
          ]}
        />
        <Legend
          formatter={(value: string) => (
            <span className="text-label text-muted-foreground">{value}</span>
          )}
        />
      </PieChart>
    </div>
  )
}
