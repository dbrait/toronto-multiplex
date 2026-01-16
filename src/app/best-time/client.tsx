'use client';

import { useState, useEffect } from 'react';
import { Loader2, Calendar, Trophy, AlertTriangle, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { MonthHeatmap } from '@/components/best-time/month-heatmap';
import { MonthlyChart } from '@/components/best-time/monthly-chart';
import { formatCategoryName } from '@/lib/processing-predictor';
import type { BestTimeAnalysis, MonthlyStats } from '@/lib/best-time';

interface BestTimeClientProps {
  categories: string[];
}

interface AnalysisResult extends BestTimeAnalysis {
  category: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function BestTimeClient({ categories }: BestTimeClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalysis();
  }, [selectedCategory]);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = selectedCategory
        ? `/api/best-time?category=${encodeURIComponent(selectedCategory)}`
        : '/api/best-time';

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error('Failed to fetch analysis');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError('Failed to load analysis. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Permit Type:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg"
            >
              <option value="">All Types</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {formatCategoryName(category)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
            <p className="text-gray-500">Analyzing seasonal patterns...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && result && (
        <>
          {/* Recommendation Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-blue-900 mb-2">
                    Recommendation
                  </h2>
                  <p className="text-blue-800">
                    {result.recommendation}
                  </p>
                  <p className="text-sm text-blue-600 mt-2">
                    Based on {result.totalSamples.toLocaleString()} historical permits
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best/Worst Months Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Best Months */}
            <Card className="border-green-200">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">Best Months</h3>
                </div>
                <div className="flex gap-2">
                  {result.bestMonths.map((month, i) => {
                    const stats = result.byMonth.find((m) => m.month === month);
                    return (
                      <div
                        key={month}
                        className={`flex-1 p-3 rounded-lg ${
                          i === 0 ? 'bg-green-100' : 'bg-green-50'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-xs text-green-600 font-medium">
                            {i === 0 ? 'BEST' : `#${i + 1}`}
                          </div>
                          <div className="text-lg font-bold text-green-800">
                            {MONTH_NAMES[month - 1]}
                          </div>
                          <div className="text-sm text-green-600">
                            {stats?.median || 0} days
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Worst Months */}
            <Card className="border-red-200">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-800">Avoid These Months</h3>
                </div>
                <div className="flex gap-2">
                  {result.worstMonths.map((month, i) => {
                    const stats = result.byMonth.find((m) => m.month === month);
                    return (
                      <div
                        key={month}
                        className={`flex-1 p-3 rounded-lg ${
                          i === 0 ? 'bg-red-100' : 'bg-red-50'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-xs text-red-600 font-medium">
                            {i === 0 ? 'SLOWEST' : `#${12 - i}`}
                          </div>
                          <div className="text-lg font-bold text-red-800">
                            {MONTH_NAMES[month - 1]}
                          </div>
                          <div className="text-sm text-red-600">
                            {stats?.median || 0} days
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Chart */}
          <MonthlyChart
            data={result.byMonth}
            overallMedian={result.overallMedian}
            bestMonths={result.bestMonths}
          />

          {/* Calendar Heatmap */}
          <MonthHeatmap data={result.byMonth} bestMonths={result.bestMonths} />

          {/* Methodology Note */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="py-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                How This Analysis Works
              </h3>
              <p className="text-sm text-gray-600">
                This analysis groups historical permits by the month they were submitted
                and calculates the median processing time for each month. Months are ranked
                from fastest to slowest, with a minimum of 5 permits required for reliable
                data. Processing time patterns can reflect seasonal workload variations at
                the city&apos;s building department.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!isLoading && !result && !error && (
        <Card className="bg-gray-50 border-dashed border-2">
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-600 mb-2">
              No Data Available
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              There isn&apos;t enough permit data to analyze seasonal patterns yet.
              Please sync more data from Toronto Open Data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
