'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { ReportData } from '@/lib/report-generator';

interface ReportPreviewProps {
  data: ReportData;
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
  'N/A': 'text-gray-600 bg-gray-100',
};

export function ReportPreview({ data }: ReportPreviewProps) {
  const generatedDate = new Date(data.generatedAt).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border-0">
      {/* Header */}
      <div className="p-6 border-b print:border-b-2">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {data.neighbourhood}
            </h1>
            <p className="text-gray-500">
              Multiplex & ADU Permit Report
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Generated: {generatedDate}</p>
            <p>Toronto Open Data</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-gray-900">
              {data.summary.totalPermits}
            </div>
            <div className="text-sm text-gray-500">Total Permits</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-600">
              {data.summary.unitsCreated}
            </div>
            <div className="text-sm text-gray-500">Units Created</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-600">
              {data.summary.avgProcessingDays || 'N/A'}
            </div>
            <div className="text-sm text-gray-500">Avg Processing Days</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-purple-600">
              {data.summary.approvalRate}%
            </div>
            <div className="text-sm text-gray-500">Approval Rate</div>
          </div>
        </div>
      </div>

      {/* Feasibility Score */}
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Feasibility Score
        </h2>
        <div className="flex items-center gap-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${GRADE_COLORS[data.feasibility.grade] || GRADE_COLORS['N/A']}`}>
            {data.feasibility.grade}
          </div>
          <div>
            <div className="text-lg font-semibold">
              Score: {data.feasibility.score}/100
            </div>
            <div className="text-gray-500">
              Rank: #{data.feasibility.rank} of {data.feasibility.totalNeighbourhoods} neighbourhoods
            </div>
          </div>
        </div>
      </div>

      {/* City Comparison */}
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Comparison to City Average
        </h2>
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="pb-2">Metric</th>
              <th className="pb-2 text-center">{data.neighbourhood}</th>
              <th className="pb-2 text-center">City Avg</th>
              <th className="pb-2 text-center">Difference</th>
            </tr>
          </thead>
          <tbody>
            {data.cityComparison.map((row) => (
              <tr key={row.metric} className="border-b last:border-0">
                <td className="py-3 text-gray-700">{row.metric}</td>
                <td className="py-3 text-center font-medium">{row.neighbourhood}</td>
                <td className="py-3 text-center text-gray-500">{row.cityAvg}</td>
                <td className={`py-3 text-center font-medium ${row.isBetter ? 'text-green-600' : 'text-red-600'}`}>
                  {row.difference > 0 ? '+' : ''}{row.difference}
                  {row.metric.includes('Rate') ? '%' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Category Breakdown */}
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Permit Types
        </h2>
        <div className="space-y-3">
          {data.categoryBreakdown.map((category) => (
            <div key={category.category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{category.category}</span>
                <span className="text-gray-500">
                  {category.count} ({category.percentage}%)
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trends */}
      {data.monthlyTrends.length > 0 && (
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Activity (Last 12 Months)
          </h2>
          <div className="flex items-end gap-1 h-32">
            {data.monthlyTrends.map((month) => {
              const maxCount = Math.max(...data.monthlyTrends.map((m) => m.count));
              const height = maxCount > 0 ? (month.count / maxCount) * 100 : 0;
              return (
                <div
                  key={month.month}
                  className="flex-1 flex flex-col items-center"
                >
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${height}%`, minHeight: month.count > 0 ? '4px' : '0' }}
                  />
                  <div className="text-xs text-gray-400 mt-1 rotate-45 origin-left">
                    {month.month.slice(5)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Permits */}
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Permits
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Address</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.recentPermits.slice(0, 10).map((permit, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2 text-gray-700">{permit.address}</td>
                <td className="py-2 text-gray-600">{permit.category}</td>
                <td className="py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    permit.status.toLowerCase().includes('complete') ||
                    permit.status.toLowerCase().includes('closed')
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {permit.status}
                  </span>
                </td>
                <td className="py-2 text-gray-500">{permit.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-6 bg-gray-50 text-center text-sm text-gray-500 print:bg-white">
        <p>
          Data sourced from Toronto Open Data - Building Permits Active Permits dataset.
        </p>
        <p className="mt-1">
          Generated by Toronto Multiplex & ADU Dashboard
        </p>
      </div>
    </div>
  );
}
