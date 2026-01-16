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

interface TimelineData {
  month: string;
  units: number;
  cumulative: number;
}

interface UnitsTimelineProps {
  data: TimelineData[];
}

export function UnitsTimeline({ data }: UnitsTimelineProps) {
  // Format month for display
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-CA', { month: 'short', year: '2-digit' });
  };

  const chartData = data.map((d) => ({
    ...d,
    monthLabel: formatMonth(d.month),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cumulative Housing Units Added</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                tickMargin={10}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toLocaleString() : value,
                  name === 'cumulative' ? 'Total Units' : 'New Units',
                ]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Total Units"
                stroke="#f43f5e"
                strokeWidth={2}
                fill="url(#colorCumulative)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-500 text-center mt-4">
          Showing cumulative housing units created through multiplex and ADU permits
        </p>
      </CardContent>
    </Card>
  );
}
