'use client';

import { useState } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface NeighbourhoodData {
  name: string;
  units: number;
  permits: number;
  avgUnitsPerPermit: number;
  yoyGrowth: number;
  thisYearUnits: number;
  lastYearUnits: number;
}

interface NeighbourhoodRankingsProps {
  data: NeighbourhoodData[];
}

type SortKey = 'units' | 'permits' | 'avgUnitsPerPermit' | 'yoyGrowth';

export function NeighbourhoodRankings({ data }: NeighbourhoodRankingsProps) {
  const [sortKey, setSortKey] = useState<SortKey>('units');
  const [sortAsc, setSortAsc] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const multiplier = sortAsc ? 1 : -1;
    return (a[sortKey] - b[sortKey]) * multiplier;
  });

  const displayedData = showAll ? sortedData : sortedData.slice(0, 15);

  const getTrendIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (growth < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const SortButton = ({ label, field }: { label: string; field: SortKey }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-gray-900 transition-colors"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortKey === field ? 'text-rose-500' : ''}`} />
    </button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neighbourhood Rankings by Units Created</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Rank</th>
                <th className="pb-3 font-medium">Neighbourhood</th>
                <th className="pb-3 font-medium text-right">
                  <SortButton label="Units" field="units" />
                </th>
                <th className="pb-3 font-medium text-right">
                  <SortButton label="Permits" field="permits" />
                </th>
                <th className="pb-3 font-medium text-right">
                  <SortButton label="Units/Permit" field="avgUnitsPerPermit" />
                </th>
                <th className="pb-3 font-medium text-right">
                  <SortButton label="YoY Growth" field="yoyGrowth" />
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedData.map((neighbourhood, index) => (
                <tr key={neighbourhood.name} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 text-gray-400 font-mono">
                    #{sortedData.indexOf(neighbourhood) + 1}
                  </td>
                  <td className="py-3 font-medium text-gray-900">
                    {neighbourhood.name}
                  </td>
                  <td className="py-3 text-right">
                    <span className="font-semibold text-rose-600">
                      {neighbourhood.units.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 text-right text-gray-600">
                    {neighbourhood.permits.toLocaleString()}
                  </td>
                  <td className="py-3 text-right text-gray-600">
                    {neighbourhood.avgUnitsPerPermit.toFixed(2)}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {getTrendIcon(neighbourhood.yoyGrowth)}
                      <span className={getTrendColor(neighbourhood.yoyGrowth)}>
                        {neighbourhood.yoyGrowth > 0 ? '+' : ''}
                        {neighbourhood.yoyGrowth}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.length > 15 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Top 15
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show All {data.length} Neighbourhoods
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
