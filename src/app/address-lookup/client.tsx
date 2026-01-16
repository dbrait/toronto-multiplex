'use client';

import { useState } from 'react';
import { Search, Loader2, MapPin, Building, Award, Clock, Home } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LocationMap } from '@/components/address-lookup/location-map';
import { NearbyPermits } from '@/components/address-lookup/nearby-permits';

interface AddressResult {
  input: string;
  formatted: string;
  lat: number;
  lng: number;
}

interface NeighbourhoodData {
  name: string;
  stats: {
    totalPermits: number;
    activePermits: number;
    completedPermits: number;
    unitsCreated: number;
    avgProcessingDays: number | null;
  };
  feasibility: {
    score: number;
    grade: string;
    rank: number;
    totalNeighbourhoods: number;
  } | null;
}

interface NearbyPermit {
  id: string;
  address: string;
  category: string;
  categoryDisplay: string;
  status: string;
  distance: number;
  latitude: number;
  longitude: number;
  applicationDate: string;
}

interface CategoryCount {
  category: string;
  categoryDisplay: string;
  count: number;
}

interface LookupResult {
  address: AddressResult;
  neighbourhood: NeighbourhoodData | null;
  nearbyPermits: NearbyPermit[];
  summary: {
    total: number;
    byCategory: CategoryCount[];
    avgDistanceKm: number;
    radiusKm: number;
  };
}

const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-green-600 bg-green-100',
  A: 'text-green-600 bg-green-100',
  'A-': 'text-green-600 bg-green-100',
  'B+': 'text-blue-600 bg-blue-100',
  B: 'text-blue-600 bg-blue-100',
  'B-': 'text-blue-600 bg-blue-100',
  'C+': 'text-amber-600 bg-amber-100',
  C: 'text-amber-600 bg-amber-100',
  'C-': 'text-amber-600 bg-amber-100',
  D: 'text-red-600 bg-red-100',
  F: 'text-red-600 bg-red-100',
};

export function AddressLookupClient() {
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/address-lookup?address=${encodeURIComponent(address.trim())}`
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to lookup address');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardContent className="py-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter a Toronto address (e.g., 100 Queen St W)"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !address.trim()}
              className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6">
            <p className="text-red-600 text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Address Found */}
          <Card className="bg-teal-50 border-teal-200">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal-600 mt-0.5" />
                <div>
                  <p className="font-medium text-teal-900">{result.address.formatted}</p>
                  <p className="text-sm text-teal-700 mt-1">
                    Coordinates: {result.address.lat.toFixed(4)}, {result.address.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle>Location Map</CardTitle>
            </CardHeader>
            <CardContent>
              <LocationMap
                searchLocation={{
                  lat: result.address.lat,
                  lng: result.address.lng,
                  formatted: result.address.formatted,
                }}
                permits={result.nearbyPermits}
                radiusKm={result.summary.radiusKm}
              />
            </CardContent>
          </Card>

          {/* Neighbourhood Stats */}
          {result.neighbourhood && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Neighbourhood: {result.neighbourhood.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <Building className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                    <div className="text-2xl font-bold text-gray-900">
                      {result.neighbourhood.stats.totalPermits}
                    </div>
                    <div className="text-sm text-gray-500">Total Permits</div>
                  </div>

                  {result.neighbourhood.feasibility && (
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <Award className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                      <div
                        className={`text-2xl font-bold px-3 py-1 rounded-full inline-block ${
                          GRADE_COLORS[result.neighbourhood.feasibility.grade] ||
                          'text-gray-600 bg-gray-100'
                        }`}
                      >
                        {result.neighbourhood.feasibility.grade}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Feasibility (#{result.neighbourhood.feasibility.rank})
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <Clock className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                    <div className="text-2xl font-bold text-gray-900">
                      {result.neighbourhood.stats.avgProcessingDays || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">Avg Days</div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <Home className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                    <div className="text-2xl font-bold text-green-600">
                      {result.neighbourhood.stats.unitsCreated}
                    </div>
                    <div className="text-sm text-gray-500">Units Created</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Stats */}
          {result.summary.byCategory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Permit Types Nearby</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {result.summary.byCategory.map((cat) => (
                    <div
                      key={cat.category}
                      className="p-3 bg-gray-50 rounded-lg text-center"
                    >
                      <div className="text-xl font-bold text-gray-900">
                        {cat.count}
                      </div>
                      <div className="text-sm text-gray-500">{cat.categoryDisplay}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nearby Permits Table */}
          <NearbyPermits
            permits={result.nearbyPermits}
            radiusKm={result.summary.radiusKm}
          />
        </>
      )}

      {/* Empty State */}
      {!result && !isLoading && !error && (
        <Card className="bg-gray-50 border-dashed border-2">
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-600 mb-2">
              Enter an Address to Search
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Search for any Toronto address to see nearby multiplex and ADU permits,
              neighbourhood statistics, and feasibility scores.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
