import { Suspense } from 'react';
import Link from 'next/link';
import { KPICards } from '@/components/dashboard/kpi-cards';
import { AllCharts } from '@/components/dashboard/charts';
import { PermitMap } from '@/components/dashboard/map';
import { DataTable } from '@/components/dashboard/data-table';
import { RefreshCw, Home as HomeIcon, TrendingUp, Flame, GitCompare } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Server-side data fetching
async function getDashboardData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const [kpiRes, trendsRes, categoriesRes, processingRes, neighbourhoodsRes, mapRes, permitsRes] =
      await Promise.all([
        fetch(`${baseUrl}/api/permits?type=kpi`, { cache: 'no-store' }),
        fetch(`${baseUrl}/api/permits?type=trends&months=24`, { cache: 'no-store' }),
        fetch(`${baseUrl}/api/permits?type=categories`, { cache: 'no-store' }),
        fetch(`${baseUrl}/api/permits?type=processing`, { cache: 'no-store' }),
        fetch(`${baseUrl}/api/permits?type=neighbourhoods`, { cache: 'no-store' }),
        fetch(`${baseUrl}/api/permits?type=map`, { cache: 'no-store' }),
        fetch(`${baseUrl}/api/permits?type=all`, { cache: 'no-store' }),
      ]);

    // Check if we have data (database might be empty initially)
    if (!kpiRes.ok) {
      return null;
    }

    const [kpi, trends, categories, processing, neighbourhoods, mapData, permitsData] =
      await Promise.all([
        kpiRes.json(),
        trendsRes.json(),
        categoriesRes.json(),
        processingRes.json(),
        neighbourhoodsRes.json(),
        mapRes.json(),
        permitsRes.json(),
      ]);

    return {
      kpi,
      trends,
      categories,
      processing,
      neighbourhoods,
      mapData,
      permits: permitsData.permits || [],
    };
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return null;
  }
}

function LoadingCard() {
  return (
    <div className="animate-pulse bg-gray-100 rounded-xl h-48" />
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Toronto Multiplex & ADU Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Tracking gentle density housing permits across Toronto
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Data Yet
          </h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            The database is empty. Click the button below to fetch permit data from
            Toronto Open Data.
          </p>
          <SyncButton />
        </div>
      </main>
    </div>
  );
}

function SyncButton() {
  return (
    <form
      action={async () => {
        'use server';
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/sync`, { method: 'POST' });
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Sync Data from Toronto Open Data
      </button>
    </form>
  );
}

export default async function Home() {
  const data = await getDashboardData();

  if (!data || data.kpi.totalActivePermits === 0) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Toronto Multiplex & ADU Dashboard
              </h1>
              <p className="text-gray-500 mt-1">
                Tracking gentle density housing permits across Toronto
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/adu-feasibility"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <HomeIcon className="h-4 w-4" />
                ADU Feasibility
              </Link>
              <Link
                href="/housing-forecast"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                Supply Forecast
              </Link>
              <Link
                href="/market-intelligence"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <Flame className="h-4 w-4" />
                Hot Zones
              </Link>
              <Link
                href="/compare"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <GitCompare className="h-4 w-4" />
                Compare
              </Link>
              <SyncButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Cards */}
        <section>
          <Suspense fallback={<LoadingCard />}>
            <KPICards data={data.kpi} />
          </Suspense>
        </section>

        {/* Map */}
        <section>
          <Suspense fallback={<LoadingCard />}>
            <PermitMap data={data.mapData} />
          </Suspense>
        </section>

        {/* Charts */}
        <section>
          <Suspense fallback={<LoadingCard />}>
            <AllCharts
              trends={data.trends}
              categories={data.categories}
              processing={data.processing}
              neighbourhoods={data.neighbourhoods}
            />
          </Suspense>
        </section>

        {/* Data Table */}
        <section>
          <Suspense fallback={<LoadingCard />}>
            <DataTable data={data.permits} />
          </Suspense>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gray-500 text-center">
            Data sourced from{' '}
            <a
              href="https://open.toronto.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Toronto Open Data
            </a>
            . Building Permits - Active Permits dataset.
          </p>
        </div>
      </footer>
    </div>
  );
}
