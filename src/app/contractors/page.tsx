import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { ContractorsClient } from './client';

export const dynamic = 'force-dynamic';

function LoadingState() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-24 bg-amber-100 rounded-xl" />
      <div className="h-64 bg-gray-200 rounded-xl" />
    </div>
  );
}

export default function ContractorsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Contractor Leaderboard
              </h1>
              <p className="text-gray-500">
                Most active contractors extracted from permit descriptions
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingState />}>
          <ContractorsClient />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gray-500 text-center">
            Data extracted from permit descriptions using pattern matching. Results are not verified.
          </p>
        </div>
      </footer>
    </div>
  );
}
