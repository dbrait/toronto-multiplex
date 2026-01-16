'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GitCompare, Plus } from 'lucide-react';
import { NeighbourhoodSelector } from '@/components/compare/neighbourhood-selector';
import { ComparisonCard } from '@/components/compare/comparison-card';
import { Card, CardContent } from '@/components/ui/card';
import type { ComparisonData, NeighbourhoodComparison } from '@/lib/comparison';

interface CompareClientProps {
  initialData: ComparisonData;
  initialSelected: string[];
}

export function CompareClient({ initialData, initialSelected }: CompareClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [comparisons, setComparisons] = useState<NeighbourhoodComparison[]>(initialData.neighbourhoods);
  const [isLoading, setIsLoading] = useState(false);

  // Update URL when selection changes
  const updateURL = useCallback((neighbourhoods: string[]) => {
    const params = new URLSearchParams();
    if (neighbourhoods.length > 0) {
      params.set('neighbourhoods', neighbourhoods.join(','));
    }
    const newUrl = neighbourhoods.length > 0 ? `?${params.toString()}` : '/compare';
    router.replace(newUrl, { scroll: false });
  }, [router]);

  // Fetch comparison data when selection changes
  const fetchComparisons = useCallback(async (neighbourhoods: string[]) => {
    if (neighbourhoods.length === 0) {
      setComparisons([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/compare?neighbourhoods=${encodeURIComponent(neighbourhoods.join(','))}`);
      if (res.ok) {
        const data: ComparisonData = await res.json();
        setComparisons(data.neighbourhoods);
      }
    } catch (error) {
      console.error('Failed to fetch comparison data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle adding a neighbourhood
  const handleAdd = useCallback((neighbourhood: string) => {
    const newSelected = [...selected, neighbourhood];
    setSelected(newSelected);
    updateURL(newSelected);
    fetchComparisons(newSelected);
  }, [selected, updateURL, fetchComparisons]);

  // Handle removing a neighbourhood
  const handleRemove = useCallback((neighbourhood: string) => {
    const newSelected = selected.filter(n => n !== neighbourhood);
    setSelected(newSelected);
    setComparisons(comparisons.filter(c => c.name !== neighbourhood));
    updateURL(newSelected);
  }, [selected, comparisons, updateURL]);

  // Handle clearing all
  const handleClearAll = useCallback(() => {
    setSelected([]);
    setComparisons([]);
    updateURL([]);
  }, [updateURL]);

  return (
    <div className="space-y-6">
      {/* Selector */}
      <Card>
        <CardContent className="p-4">
          <NeighbourhoodSelector
            allNeighbourhoods={initialData.allNeighbourhoodNames}
            selected={selected}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onClearAll={handleClearAll}
          />
        </CardContent>
      </Card>

      {/* City Averages Context */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <span>City Averages:</span>
          <span>Permits: {initialData.cityAverages.totalPermits}</span>
          <span>Processing: {initialData.cityAverages.avgProcessingDays} days</span>
          <span>Feasibility: {initialData.cityAverages.feasibilityScore}</span>
          <span>Hot Zone: {initialData.cityAverages.hotZoneScore}</span>
          <span>YoY: {initialData.cityAverages.yoyChange >= 0 ? '+' : ''}{initialData.cityAverages.yoyChange}%</span>
        </div>
      )}

      {/* Comparison Cards */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {selected.map((_, i) => (
            <div key={i} className="min-w-[280px] h-[450px] bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : comparisons.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {comparisons.map((comparison) => (
            <ComparisonCard
              key={comparison.name}
              data={comparison}
              cityAverages={initialData.cityAverages}
              onRemove={() => handleRemove(comparison.name)}
            />
          ))}
          {/* Add More Card */}
          <Card className="min-w-[280px] flex-shrink-0 border-dashed border-2 bg-gray-50">
            <CardContent className="p-4 h-full flex flex-col items-center justify-center text-gray-400">
              <Plus className="w-8 h-8 mb-2" />
              <p className="text-sm text-center">
                Use the search above to add more neighbourhoods
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Empty State */
        <Card className="bg-white">
          <CardContent className="py-12 text-center">
            <GitCompare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Start Comparing Neighbourhoods
            </h2>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Use the search box above to add neighbourhoods. You can compare as many as you like
              to see permits, feasibility scores, hot zone ratings, and more side-by-side.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-sm text-gray-400">Popular comparisons:</span>
              {['Trinity-Bellwoods', 'Leslieville', 'The Beaches'].map((name) => (
                initialData.allNeighbourhoodNames.includes(name) && (
                  <button
                    key={name}
                    onClick={() => handleAdd(name)}
                    className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
                  >
                    + {name}
                  </button>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Methodology Note */}
      {selected.length > 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="py-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              About These Metrics
            </h3>
            <p className="text-sm text-gray-600">
              <strong>Hot Zone Score</strong> (0-100) measures development activity combining permit volume, YoY growth, and recent momentum.{' '}
              <strong>Feasibility Score</strong> (0-100) rates ADU development potential based on approval rates, processing speed, activity level, and ADU density.{' '}
              <strong>Forecast</strong> projects housing units expected to complete in the next 12 months based on current active permits and historical completion times.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Last updated: {new Date(initialData.generatedAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
