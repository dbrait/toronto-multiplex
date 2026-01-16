import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ForecastClient } from './client';
import type { CityForecast } from '@/lib/forecasting';

export const dynamic = 'force-dynamic';

async function getForecastData(): Promise<CityForecast | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const res = await fetch(`${baseUrl}/api/forecast`, {
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Failed to fetch forecast:', error);
    return null;
  }
}

function LoadingCard() {
  return <div className="animate-pulse bg-gray-100 rounded-xl h-48" />;
}

export default async function HousingForecastPage() {
  const forecast = await getForecastData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Housing Supply Forecast
                  </h1>
                  <p className="text-gray-500 mt-1">
                    12-month projection of new dwelling units by neighbourhood
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {!forecast ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">
                No forecast data available. Please sync permit data first.
              </p>
              <Link
                href="/"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Dashboard
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Suspense fallback={<LoadingCard />}>
            <ForecastClient forecast={forecast} />
          </Suspense>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gray-500 text-center">
            Forecasts are projections based on active permits and historical completion patterns.
            Actual results may vary due to construction delays, permit changes, or other factors.
          </p>
        </div>
      </footer>
    </div>
  );
}
