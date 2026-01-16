'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, DollarSign, Building, Percent } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResultsDisplay } from '@/components/roi-calculator/results-display';
import {
  calculateROI,
  type ROIInputs,
  type ROIResults,
  type NeighbourhoodContext,
} from '@/lib/roi-calculator';

interface ROICalculatorClientProps {
  neighbourhoods: string[];
}

export function ROICalculatorClient({ neighbourhoods }: ROICalculatorClientProps) {
  // Input state
  const [costMode, setCostMode] = useState<'total' | 'perSqft'>('total');
  const [totalCost, setTotalCost] = useState<string>('500000');
  const [costPerSqft, setCostPerSqft] = useState<string>('300');
  const [squareFootage, setSquareFootage] = useState<string>('1500');
  const [numberOfUnits, setNumberOfUnits] = useState<string>('2');
  const [monthlyRent, setMonthlyRent] = useState<string>('2000');

  // Financing state
  const [showFinancing, setShowFinancing] = useState(false);
  const [useFinancing, setUseFinancing] = useState(false);
  const [downPayment, setDownPayment] = useState<string>('20');
  const [interestRate, setInterestRate] = useState<string>('5.5');
  const [loanTerm, setLoanTerm] = useState<string>('25');

  // Neighbourhood state
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState('');
  const [neighbourhoodSearch, setNeighbourhoodSearch] = useState('');
  const [isNeighbourhoodOpen, setIsNeighbourhoodOpen] = useState(false);
  const [neighbourhoodContext, setNeighbourhoodContext] = useState<NeighbourhoodContext | null>(null);

  // Filter neighbourhoods
  const filteredNeighbourhoods = neighbourhoods.filter((n) =>
    n.toLowerCase().includes(neighbourhoodSearch.toLowerCase())
  );

  // Fetch neighbourhood context when selected
  useEffect(() => {
    if (selectedNeighbourhood) {
      fetch(`/api/roi-calculator?neighbourhood=${encodeURIComponent(selectedNeighbourhood)}`)
        .then((res) => res.json())
        .then((data) => setNeighbourhoodContext(data))
        .catch(() => setNeighbourhoodContext(null));
    } else {
      setNeighbourhoodContext(null);
    }
  }, [selectedNeighbourhood]);

  // Calculate ROI
  const results: ROIResults | null = useMemo(() => {
    const inputs: ROIInputs = {
      totalCost: costMode === 'total' ? parseFloat(totalCost) || 0 : undefined,
      costPerSqft: costMode === 'perSqft' ? parseFloat(costPerSqft) || 0 : undefined,
      squareFootage: costMode === 'perSqft' ? parseFloat(squareFootage) || 0 : undefined,
      numberOfUnits: parseInt(numberOfUnits) || 0,
      monthlyRentPerUnit: parseFloat(monthlyRent) || 0,
      useFinancing,
      downPaymentPercent: useFinancing ? parseFloat(downPayment) || 20 : undefined,
      interestRate: useFinancing ? parseFloat(interestRate) || 5 : undefined,
      loanTermYears: useFinancing ? parseInt(loanTerm) || 25 : undefined,
    };

    if (inputs.numberOfUnits > 0 && inputs.monthlyRentPerUnit > 0) {
      const investment = inputs.totalCost || (inputs.costPerSqft || 0) * (inputs.squareFootage || 0);
      if (investment > 0) {
        return calculateROI(inputs);
      }
    }
    return null;
  }, [costMode, totalCost, costPerSqft, squareFootage, numberOfUnits, monthlyRent, useFinancing, downPayment, interestRate, loanTerm]);

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Investment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cost Input Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Construction Cost
            </label>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setCostMode('total')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  costMode === 'total'
                    ? 'bg-green-100 text-green-700 border-2 border-green-500'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                }`}
              >
                Total Cost
              </button>
              <button
                onClick={() => setCostMode('perSqft')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  costMode === 'perSqft'
                    ? 'bg-green-100 text-green-700 border-2 border-green-500'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                }`}
              >
                Cost per Sqft
              </button>
            </div>

            {costMode === 'total' ? (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  placeholder="500000"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cost per Sqft</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={costPerSqft}
                      onChange={(e) => setCostPerSqft(e.target.value)}
                      placeholder="300"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Square Footage</label>
                  <input
                    type="number"
                    value={squareFootage}
                    onChange={(e) => setSquareFootage(e.target.value)}
                    placeholder="1500"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Revenue Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Units
              </label>
              <input
                type="number"
                value={numberOfUnits}
                onChange={(e) => setNumberOfUnits(e.target.value)}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Rent per Unit
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  placeholder="2000"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Financing Toggle */}
          <div>
            <button
              onClick={() => setShowFinancing(!showFinancing)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {showFinancing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Financing Options
            </button>

            {showFinancing && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useFinancing}
                    onChange={(e) => setUseFinancing(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Include mortgage financing</span>
                </label>

                {useFinancing && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Down Payment %</label>
                      <input
                        type="number"
                        value={downPayment}
                        onChange={(e) => setDownPayment(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Interest Rate %</label>
                      <input
                        type="number"
                        step="0.1"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Loan Term (Years)</label>
                      <input
                        type="number"
                        value={loanTerm}
                        onChange={(e) => setLoanTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Neighbourhood Context (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            Neighbourhood Context (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                placeholder="Select a neighbourhood for context..."
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

          {neighbourhoodContext && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">Avg Processing</div>
                <div className="text-lg font-semibold">
                  {neighbourhoodContext.avgProcessingDays || 'N/A'} days
                </div>
                {neighbourhoodContext.processingVsCity !== 0 && (
                  <div className={`text-xs ${neighbourhoodContext.processingVsCity < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {neighbourhoodContext.processingVsCity > 0 ? '+' : ''}{neighbourhoodContext.processingVsCity} vs city
                  </div>
                )}
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">Approval Rate</div>
                <div className="text-lg font-semibold">{neighbourhoodContext.approvalRate}%</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">Total Permits</div>
                <div className="text-lg font-semibold">{neighbourhoodContext.totalPermits}</div>
                <div className={`text-xs ${neighbourhoodContext.activityVsCity > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                  {neighbourhoodContext.activityVsCity > 0 ? '+' : ''}{neighbourhoodContext.activityVsCity}% vs avg
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">Avg Units/Permit</div>
                <div className="text-lg font-semibold">{neighbourhoodContext.avgUnitsPerPermit}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results && <ResultsDisplay results={results} />}

      {/* Methodology Note */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="py-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            How This Calculator Works
          </h3>
          <p className="text-sm text-gray-600">
            This calculator estimates ROI based on your inputs. Operating expenses are estimated at 30% of gross rental income
            (covering property tax, insurance, maintenance, vacancy). Cap rate = Net Operating Income / Total Investment.
            Cash-on-cash return = Annual Cash Flow / Cash Invested. Actual returns will vary based on market conditions,
            property specifics, and management.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
