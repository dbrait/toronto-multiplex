'use client';

import { useState, useEffect } from 'react';
import { Loader2, Building, TrendingUp, TrendingDown, Minus, Home, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UnitsTimeline } from '@/components/density-impact/units-timeline';
import { NeighbourhoodRankings } from '@/components/density-impact/neighbourhood-rankings';
import { CategoryBreakdown } from '@/components/density-impact/category-breakdown';

interface CityTotal {
  totalUnits: number;
  totalPermits: number;
  avgUnitsPerPermit: number;
  yoyGrowthPercent: number;
  thisYearUnits: number;
  lastYearUnits: number;
}

interface TimelineData {
  month: string;
  units: number;
  cumulative: number;
}

interface NeighbourhoodData {
  name: string;
  units: number;
  permits: number;
  avgUnitsPerPermit: number;
  yoyGrowth: number;
  thisYearUnits: number;
  lastYearUnits: number;
}

interface CategoryData {
  category: string;
  units: number;
  permits: number;
  percentage: number;
}

interface DensityData {
  cityTotal: CityTotal;
  timeline: TimelineData[];
  neighbourhoods: NeighbourhoodData[];
  byCategory: CategoryData[];
}

export function DensityImpactClient() {
  const [data, setData] = useState<DensityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/density-impact');
        if (!res.ok) throw new Error('Failed to fetch data');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError('Failed to load density data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500 mb-4" />
          <p className="text-gray-500">Loading density data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-6 text-center">
          <p className="text-red-600">{error || 'No data available'}</p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (growth < 0) return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* City-Wide Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-6 text-center">
            <Home className="w-6 h-6 mx-auto mb-2 text-rose-500" />
            <div className="text-3xl font-bold text-gray-900">
              {data.cityTotal.totalUnits.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Total Units Created</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6 text-center">
            <FileText className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="text-3xl font-bold text-gray-900">
              {data.cityTotal.totalPermits.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Total Permits</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6 text-center">
            <Building className="w-6 h-6 mx-auto mb-2 text-violet-500" />
            <div className="text-3xl font-bold text-gray-900">
              {data.cityTotal.avgUnitsPerPermit}
            </div>
            <div className="text-sm text-gray-500">Avg Units/Permit</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6 text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              {getTrendIcon(data.cityTotal.yoyGrowthPercent)}
            </div>
            <div className={`text-3xl font-bold ${
              data.cityTotal.yoyGrowthPercent > 0
                ? 'text-green-600'
                : data.cityTotal.yoyGrowthPercent < 0
                ? 'text-red-600'
                : 'text-gray-900'
            }`}>
              {data.cityTotal.yoyGrowthPercent > 0 ? '+' : ''}
              {data.cityTotal.yoyGrowthPercent}%
            </div>
            <div className="text-sm text-gray-500">Year-over-Year</div>
            <div className="text-xs text-gray-400 mt-1">
              {data.cityTotal.thisYearUnits} vs {data.cityTotal.lastYearUnits}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      {data.timeline.length > 0 && (
        <UnitsTimeline data={data.timeline} />
      )}

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        {data.byCategory.length > 0 && (
          <CategoryBreakdown data={data.byCategory} />
        )}

        {/* Quick Stats */}
        <Card>
          <CardContent className="py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
            <div className="space-y-4">
              {data.neighbourhoods.length > 0 && (
                <div className="p-4 bg-rose-50 rounded-lg">
                  <div className="text-sm text-rose-600 font-medium">Top Contributor</div>
                  <div className="text-xl font-bold text-gray-900">
                    {data.neighbourhoods[0].name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {data.neighbourhoods[0].units.toLocaleString()} units from{' '}
                    {data.neighbourhoods[0].permits.toLocaleString()} permits
                  </div>
                </div>
              )}

              {data.byCategory.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Most Common Type</div>
                  <div className="text-xl font-bold text-gray-900 capitalize">
                    {data.byCategory[0].category.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {data.byCategory[0].percentage}% of all units created
                  </div>
                </div>
              )}

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Active Neighbourhoods</div>
                <div className="text-xl font-bold text-gray-900">
                  {data.neighbourhoods.length}
                </div>
                <div className="text-sm text-gray-500">
                  neighbourhoods with multiplex activity
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Neighbourhood Rankings */}
      {data.neighbourhoods.length > 0 && (
        <NeighbourhoodRankings data={data.neighbourhoods} />
      )}
    </div>
  );
}
