import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { CompareClient } from './client';
import type { ComparisonData } from '@/lib/comparison';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ neighbourhoods?: string }>;
}

async function getComparisonData(neighbourhoods?: string): Promise<ComparisonData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const url = neighbourhoods
      ? `${baseUrl}/api/compare?neighbourhoods=${encodeURIComponent(neighbourhoods)}`
      : `${baseUrl}/api/compare`;

    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Failed to fetch comparison data:', error);
    return null;
  }
}

function LoadingState() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-14 bg-gray-200 rounded-lg" />
      <div className="flex gap-4 overflow-x-auto">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="min-w-[280px] h-[450px] bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default async function ComparePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getComparisonData(params.neighbourhoods);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <GitCompare className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Neighbourhood Comparison
                  </h1>
                  <p className="text-gray-500">
                    Compare multiple neighbourhoods side-by-side
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingState />}>
          {data ? (
            <CompareClient
              initialData={data}
              initialSelected={params.neighbourhoods?.split(',').map(n => n.trim()).filter(n => n) || []}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <GitCompare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Unable to Load Data
              </h2>
              <p className="text-gray-500 mb-6">
                Please ensure the database has been synced with permit data.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
          )}
        </Suspense>
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
