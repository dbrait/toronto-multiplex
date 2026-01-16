'use client';

import { Building2, Calendar, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ForecastChart } from '@/components/housing-forecast/forecast-chart';
import { NeighbourhoodTable } from '@/components/housing-forecast/neighbourhood-table';
import type { CityForecast } from '@/lib/forecasting';

interface ForecastClientProps {
  forecast: CityForecast;
}

export function ForecastClient({ forecast }: ForecastClientProps) {
  // Calculate summary stats
  const next3MonthsUnits = forecast.monthlyForecasts
    .slice(0, 3)
    .reduce((sum, m) => sum + m.projectedUnits, 0);

  const topNeighbourhood = forecast.byNeighbourhood[0];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="12-Month Projection"
          value={forecast.totalProjectedUnits.toLocaleString()}
          subtitle="total new units"
          icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
          bgColor="bg-purple-50"
        />
        <SummaryCard
          title="Next 3 Months"
          value={next3MonthsUnits.toLocaleString()}
          subtitle="high confidence"
          icon={<Calendar className="w-5 h-5 text-green-600" />}
          bgColor="bg-green-50"
        />
        <SummaryCard
          title="Active Pipeline"
          value={forecast.activePipelineUnits.toLocaleString()}
          subtitle={`${forecast.activePermitCount} permits`}
          icon={<Building2 className="w-5 h-5 text-blue-600" />}
          bgColor="bg-blue-50"
        />
        <SummaryCard
          title="Top Neighbourhood"
          value={topNeighbourhood?.neighbourhood || 'N/A'}
          subtitle={`${topNeighbourhood?.totalProjectedUnits.toLocaleString() || 0} units`}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          bgColor="bg-amber-50"
          smallValue
        />
      </div>

      {/* Forecast Chart */}
      <ForecastChart data={forecast.monthlyForecasts} />

      {/* Neighbourhood Breakdown */}
      <NeighbourhoodTable data={forecast.byNeighbourhood} />

      {/* Methodology Note */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="py-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            How This Forecast Works
          </h3>
          <p className="text-sm text-gray-600">
            This forecast estimates when active permits will complete based on historical
            completion patterns for each neighbourhood. Units are distributed across months
            using average completion times, with seasonal adjustments applied. Confidence
            levels decrease for projections further into the future.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Last updated: {new Date(forecast.generatedAt).toLocaleString()}
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
  smallValue?: boolean;
}

function SummaryCard({ title, value, subtitle, icon, bgColor, smallValue }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className={`font-bold text-gray-900 mt-1 ${smallValue ? 'text-lg' : 'text-2xl'}`}>
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
