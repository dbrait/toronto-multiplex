'use client';

import { useState } from 'react';
import { Flame, TrendingUp, Building2, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Heatmap } from '@/components/market-intelligence/heatmap';
import { RankingsTable } from '@/components/market-intelligence/rankings-table';
import type { MarketIntelligence, HotZoneCategory } from '@/lib/market-intelligence';
import { getCategoryColor } from '@/lib/market-intelligence';

interface MarketIntelligenceClientProps {
  data: MarketIntelligence;
}

const CATEGORY_OPTIONS: { value: HotZoneCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Zones' },
  { value: 'hot', label: 'Hot' },
  { value: 'warming', label: 'Warming' },
  { value: 'stable', label: 'Stable' },
  { value: 'cooling', label: 'Cooling' },
];

export function MarketIntelligenceClient({ data }: MarketIntelligenceClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<HotZoneCategory | 'all'>('all');
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState<string | null>(null);

  const handleNeighbourhoodClick = (neighbourhood: string) => {
    setSelectedNeighbourhood(selectedNeighbourhood === neighbourhood ? null : neighbourhood);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Hot Neighbourhoods"
          value={data.cityStats.hotNeighbourhoodCount.toString()}
          subtitle="high development activity"
          icon={<Flame className="w-5 h-5 text-red-600" />}
          bgColor="bg-red-50"
        />
        <SummaryCard
          title="Warming Areas"
          value={data.cityStats.warmingNeighbourhoodCount.toString()}
          subtitle="increasing momentum"
          icon={<TrendingUp className="w-5 h-5 text-orange-600" />}
          bgColor="bg-orange-50"
        />
        <SummaryCard
          title="City-Wide YoY"
          value={`${data.cityStats.yoyChange >= 0 ? '+' : ''}${data.cityStats.yoyChange}%`}
          subtitle="permit change"
          icon={<Building2 className="w-5 h-5 text-blue-600" />}
          bgColor="bg-blue-50"
          valueColor={data.cityStats.yoyChange >= 0 ? 'text-green-600' : 'text-red-600'}
        />
        <SummaryCard
          title="Active Permits"
          value={data.cityStats.totalActivePermits.toLocaleString()}
          subtitle={`${data.cityStats.totalUnits.toLocaleString()} units`}
          icon={<MapPin className="w-5 h-5 text-purple-600" />}
          bgColor="bg-purple-50"
        />
      </div>

      {/* Emerging Areas Highlight */}
      {data.emergingAreas.length > 0 && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">Emerging Areas</h3>
                <p className="text-sm text-amber-700 mt-1">
                  These neighbourhoods show strong recent momentum and are accelerating in development activity:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.emergingAreas.map((area) => (
                    <span
                      key={area}
                      className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full cursor-pointer hover:bg-amber-200 transition-colors"
                      onClick={() => handleNeighbourhoodClick(area)}
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedCategory(option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === option.value
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
            style={
              selectedCategory === option.value && option.value !== 'all'
                ? { backgroundColor: getCategoryColor(option.value as HotZoneCategory) }
                : undefined
            }
          >
            {option.label}
            {option.value !== 'all' && (
              <span className="ml-2 text-xs opacity-75">
                ({data.hotZones.filter((hz) => hz.category === option.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Heatmap */}
      <Heatmap
        data={data.hotZones}
        selectedCategory={selectedCategory}
        onNeighbourhoodClick={handleNeighbourhoodClick}
      />

      {/* Rankings Table */}
      <RankingsTable
        data={
          selectedCategory === 'all'
            ? data.hotZones
            : data.hotZones.filter((hz) => hz.category === selectedCategory)
        }
        onRowClick={handleNeighbourhoodClick}
        selectedNeighbourhood={selectedNeighbourhood}
      />

      {/* Methodology Note */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="py-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            How Hot Zone Scores Work
          </h3>
          <p className="text-sm text-gray-600">
            Hot Zone Scores (0-100) are calculated using a weighted combination of:
            <span className="font-medium"> Total Activity (30%)</span> - permit volume relative to the busiest neighbourhood,
            <span className="font-medium"> Year-over-Year Growth (35%)</span> - change vs same period last year, and
            <span className="font-medium"> Recent Momentum (35%)</span> - 6-month trend direction.
            Higher scores indicate areas with both strong current activity and positive growth trends.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Last updated: {new Date(data.generatedAt).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
  valueColor?: string;
}

function SummaryCard({ title, value, subtitle, icon, bgColor, valueColor }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${valueColor || 'text-gray-900'}`}>
              {value}
            </p>
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          </div>
          <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
