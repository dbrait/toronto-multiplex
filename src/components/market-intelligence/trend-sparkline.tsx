'use client';

import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import type { MonthlyTrend } from '@/lib/market-intelligence';

interface TrendSparklineProps {
  data: MonthlyTrend[];
}

export function TrendSparkline({ data }: TrendSparklineProps) {
  // Take last 6 months of data
  const recentData = data.slice(-6);

  if (recentData.length < 2) {
    return <div className="w-20 h-8 bg-gray-100 rounded" />;
  }

  // Determine trend direction for color
  const firstValue = recentData[0]?.permits || 0;
  const lastValue = recentData[recentData.length - 1]?.permits || 0;
  const isUpward = lastValue >= firstValue;

  return (
    <div className="w-20 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={recentData}>
          <defs>
            <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={isUpward ? '#22c55e' : '#ef4444'}
                stopOpacity={0.3}
              />
              <stop
                offset="100%"
                stopColor={isUpward ? '#22c55e' : '#ef4444'}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="permits"
            stroke={isUpward ? '#22c55e' : '#ef4444'}
            strokeWidth={1.5}
            fill="url(#sparklineGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
