'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Layers, Clock, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { ContractorStats, ConfidenceLevel } from '@/lib/contractor-extractor';
import { formatCategoryName } from '@/lib/contractor-extractor';

interface LeaderboardTableProps {
  contractors: ContractorStats[];
  searchQuery: string;
}

const CONFIDENCE_STYLES: Record<ConfidenceLevel, { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-green-100', text: 'text-green-700', label: 'High' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium' },
  low: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Low' },
};

export function LeaderboardTable({ contractors, searchQuery }: LeaderboardTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (name: string) => {
    setExpandedRow(expandedRow === name ? null : name);
  };

  // Highlight search matches
  const highlightMatch = (text: string) => {
    if (!searchQuery) return text;
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-yellow-200 font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contractor Rankings</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contractor
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permits
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recent
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contractors.map((contractor, index) => (
                <>
                  <tr
                    key={contractor.name}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      expandedRow === contractor.name ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => toggleRow(contractor.name)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                        index < 3
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">
                        {highlightMatch(contractor.name)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contractor.neighbourhoods.slice(0, 2).join(', ')}
                        {contractor.neighbourhoods.length > 2 && ` +${contractor.neighbourhoods.length - 2} more`}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-lg font-semibold text-gray-900">
                        {contractor.permitCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-sm ${contractor.recentPermits > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                        {contractor.recentPermits > 0 ? `${contractor.recentPermits} this year` : 'None'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${CONFIDENCE_STYLES[contractor.confidence].bg} ${CONFIDENCE_STYLES[contractor.confidence].text}`}>
                        {CONFIDENCE_STYLES[contractor.confidence].label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {expandedRow === contractor.name ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 inline" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 inline" />
                      )}
                    </td>
                  </tr>

                  {/* Expanded Details */}
                  {expandedRow === contractor.name && (
                    <tr className="bg-blue-50">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Neighbourhoods */}
                          <div className="p-3 bg-white rounded-lg">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                              <MapPin className="w-4 h-4" />
                              Neighbourhoods
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {contractor.neighbourhoods.map((n) => (
                                <span
                                  key={n}
                                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                                >
                                  {n}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Categories */}
                          <div className="p-3 bg-white rounded-lg">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                              <Layers className="w-4 h-4" />
                              Project Types
                            </div>
                            <div className="space-y-1">
                              {contractor.categories.slice(0, 4).map((c) => (
                                <div key={c.category} className="flex justify-between text-sm">
                                  <span className="text-gray-600">
                                    {formatCategoryName(c.category)}
                                  </span>
                                  <span className="font-medium">{c.count}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="p-3 bg-white rounded-lg">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                              <TrendingUp className="w-4 h-4" />
                              Performance
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Avg Processing</span>
                                <span className="font-medium">
                                  {contractor.avgProcessingDays
                                    ? `${contractor.avgProcessingDays} days`
                                    : 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Permits</span>
                                <span className="font-medium">{contractor.permitCount}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Last 12 Months</span>
                                <span className="font-medium">{contractor.recentPermits}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
