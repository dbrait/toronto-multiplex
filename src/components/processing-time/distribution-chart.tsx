'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getDaysBucket, formatCategoryName } from '@/lib/processing-predictor';

interface DistributionChartProps {
  distribution: { range: string; count: number }[];
  estimatedDays: number;
  neighbourhood: string;
  category: string;
}

const RANGE_ORDER = [
  '< 30 days',
  '30-60 days',
  '60-90 days',
  '90-180 days',
  '180-365 days',
  '> 365 days',
];

export function DistributionChart({
  distribution,
  estimatedDays,
  neighbourhood,
  category,
}: DistributionChartProps) {
  // Ensure all ranges are present and in correct order
  const total = distribution.reduce((sum, d) => sum + d.count, 0);
  const estimateBucket = getDaysBucket(estimatedDays);

  const chartData = RANGE_ORDER.map((range) => {
    const found = distribution.find((d) => d.range === range);
    const count = found?.count || 0;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return {
      range: range.replace(' days', ''),
      count,
      percentage,
      isEstimate: range === estimateBucket,
    };
  });

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historical Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-gray-500">
            No historical data available for this combination
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Historical Processing Times
        </CardTitle>
        <p className="text-sm text-gray-500">
          {formatCategoryName(category)} permits in {neighbourhood}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" tickFormatter={(v) => `${v}%`} />
              <YAxis
                type="category"
                dataKey="range"
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number, name: string, props: { payload: { count: number } }) => [
                  `${props.payload.count} permits (${value}%)`,
                  'Count',
                ]}
                labelFormatter={(label) => `${label} days`}
              />
              <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isEstimate ? '#3b82f6' : '#94a3b8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-gray-600">Your estimate falls here</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-400" />
            <span className="text-gray-600">Other ranges</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-2">
          Based on {total} historical permits
        </p>
      </CardContent>
    </Card>
  );
}
