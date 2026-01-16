'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { MonthlyStats } from '@/lib/best-time';
import { getMonthColor } from '@/lib/best-time';

interface MonthlyChartProps {
  data: MonthlyStats[];
  overallMedian: number;
  bestMonths: number[];
}

export function MonthlyChart({ data, overallMedian, bestMonths }: MonthlyChartProps) {
  const chartData = data.map((m) => ({
    name: m.name.slice(0, 3),
    median: m.count >= 5 ? m.median : 0,
    count: m.count,
    rating: m.rating,
    rank: m.rank,
    isBest: bestMonths[0] === m.month,
    hasData: m.count >= 5,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monthly Processing Times</CardTitle>
        <p className="text-sm text-gray-500">
          Median days to process by application month
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <XAxis
                type="number"
                domain={[0, 'auto']}
                tickFormatter={(v) => `${v}d`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={40}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    if (!data.hasData) {
                      return (
                        <div className="bg-white p-2 border rounded shadow-sm">
                          <p className="text-sm text-gray-500">Insufficient data</p>
                        </div>
                      );
                    }
                    return (
                      <div className="bg-white p-3 border rounded shadow-sm">
                        <p className="font-semibold">{data.name}</p>
                        <p className="text-sm">
                          Median: <span className="font-semibold">{data.median} days</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          {data.count} permits analyzed
                        </p>
                        {data.isBest && (
                          <p className="text-sm text-green-600 font-medium mt-1">
                            Best month to apply
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                x={overallMedian}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                label={{
                  value: `Avg: ${overallMedian}d`,
                  position: 'top',
                  fontSize: 11,
                  fill: '#64748b',
                }}
              />
              <Bar dataKey="median" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.hasData ? getMonthColor(entry.rating) : '#e5e7eb'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Best/Worst indicators */}
        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">Best months</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-600">Slowest months</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-dashed border-gray-400" />
            <span className="text-gray-600">City average</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
