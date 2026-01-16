'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import type { MonthlyStats } from '@/lib/best-time';
import { getMonthBgColor, getMonthTextColor } from '@/lib/best-time';

interface MonthHeatmapProps {
  data: MonthlyStats[];
  bestMonths: number[];
}

export function MonthHeatmap({ data, bestMonths }: MonthHeatmapProps) {
  const currentMonth = new Date().getMonth() + 1;

  // Split into two rows: Jan-Jun and Jul-Dec
  const firstRow = data.filter((m) => m.month <= 6);
  const secondRow = data.filter((m) => m.month > 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Calendar View</CardTitle>
        <p className="text-sm text-gray-500">
          Processing times by application month
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* First row: Jan-Jun */}
          <div className="grid grid-cols-6 gap-2">
            {firstRow.map((month) => (
              <MonthCell
                key={month.month}
                month={month}
                isBest={bestMonths[0] === month.month}
                isCurrentMonth={currentMonth === month.month}
              />
            ))}
          </div>

          {/* Second row: Jul-Dec */}
          <div className="grid grid-cols-6 gap-2">
            {secondRow.map((month) => (
              <MonthCell
                key={month.month}
                month={month}
                isBest={bestMonths[0] === month.month}
                isCurrentMonth={currentMonth === month.month}
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
            <span className="text-gray-600">Excellent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-lime-100 border border-lime-300" />
            <span className="text-gray-600">Good</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
            <span className="text-gray-600">Average</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
            <span className="text-gray-600">Slow</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
            <span className="text-gray-600">Avoid</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MonthCell({
  month,
  isBest,
  isCurrentMonth,
}: {
  month: MonthlyStats;
  isBest: boolean;
  isCurrentMonth: boolean;
}) {
  const bgColor = getMonthBgColor(month.rating);
  const textColor = getMonthTextColor(month.rating);

  return (
    <div
      className={`relative p-3 rounded-lg border-2 ${bgColor} ${
        isCurrentMonth ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'
      }`}
    >
      {isBest && (
        <div className="absolute -top-2 -right-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
        </div>
      )}
      <div className="text-center">
        <div className={`text-xs font-medium ${textColor}`}>
          {month.name.slice(0, 3)}
        </div>
        <div className={`text-lg font-bold ${textColor}`}>
          {month.count >= 5 ? month.median : '-'}
        </div>
        <div className="text-xs text-gray-500">
          {month.count >= 5 ? 'days' : 'n/a'}
        </div>
      </div>
      {isCurrentMonth && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
          <span className="text-[10px] font-medium text-blue-600 bg-white px-1 rounded">
            Now
          </span>
        </div>
      )}
    </div>
  );
}
