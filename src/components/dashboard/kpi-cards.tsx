'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import {
  Building2,
  CheckCircle2,
  Home,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface KPIData {
  totalActivePermits: number;
  totalCompletedPermits: number;
  totalUnitsCreated: number;
  avgProcessingDays: number;
  permitsThisYear: number;
  permitsLastYear: number;
  yearOverYearChange: number;
}

interface KPICardsProps {
  data: KPIData;
}

export function KPICards({ data }: KPICardsProps) {
  const cards = [
    {
      title: 'Active Permits',
      value: formatNumber(data.totalActivePermits),
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Completed Permits',
      value: formatNumber(data.totalCompletedPermits),
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Units Created',
      value: formatNumber(data.totalUnitsCreated),
      icon: Home,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Avg. Processing Time',
      value: `${data.avgProcessingDays} days`,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Year over Year Card */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Permits This Year vs Last Year
              </p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-2xl font-bold text-gray-900">
                  {formatNumber(data.permitsThisYear)}
                </span>
                <span className="text-gray-400">vs</span>
                <span className="text-xl text-gray-500">
                  {formatNumber(data.permitsLastYear)}
                </span>
              </div>
            </div>
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                data.yearOverYearChange >= 0
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {data.yearOverYearChange >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="font-medium">
                {data.yearOverYearChange >= 0 ? '+' : ''}
                {data.yearOverYearChange}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
