'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Building2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { NeighbourhoodForecast } from '@/lib/forecasting';

interface NeighbourhoodTableProps {
  data: NeighbourhoodForecast[];
}

type SortField = 'neighbourhood' | 'totalProjectedUnits' | 'activePipelineUnits' | 'avgCompletionDays';

export function NeighbourhoodTable({ data }: NeighbourhoodTableProps) {
  const [sortField, setSortField] = useState<SortField>('totalProjectedUnits');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let aVal: string | number = a[sortField] ?? 0;
      let bVal: string | number = b[sortField] ?? 0;

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    });
  }, [data, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-400" />
          Forecast by Neighbourhood
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th
                  className="text-left py-3 px-4 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('neighbourhood')}
                >
                  Neighbourhood
                  <SortIcon field="neighbourhood" />
                </th>
                <th
                  className="text-right py-3 px-4 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('totalProjectedUnits')}
                >
                  12-Mo Projection
                  <SortIcon field="totalProjectedUnits" />
                </th>
                <th
                  className="text-right py-3 px-4 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('activePipelineUnits')}
                >
                  Active Pipeline
                  <SortIcon field="activePipelineUnits" />
                </th>
                <th
                  className="text-right py-3 px-4 text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('avgCompletionDays')}
                >
                  Avg Completion
                  <SortIcon field="avgCompletionDays" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.slice(0, 20).map((item, index) => (
                <tr
                  key={item.neighbourhood}
                  className={`border-b border-gray-100 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } hover:bg-blue-50 transition-colors`}
                >
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">
                      {item.neighbourhood}
                    </span>
                    <span className="text-gray-400 text-sm ml-2">
                      ({item.activePermitCount} permits)
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className="font-semibold text-blue-600">
                      {item.totalProjectedUnits.toLocaleString()}
                    </span>
                    <span className="text-gray-400 text-sm ml-1">units</span>
                  </td>
                  <td className="text-right py-3 px-4 text-gray-600">
                    {item.activePipelineUnits.toLocaleString()} units
                  </td>
                  <td className="text-right py-3 px-4 text-gray-600">
                    {item.avgCompletionDays
                      ? `${item.avgCompletionDays} days`
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.length > 20 && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            Showing top 20 of {data.length} neighbourhoods
          </p>
        )}
      </CardContent>
    </Card>
  );
}
