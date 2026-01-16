'use client';

import { Clock, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ProcessingEstimate, ConfidenceLevel } from '@/lib/processing-predictor';
import { getConfidenceColor } from '@/lib/processing-predictor';

interface EstimateDisplayProps {
  estimate: ProcessingEstimate;
  neighbourhood: string;
  category: string;
}

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  high: 'High Confidence',
  medium: 'Medium Confidence',
  low: 'Low Confidence',
};

export function EstimateDisplay({ estimate, neighbourhood, category }: EstimateDisplayProps) {
  const getDifferenceIcon = (days: number) => {
    if (days < -5) return <TrendingDown className="w-4 h-4 text-green-500" />;
    if (days > 5) return <TrendingUp className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatDifference = (days: number) => {
    if (Math.abs(days) < 5) return 'About average';
    const faster = days < 0;
    return `${Math.abs(days)} days ${faster ? 'faster' : 'slower'}`;
  };

  return (
    <div className="space-y-6">
      {/* Main Estimate Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-sm text-blue-600 font-medium uppercase tracking-wide mb-2">
              Estimated Processing Time
            </p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Clock className="w-8 h-8 text-blue-500" />
              <span className="text-6xl font-bold text-blue-700">
                {estimate.expected}
              </span>
              <span className="text-2xl text-blue-500 font-medium">days</span>
            </div>

            {/* Range */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
              <span className="text-sm text-gray-500">Typical range:</span>
              <span className="font-semibold text-gray-700">
                {estimate.range.low} - {estimate.range.high} days
              </span>
            </div>

            {/* Worst Case */}
            <p className="text-sm text-gray-500">
              Plan for up to <span className="font-semibold text-gray-700">{estimate.worstCase} days</span> in busy periods
            </p>

            {/* Confidence Indicator */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className="w-8 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        (estimate.confidence === 'high' && level <= 3) ||
                        (estimate.confidence === 'medium' && level <= 2) ||
                        (estimate.confidence === 'low' && level <= 1)
                          ? getConfidenceColor(estimate.confidence)
                          : '#e5e7eb',
                    }}
                  />
                ))}
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: getConfidenceColor(estimate.confidence) }}
              >
                {CONFIDENCE_LABELS[estimate.confidence]}
              </span>
              <span className="text-sm text-gray-400">
                ({estimate.sampleSize} similar permits)
              </span>
            </div>

            {/* Data Source Note */}
            {estimate.dataSource !== 'exact' && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span>
                  {estimate.dataSource === 'category'
                    ? 'Limited data for this neighbourhood - using city-wide category average'
                    : estimate.dataSource === 'neighbourhood'
                    ? 'Limited data for this permit type - using neighbourhood average'
                    : 'Limited data - using city-wide average'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* vs City Average */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">vs City Average</p>
                <div className="flex items-center gap-2 mt-1">
                  {getDifferenceIcon(estimate.comparison.vsCityDays)}
                  <span className={`font-semibold ${
                    estimate.comparison.vsCityDays < -5
                      ? 'text-green-600'
                      : estimate.comparison.vsCityDays > 5
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    {formatDifference(estimate.comparison.vsCityDays)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  City average: {estimate.comparison.cityAverage} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* vs Category Average */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">vs This Permit Type</p>
                <div className="flex items-center gap-2 mt-1">
                  {getDifferenceIcon(estimate.comparison.vsCategoryDays)}
                  <span className={`font-semibold ${
                    estimate.comparison.vsCategoryDays < -5
                      ? 'text-green-600'
                      : estimate.comparison.vsCategoryDays > 5
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    {formatDifference(estimate.comparison.vsCategoryDays)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Type average: {estimate.comparison.categoryAverage} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
