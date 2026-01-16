'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Map } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AnimatedMap } from '@/components/heatmap-timeline/animated-map';
import { TimelineControls } from '@/components/heatmap-timeline/timeline-controls';
import { CATEGORY_COLORS } from '@/lib/constants';

interface Permit {
  lat: number;
  lng: number;
  category: string;
  address: string;
  neighbourhood: string | null;
}

interface MonthData {
  month: string;
  permits: Permit[];
  summary: {
    total: number;
    byCategory: Record<string, number>;
  };
}

interface TimelineData {
  months: MonthData[];
  dateRange: {
    start: string;
    end: string;
  };
  totalPermits: number;
}

export function HeatmapTimelineClient() {
  const [data, setData] = useState<TimelineData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [showCumulative, setShowCumulative] = useState(true);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/heatmap-timeline?months=24');
        if (!res.ok) throw new Error('Failed to fetch data');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError('Failed to load timeline data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying || !data) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= data.months.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [isPlaying, speed, data]);

  const handlePlay = useCallback(() => {
    if (data && currentIndex >= data.months.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(true);
  }, [data, currentIndex]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    if (data) {
      setCurrentIndex((prev) => Math.min(data.months.length - 1, prev + 1));
    }
  }, [data]);

  const handleSeek = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-violet-500 mb-4" />
          <p className="text-gray-500">Loading timeline data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-6 text-center">
          <p className="text-red-600">{error || 'No data available'}</p>
        </CardContent>
      </Card>
    );
  }

  if (data.months.length === 0) {
    return (
      <Card className="bg-gray-50 border-dashed border-2">
        <CardContent className="py-12 text-center">
          <Map className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-600 mb-2">No Data Available</h2>
          <p className="text-gray-500">
            No permit data with coordinates found. Please sync data first.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentMonth = data.months[currentIndex];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {data.totalPermits.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Total Permits</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-violet-600">
              {data.months.length}
            </div>
            <div className="text-sm text-gray-500">Months of Data</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {currentMonth?.summary.total || 0}
            </div>
            <div className="text-sm text-gray-500">This Month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {showCumulative
                ? data.months
                    .slice(0, currentIndex + 1)
                    .reduce((sum, m) => sum + m.summary.total, 0)
                : currentMonth?.summary.total || 0}
            </div>
            <div className="text-sm text-gray-500">
              {showCumulative ? 'Cumulative' : 'Current'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center justify-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCumulative}
            onChange={(e) => setShowCumulative(e.target.checked)}
            className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
          />
          <span className="text-sm text-gray-700">Show cumulative permits</span>
        </label>
      </div>

      {/* Map */}
      <AnimatedMap
        months={data.months}
        currentIndex={currentIndex}
        showCumulative={showCumulative}
      />

      {/* Timeline Controls */}
      <TimelineControls
        currentIndex={currentIndex}
        totalMonths={data.months.length}
        isPlaying={isPlaying}
        speed={speed}
        currentMonth={currentMonth?.month || ''}
        onPlay={handlePlay}
        onPause={handlePause}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSeek={handleSeek}
        onSpeedChange={handleSpeedChange}
      />

      {/* Category Breakdown for Current Month */}
      {currentMonth && Object.keys(currentMonth.summary.byCategory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permits by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(currentMonth.summary.byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <div
                    key={category}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[category] || '#6b7280' }}
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 justify-center">
            {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
              <div key={category} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600 capitalize">
                  {category.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
