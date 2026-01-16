'use client';

import { TrendingUp, DollarSign, Clock, Percent } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  type ROIResults,
  formatCurrency,
  formatPercent,
  getCapRateRating,
  getCashOnCashRating,
} from '@/lib/roi-calculator';

interface ResultsDisplayProps {
  results: ROIResults;
}

const RATING_COLORS = {
  excellent: 'text-green-600 bg-green-100',
  good: 'text-blue-600 bg-blue-100',
  fair: 'text-amber-600 bg-amber-100',
  poor: 'text-red-600 bg-red-100',
};

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  const capRateRating = getCapRateRating(results.capRate);
  const cashOnCashRating = getCashOnCashRating(results.cashOnCashReturn);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Investment Returns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Cap Rate */}
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Cap Rate</div>
              <div className="text-3xl font-bold text-gray-900">
                {formatPercent(results.capRate)}
              </div>
              <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block mt-2 ${RATING_COLORS[capRateRating]}`}>
                {capRateRating.charAt(0).toUpperCase() + capRateRating.slice(1)}
              </div>
            </div>

            {/* Cash-on-Cash */}
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Cash-on-Cash Return</div>
              <div className="text-3xl font-bold text-gray-900">
                {formatPercent(results.cashOnCashReturn)}
              </div>
              <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block mt-2 ${RATING_COLORS[cashOnCashRating]}`}>
                {cashOnCashRating.charAt(0).toUpperCase() + cashOnCashRating.slice(1)}
              </div>
            </div>

            {/* Monthly Cash Flow */}
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Monthly Cash Flow</div>
              <div className={`text-3xl font-bold ${results.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(results.monthlyCashFlow)}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                After all expenses
              </div>
            </div>

            {/* Payback Period */}
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Payback Period</div>
              <div className="text-3xl font-bold text-gray-900">
                {results.paybackPeriodYears === Infinity ? '∞' : `${results.paybackPeriodYears}y`}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                To recover investment
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Investment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              Investment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Total Investment</span>
              <span className="font-semibold">{formatCurrency(results.totalInvestment)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Cash Needed</span>
              <span className="font-semibold">{formatCurrency(results.cashNeeded)}</span>
            </div>
            {results.mortgagePayment && (
              <>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Loan Amount</span>
                  <span className="font-semibold">
                    {formatCurrency(results.totalInvestment - results.cashNeeded)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Monthly Mortgage</span>
                  <span className="font-semibold">{formatCurrency(results.mortgagePayment)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Income & Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="w-4 h-4 text-gray-500" />
              Annual Income & Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Gross Rental Income</span>
              <span className="font-semibold text-green-600">
                +{formatCurrency(results.annualRentalIncome)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Operating Expenses (30%)</span>
              <span className="font-semibold text-red-600">
                -{formatCurrency(results.annualExpenses)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Net Operating Income</span>
              <span className="font-semibold">{formatCurrency(results.netOperatingIncome)}</span>
            </div>
            {results.annualDebtService && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Annual Debt Service</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(results.annualDebtService)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2 bg-gray-50 px-2 rounded">
              <span className="font-medium text-gray-700">Annual Cash Flow</span>
              <span className={`font-bold ${results.annualCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(results.annualCashFlow)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Return Benchmarks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Return Benchmarks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Cap Rate Gauge */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Cap Rate</span>
                <span className="font-medium">{formatPercent(results.capRate)}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-400 via-amber-400 to-green-400"
                  style={{ width: `${Math.min(results.capRate / 12 * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>4%</span>
                <span>8%</span>
                <span>12%+</span>
              </div>
            </div>

            {/* Cash-on-Cash Gauge */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Cash-on-Cash</span>
                <span className="font-medium">{formatPercent(results.cashOnCashReturn)}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-400 via-amber-400 to-green-400"
                  style={{ width: `${Math.min(results.cashOnCashReturn / 15 * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>5%</span>
                <span>10%</span>
                <span>15%+</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
