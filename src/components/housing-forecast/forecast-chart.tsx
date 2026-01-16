'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { MonthlyForecast } from '@/lib/forecasting';

interface ForecastChartProps {
  data: MonthlyForecast[];
}

export function ForecastChart({ data }: ForecastChartProps) {
  // Transform data for chart
  const chartData = data.map((item) => ({
    month: formatMonth(item.month),
    units: item.projectedUnits,
    confidence: item.confidence,
    pipeline: item.breakdown.fromActivePipeline,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>12-Month Housing Supply Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUnits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="units"
                name="Projected Units"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorUnits)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">High Confidence (0-3 mo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-gray-600">Medium (4-8 mo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-gray-600">Low (9-12 mo)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const confidenceColor =
    data.confidence === 'high'
      ? 'text-green-600'
      : data.confidence === 'medium'
      ? 'text-yellow-600'
      : 'text-orange-600';

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      <p className="text-blue-600 font-semibold">
        {data.units.toLocaleString()} projected units
      </p>
      <p className="text-gray-500 text-sm">
        From pipeline: {data.pipeline.toLocaleString()}
      </p>
      <p className={`text-sm capitalize ${confidenceColor}`}>
        {data.confidence} confidence
      </p>
    </div>
  );
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}
