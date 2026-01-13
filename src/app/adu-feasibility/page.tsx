import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { FeasibilityClient } from './client';

export const dynamic = 'force-dynamic';

async function getNeighbourhoodList(): Promise<string[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const res = await fetch(`${baseUrl}/api/feasibility-score?type=neighbourhoods`, {
      cache: 'no-store',
    });

    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error('Failed to fetch neighbourhoods:', error);
    return [];
  }
}

function LoadingCard() {
  return <div className="animate-pulse bg-gray-100 rounded-xl h-48" />;
}

export default async function ADUFeasibilityPage() {
  const neighbourhoods = await getNeighbourhoodList();

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
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    ADU Feasibility Score
                  </h1>
                  <p className="text-gray-500 mt-1">
                    Check how favorable your neighbourhood is for building an ADU
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Info Banner */}
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What is an ADU?</p>
                <p className="text-blue-700">
                  An Accessory Dwelling Unit (ADU) includes secondary suites, laneway suites,
                  and garden suites. This score helps you understand how feasible it is to build
                  an ADU in your neighbourhood based on historical permit data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Component for Interactive Features */}
        <Suspense fallback={<LoadingCard />}>
          <FeasibilityClient neighbourhoods={neighbourhoods} />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gray-500 text-center">
            Scores are calculated based on historical permit data from{' '}
            <a
              href="https://open.toronto.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Toronto Open Data
            </a>
            . This tool provides general guidance and should not replace professional advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
