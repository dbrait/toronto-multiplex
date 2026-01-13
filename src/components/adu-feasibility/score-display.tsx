'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Award, BarChart3 } from 'lucide-react';
import type { FeasibilityScore } from '@/lib/scoring';
import { getGradeColor } from '@/lib/scoring';

interface ScoreDisplayProps {
  score: FeasibilityScore;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  const gradeColor = getGradeColor(score.grade);
  const vsCity = score.overallScore - score.comparison.cityAvgScore;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main Score Card */}
      <Card className="lg:col-span-2">
        <CardContent className="py-8">
          <div className="flex items-center gap-8">
            {/* Score Circle */}
            <div className="relative">
              <svg className="w-40 h-40 transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                {/* Score arc */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={gradeColor}
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(score.overallScore / 100) * 440} 440`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900">
                  {score.overallScore}
                </span>
                <span className="text-sm text-gray-500">out of 100</span>
              </div>
            </div>

            {/* Score Details */}
            <div className="flex-1">
              <div
                className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-2"
                style={{
                  backgroundColor: `${gradeColor}20`,
                  color: gradeColor,
                }}
              >
                {score.grade}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {score.neighbourhood}
              </h2>
              <p className="text-gray-600 mb-4">
                {getGradeDescription(score.grade)}
              </p>

              {/* Stats Row */}
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Total Permits</span>
                  <p className="font-semibold text-gray-900">{score.stats.totalPermits}</p>
                </div>
                <div>
                  <span className="text-gray-500">Completed</span>
                  <p className="font-semibold text-gray-900">{score.stats.completedPermits}</p>
                </div>
                <div>
                  <span className="text-gray-500">Units Created</span>
                  <p className="font-semibold text-gray-900">{score.stats.unitsCreated}</p>
                </div>
                <div>
                  <span className="text-gray-500">Avg. Processing</span>
                  <p className="font-semibold text-gray-900">
                    {score.stats.avgProcessingDays ? `${score.stats.avgProcessingDays} days` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Card */}
      <Card>
        <CardContent className="py-6 h-full flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-4">City Comparison</h3>

            {/* vs City Average */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">vs City Average</span>
                <span className={`flex items-center text-sm font-semibold ${
                  vsCity > 0 ? 'text-green-600' : vsCity < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {vsCity > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> :
                   vsCity < 0 ? <TrendingDown className="w-4 h-4 mr-1" /> :
                   <Minus className="w-4 h-4 mr-1" />}
                  {vsCity > 0 ? '+' : ''}{vsCity} pts
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${score.comparison.cityAvgScore}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                City average: {score.comparison.cityAvgScore}
              </p>
            </div>
          </div>

          {/* Ranking */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Neighbourhood Rank</p>
                <p className="font-semibold text-gray-900">
                  #{score.comparison.rank} of {score.comparison.totalNeighbourhoods}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Percentile</p>
                <p className="font-semibold text-gray-900">
                  Top {100 - score.comparison.percentile + 1}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getGradeDescription(grade: string): string {
  switch (grade) {
    case 'Excellent':
      return 'This neighbourhood has strong historical support for ADU development with fast processing times and high approval rates.';
    case 'Good':
      return 'This neighbourhood shows favorable conditions for ADU development with reasonable processing times and good precedent.';
    case 'Moderate':
      return 'This neighbourhood has mixed signals for ADU development. Consider consulting with a planning professional.';
    case 'Challenging':
      return 'This neighbourhood has fewer ADU precedents and may have longer processing times. Extra preparation recommended.';
    default:
      return '';
  }
}
