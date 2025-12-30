import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/dashboard/data-table';
import { getPermitsByNeighbourhood, getNeighbourhoodStats } from '@/lib/db-turso';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import { ArrowLeft, Building2, Home, Clock, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function NeighbourhoodPage({ params }: PageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const permits = await getPermitsByNeighbourhood(decodedName);
  const allStats = await getNeighbourhoodStats();
  const stats = allStats.find((s) => s.name === decodedName);

  if (!stats || permits.length === 0) {
    notFound();
  }

  const categoryBreakdown = Object.entries(stats.byCategory)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{decodedName}</h1>
          <p className="text-gray-500 mt-1">
            Neighbourhood permit statistics and details
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Permits</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.totalPermits)}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-50">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.activePermits)}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-amber-50">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.completedPermits)}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Units Created</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.totalUnitsCreated)}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-50">
                  <Home className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Permit Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categoryBreakdown.map(([category, count]) => (
                <div
                  key={category}
                  className="p-4 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: CATEGORY_COLORS[category] || '#6b7280',
                      }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {CATEGORY_LABELS[category] || category}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Processing Time */}
        {stats.avgProcessingDays && (
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Average Processing Time
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.avgProcessingDays} days
                  </p>
                </div>
                <div className="text-sm text-gray-500 max-w-xs">
                  Time from application submission to permit issuance
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Permits Table */}
        <DataTable
          data={permits.map((p) => ({
            id: p.id,
            permitNum: p.permitNum,
            address: p.address,
            structureType: p.structureType,
            category: p.category,
            status: p.status,
            applicationDate: p.applicationDate.toISOString(),
            issuedDate: p.issuedDate?.toISOString() || null,
            dwellingUnitsCreated: p.dwellingUnitsCreated,
            processingDays: p.processingDays,
            neighbourhood: p.neighbourhood,
          }))}
        />
      </main>
    </div>
  );
}
