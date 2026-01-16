'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Loader2, Download, Printer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ReportPreview } from '@/components/reports/report-preview';
import type { ReportData } from '@/lib/report-generator';

interface ReportsClientProps {
  neighbourhoods: string[];
}

export function ReportsClient({ neighbourhoods }: ReportsClientProps) {
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState('');
  const [neighbourhoodSearch, setNeighbourhoodSearch] = useState('');
  const [isNeighbourhoodOpen, setIsNeighbourhoodOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredNeighbourhoods = neighbourhoods.filter((n) =>
    n.toLowerCase().includes(neighbourhoodSearch.toLowerCase())
  );

  // Fetch report data when neighbourhood changes
  useEffect(() => {
    if (selectedNeighbourhood) {
      fetchReportData();
    } else {
      setReportData(null);
    }
  }, [selectedNeighbourhood]);

  const fetchReportData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/reports?neighbourhood=${encodeURIComponent(selectedNeighbourhood)}`
      );

      if (!res.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await res.json();
      setReportData(data);
    } catch (err) {
      setError('Failed to load report data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Neighbourhood Selector */}
      <Card className="print:hidden">
        <CardContent className="py-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Neighbourhood
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
                placeholder="Search for a neighbourhood..."
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
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
            <p className="text-gray-500">Generating report...</p>
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

      {/* Report Preview with Actions */}
      {reportData && !isLoading && (
        <>
          {/* Action Buttons */}
          <div className="flex gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
          </div>

          <p className="text-sm text-gray-500 text-center print:hidden">
            Use your browser&apos;s print function (Ctrl/Cmd + P) to save as PDF
          </p>

          {/* Report Preview */}
          <div ref={printRef}>
            <ReportPreview data={reportData} />
          </div>
        </>
      )}

      {/* Empty State */}
      {!selectedNeighbourhood && !isLoading && (
        <Card className="bg-gray-50 border-dashed border-2 print:hidden">
          <CardContent className="py-12 text-center">
            <Download className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-600 mb-2">
              Select a Neighbourhood
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Choose a neighbourhood above to generate a comprehensive PDF report
              with permit statistics, trends, and comparisons.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
