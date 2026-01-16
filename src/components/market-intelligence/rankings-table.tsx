'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown } from 'lucide-react';
import type { NeighbourhoodIntelligence, HotZoneCategory } from '@/lib/market-intelligence';
import { getCategoryColor } from '@/lib/market-intelligence';
import { TrendSparkline } from './trend-sparkline';

interface RankingsTableProps {
  data: NeighbourhoodIntelligence[];
  onRowClick?: (neighbourhood: string) => void;
  selectedNeighbourhood?: string | null;
}

type SortField = 'score' | 'permits' | 'units' | 'yoy' | 'momentum';
type SortDirection = 'asc' | 'desc';

const CATEGORY_LABELS: Record<HotZoneCategory, string> = {
  hot: 'Hot',
  warming: 'Warming',
  stable: 'Stable',
  cooling: 'Cooling',
};

export function RankingsTable({ data, onRowClick, selectedNeighbourhood }: RankingsTableProps) {
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aVal: number, bVal: number;
    switch (sortField) {
      case 'score':
        aVal = a.hotZoneScore;
        bVal = b.hotZoneScore;
        break;
      case 'permits':
        aVal = a.metrics.totalPermits;
        bVal = b.metrics.totalPermits;
        break;
      case 'units':
        aVal = a.metrics.totalUnits;
        bVal = b.metrics.totalUnits;
        break;
      case 'yoy':
        aVal = a.metrics.yoyChange;
        bVal = b.metrics.yoyChange;
        break;
      case 'momentum':
        aVal = a.metrics.recentMomentum;
        bVal = b.metrics.recentMomentum;
        break;
    }
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
        )}
      </div>
    </th>
  );

  const getMomentumIcon = (momentum: number) => {
    if (momentum > 10) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (momentum < -10) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hot Zone Rankings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Neighbourhood
                </th>
                <SortHeader field="score">Score</SortHeader>
                <SortHeader field="permits">Permits</SortHeader>
                <SortHeader field="units">Units</SortHeader>
                <SortHeader field="yoy">YoY</SortHeader>
                <SortHeader field="momentum">Momentum</SortHeader>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.slice(0, 25).map((zone, index) => (
                <tr
                  key={zone.neighbourhood}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedNeighbourhood === zone.neighbourhood ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => onRowClick?.(zone.neighbourhood)}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{zone.neighbourhood}</span>
                      <span
                        className="px-2 py-0.5 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: getCategoryColor(zone.category) + '20',
                          color: getCategoryColor(zone.category),
                        }}
                      >
                        {CATEGORY_LABELS[zone.category]}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: getCategoryColor(zone.category) }}
                      >
                        {zone.hotZoneScore}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {zone.metrics.totalPermits}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {zone.metrics.totalUnits}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={zone.metrics.yoyChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {zone.metrics.yoyChange >= 0 ? '+' : ''}{zone.metrics.yoyChange}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {getMomentumIcon(zone.metrics.recentMomentum)}
                      <span className="text-sm text-gray-600">
                        {zone.metrics.recentMomentum > 0 ? '+' : ''}{zone.metrics.recentMomentum}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <TrendSparkline data={zone.monthlyTrend} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > 25 && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            Showing top 25 of {data.length} neighbourhoods
          </p>
        )}
      </CardContent>
    </Card>
  );
}
