'use client';

import { useState, useEffect } from 'react';
import { Loader2, Search, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LeaderboardTable } from '@/components/contractors/leaderboard-table';
import { DisclaimerBanner } from '@/components/contractors/disclaimer-banner';
import type { ContractorLeaderboard } from '@/lib/contractor-extractor';

export function ContractorsClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ContractorLeaderboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [minPermits, setMinPermits] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [minPermits]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/contractors?minPermits=${minPermits}&limit=100`);

      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await res.json();
      setData(result);
    } catch (err) {
      setError('Failed to load contractor data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter contractors by search query
  const filteredContractors = data?.contractors.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <DisclaimerBanner />

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contractors..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Min Permits Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">
                Min Permits:
              </label>
              <select
                value={minPermits}
                onChange={(e) => setMinPermits(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="5">5+</option>
                <option value="10">10+</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      {data && !isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {data.contractors.length}
              </div>
              <div className="text-sm text-gray-500">Contractors Found</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {data.totalExtracted}
              </div>
              <div className="text-sm text-gray-500">Permits with Names</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {data.totalPermits}
              </div>
              <div className="text-sm text-gray-500">Total Permits</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {data.extractionRate}%
              </div>
              <div className="text-sm text-gray-500">Extraction Rate</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-4" />
            <p className="text-gray-500">Extracting contractor names from permits...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      {!isLoading && data && (
        <LeaderboardTable
          contractors={filteredContractors}
          searchQuery={searchQuery}
        />
      )}

      {/* Empty State */}
      {!isLoading && data && filteredContractors.length === 0 && (
        <Card className="bg-gray-50">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              {searchQuery
                ? 'No contractors match your search.'
                : 'No contractors found with the minimum permit threshold.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
