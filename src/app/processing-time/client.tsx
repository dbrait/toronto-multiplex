'use client';

import { useState } from 'react';
import { Search, ChevronDown, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EstimateDisplay } from '@/components/processing-time/estimate-display';
import { DistributionChart } from '@/components/processing-time/distribution-chart';
import { formatCategoryName } from '@/lib/processing-predictor';
import type { ProcessingEstimate } from '@/lib/processing-predictor';

interface ProcessingTimeClientProps {
  categories: string[];
  neighbourhoods: string[];
}

interface PredictionResult {
  estimate: ProcessingEstimate;
  distribution: { range: string; count: number }[];
  neighbourhood: string;
  category: string;
}

export function ProcessingTimeClient({
  categories,
  neighbourhoods,
}: ProcessingTimeClientProps) {
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [neighbourhoodSearch, setNeighbourhoodSearch] = useState('');
  const [isNeighbourhoodOpen, setIsNeighbourhoodOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredNeighbourhoods = neighbourhoods.filter((n) =>
    n.toLowerCase().includes(neighbourhoodSearch.toLowerCase())
  );

  const handleGetEstimate = async () => {
    if (!selectedNeighbourhood || !selectedCategory) {
      setError('Please select both a neighbourhood and permit type');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/processing-time?neighbourhood=${encodeURIComponent(
          selectedNeighbourhood
        )}&category=${encodeURIComponent(selectedCategory)}`
      );

      if (!res.ok) {
        throw new Error('Failed to get estimate');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError('Failed to get estimate. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardContent className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Neighbourhood Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Neighbourhood
              </label>
              <div className="relative">
                <div
                  className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg cursor-pointer"
                  onClick={() => setIsNeighbourhoodOpen(!isNeighbourhoodOpen)}
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={isNeighbourhoodOpen ? neighbourhoodSearch : selectedNeighbourhood}
                    onChange={(e) => {
                      setNeighbourhoodSearch(e.target.value);
                      setIsNeighbourhoodOpen(true);
                    }}
                    onFocus={() => setIsNeighbourhoodOpen(true)}
                    placeholder="Select neighbourhood..."
                    className="flex-1 outline-none bg-transparent"
                  />
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isNeighbourhoodOpen ? 'rotate-180' : ''}`} />
                </div>

                {isNeighbourhoodOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredNeighbourhoods.length > 0 ? (
                      filteredNeighbourhoods.map((neighbourhood) => (
                        <button
                          key={neighbourhood}
                          onClick={() => {
                            setSelectedNeighbourhood(neighbourhood);
                            setNeighbourhoodSearch('');
                            setIsNeighbourhoodOpen(false);
                            setResult(null);
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                            selectedNeighbourhood === neighbourhood ? 'bg-blue-50 text-blue-600' : ''
                          }`}
                        >
                          {neighbourhood}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500">No neighbourhoods found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permit Type
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setResult(null);
                }}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg appearance-none cursor-pointer"
              >
                <option value="">Select permit type...</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {formatCategoryName(category)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Get Estimate Button */}
          <button
            onClick={handleGetEstimate}
            disabled={!selectedNeighbourhood || !selectedCategory || isLoading}
            className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                Get Estimate
              </>
            )}
          </button>

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          <EstimateDisplay
            estimate={result.estimate}
            neighbourhood={result.neighbourhood}
            category={result.category}
          />

          <DistributionChart
            distribution={result.distribution}
            estimatedDays={result.estimate.expected}
            neighbourhood={result.neighbourhood}
            category={result.category}
          />

          {/* Methodology Note */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="py-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                How This Estimate Works
              </h3>
              <p className="text-sm text-gray-600">
                This estimate is based on the median processing time for similar permits
                (same neighbourhood and type) from Toronto&apos;s historical permit data.
                The &quot;typical range&quot; shows the 25th to 75th percentile, meaning 50% of
                similar permits were processed within this timeframe. Actual processing
                time may vary based on project complexity and current city workload.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!result && !isLoading && (
        <Card className="bg-gray-50 border-dashed border-2">
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-600 mb-2">
              Select Your Permit Details
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Choose a neighbourhood and permit type above to see how long your
              permit application is likely to take based on historical data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
