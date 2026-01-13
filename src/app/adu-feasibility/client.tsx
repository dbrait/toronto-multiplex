'use client';

import { useState } from 'react';
import { LocationInput } from '@/components/adu-feasibility/location-input';
import { ScoreDisplay } from '@/components/adu-feasibility/score-display';
import { FactorBreakdown } from '@/components/adu-feasibility/factor-breakdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin } from 'lucide-react';
import type { FeasibilityScore } from '@/lib/scoring';

interface FeasibilityClientProps {
  neighbourhoods: string[];
}

export function FeasibilityClient({ neighbourhoods }: FeasibilityClientProps) {
  const [score, setScore] = useState<FeasibilityScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNeighbourhoodSelect = async (neighbourhood: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/feasibility-score?neighbourhood=${encodeURIComponent(neighbourhood)}`
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch score');
      }

      const data = await res.json();
      setScore(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setScore(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (neighbourhoods.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">
            No neighbourhood data available. Please sync data from the main dashboard first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Location Input */}
      <LocationInput
        neighbourhoods={neighbourhoods}
        onSelect={handleNeighbourhoodSelect}
        isLoading={isLoading}
      />

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Calculating feasibility score...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Score Display */}
      {score && !isLoading && (
        <>
          <ScoreDisplay score={score} />
          <FactorBreakdown score={score} />

          {/* Top Neighbourhoods Comparison */}
          <TopNeighbourhoodsCard currentNeighbourhood={score.neighbourhood} />
        </>
      )}

      {/* Empty State */}
      {!score && !isLoading && !error && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select a Neighbourhood
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Choose a neighbourhood from the dropdown or enter an address to see the
              ADU feasibility score based on historical permit data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface TopNeighbourhoodsCardProps {
  currentNeighbourhood: string;
}

function TopNeighbourhoodsCard({ currentNeighbourhood }: TopNeighbourhoodsCardProps) {
  const [rankings, setRankings] = useState<
    Array<{ neighbourhood: string; score: number; grade: string; rank: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch rankings on mount
  useState(() => {
    fetch('/api/feasibility-score?type=rankings')
      .then((res) => res.json())
      .then((data) => {
        setRankings(data.slice(0, 10)); // Top 10
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  });

  if (isLoading) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Neighbourhoods for ADU Development</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rankings.map((item) => (
            <div
              key={item.neighbourhood}
              className={`flex items-center justify-between p-3 rounded-lg ${
                item.neighbourhood === currentNeighbourhood
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                  {item.rank}
                </span>
                <span
                  className={`font-medium ${
                    item.neighbourhood === currentNeighbourhood
                      ? 'text-blue-700'
                      : 'text-gray-900'
                  }`}
                >
                  {item.neighbourhood}
                  {item.neighbourhood === currentNeighbourhood && (
                    <span className="ml-2 text-xs text-blue-600">(Selected)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${getGradeBadgeClasses(
                    item.grade
                  )}`}
                >
                  {item.grade}
                </span>
                <span className="font-semibold text-gray-900">{item.score}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getGradeBadgeClasses(grade: string): string {
  switch (grade) {
    case 'Excellent':
      return 'bg-green-100 text-green-700';
    case 'Good':
      return 'bg-yellow-100 text-yellow-700';
    case 'Moderate':
      return 'bg-orange-100 text-orange-700';
    case 'Challenging':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}
