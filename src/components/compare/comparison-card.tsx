'use client';

import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendSparkline } from '@/components/market-intelligence/trend-sparkline';
import { getCategoryColor } from '@/lib/market-intelligence';
import { getGradeColor } from '@/lib/scoring';
import type { NeighbourhoodComparison, CityAverages } from '@/lib/comparison';

interface ComparisonCardProps {
  data: NeighbourhoodComparison;
  cityAverages: CityAverages;
  onRemove: () => void;
}

export function ComparisonCard({ data, cityAverages, onRemove }: ComparisonCardProps) {
  const getChangeIndicator = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatChange = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value}%`;
  };

  return (
    <Card className="min-w-[280px] flex-shrink-0">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-lg pr-2">{data.name}</h3>
          <button
            onClick={onRemove}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scores Section */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Hot Zone Score */}
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: getCategoryColor(data.hotZone.category) + '15' }}>
            <div
              className="text-2xl font-bold"
              style={{ color: getCategoryColor(data.hotZone.category) }}
            >
              {data.hotZone.score}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Hot Zone</div>
            <div
              className="text-xs font-medium capitalize mt-1"
              style={{ color: getCategoryColor(data.hotZone.category) }}
            >
              {data.hotZone.category}
            </div>
          </div>

          {/* Feasibility Score */}
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: getGradeColor(data.feasibility.grade) + '15' }}>
            <div
              className="text-2xl font-bold"
              style={{ color: getGradeColor(data.feasibility.grade) }}
            >
              {data.feasibility.score}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Feasibility</div>
            <div
              className="text-xs font-medium mt-1"
              style={{ color: getGradeColor(data.feasibility.grade) }}
            >
              {data.feasibility.grade}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total Permits</span>
            <span className="font-medium text-gray-900">{data.stats.totalPermits}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Active</span>
            <span className="font-medium text-gray-900">{data.stats.activePermits}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Units Created</span>
            <span className="font-medium text-gray-900">{data.stats.totalUnits}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Avg Processing</span>
            <span className="font-medium text-gray-900">
              {data.stats.avgProcessingDays ? `${data.stats.avgProcessingDays} days` : 'N/A'}
            </span>
          </div>
        </div>

        {/* YoY Change */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
          <span className="text-sm text-gray-600">YoY Change</span>
          <div className="flex items-center gap-1">
            {getChangeIndicator(data.yoy.change)}
            <span className={`font-semibold ${data.yoy.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatChange(data.yoy.change)}
            </span>
          </div>
        </div>

        {/* Forecast */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">12-Mo Forecast</span>
            <span className="font-medium text-purple-600">{data.forecast.projected12Months} units</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Active Pipeline</span>
            <span className="font-medium text-gray-900">{data.forecast.activePipeline} units</span>
          </div>
        </div>

        {/* Momentum */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="text-gray-500">Momentum</span>
          <div className="flex items-center gap-1">
            {getChangeIndicator(data.hotZone.momentum)}
            <span className={data.hotZone.momentum >= 0 ? 'text-green-600' : 'text-red-600'}>
              {data.hotZone.momentum > 0 ? '+' : ''}{data.hotZone.momentum}
            </span>
          </div>
        </div>

        {/* Trend Sparkline */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">6-Month Trend</span>
          </div>
          <div className="h-12">
            {data.monthlyTrend.length > 0 ? (
              <TrendSparkline data={data.monthlyTrend} />
            ) : (
              <div className="h-full bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                No trend data
              </div>
            )}
          </div>
        </div>

        {/* Rank */}
        <div className="mt-3 pt-3 border-t text-center">
          <span className="text-xs text-gray-500">
            Ranked #{data.feasibility.rank} in feasibility
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
