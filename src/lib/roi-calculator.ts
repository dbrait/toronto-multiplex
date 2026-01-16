// ROI Calculator - Types and Calculation Logic

export interface ROIInputs {
  // Cost inputs (one of these)
  totalCost?: number;
  costPerSqft?: number;
  squareFootage?: number;

  // Revenue inputs
  numberOfUnits: number;
  monthlyRentPerUnit: number;

  // Optional financing
  useFinancing: boolean;
  downPaymentPercent?: number;
  interestRate?: number;
  loanTermYears?: number;

  // Operating expenses (optional)
  annualExpensesPercent?: number; // Default 30%
}

export interface ROIResults {
  totalInvestment: number;
  annualRentalIncome: number;
  annualExpenses: number;
  netOperatingIncome: number;
  capRate: number;

  // If financing
  mortgagePayment: number | null;
  annualDebtService: number | null;
  cashNeeded: number;
  annualCashFlow: number;
  cashOnCashReturn: number;

  // Timeline
  paybackPeriodYears: number;
  monthlyCashFlow: number;
}

export interface NeighbourhoodContext {
  name: string;
  avgProcessingDays: number | null;
  approvalRate: number;
  totalPermits: number;
  avgUnitsPerPermit: number;
  // Comparison to city
  processingVsCity: number; // negative = faster than city
  activityVsCity: number; // positive = more active than city
}

/**
 * Calculate monthly mortgage payment using standard amortization formula
 * P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateMortgagePayment(
  principal: number,
  annualRate: number,
  years: number
): number {
  if (principal <= 0 || annualRate <= 0 || years <= 0) return 0;

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;

  const payment =
    principal *
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  return Math.round(payment * 100) / 100;
}

/**
 * Calculate ROI metrics from inputs
 */
export function calculateROI(inputs: ROIInputs): ROIResults {
  // Calculate total investment
  let totalInvestment = inputs.totalCost || 0;
  if (!totalInvestment && inputs.costPerSqft && inputs.squareFootage) {
    totalInvestment = inputs.costPerSqft * inputs.squareFootage;
  }

  // Revenue calculations
  const annualRentalIncome = inputs.numberOfUnits * inputs.monthlyRentPerUnit * 12;

  // Operating expenses (default 30% of gross income)
  const expenseRate = (inputs.annualExpensesPercent || 30) / 100;
  const annualExpenses = annualRentalIncome * expenseRate;

  // Net Operating Income (NOI)
  const netOperatingIncome = annualRentalIncome - annualExpenses;

  // Cap Rate = NOI / Total Investment
  const capRate = totalInvestment > 0
    ? (netOperatingIncome / totalInvestment) * 100
    : 0;

  // Financing calculations
  let mortgagePayment: number | null = null;
  let annualDebtService: number | null = null;
  let cashNeeded = totalInvestment;
  let annualCashFlow = netOperatingIncome;

  if (inputs.useFinancing && inputs.downPaymentPercent && inputs.interestRate && inputs.loanTermYears) {
    const downPayment = totalInvestment * (inputs.downPaymentPercent / 100);
    const loanAmount = totalInvestment - downPayment;

    mortgagePayment = calculateMortgagePayment(
      loanAmount,
      inputs.interestRate,
      inputs.loanTermYears
    );

    annualDebtService = mortgagePayment * 12;
    cashNeeded = downPayment;
    annualCashFlow = netOperatingIncome - annualDebtService;
  }

  // Cash-on-Cash Return = Annual Cash Flow / Cash Invested
  const cashOnCashReturn = cashNeeded > 0
    ? (annualCashFlow / cashNeeded) * 100
    : 0;

  // Payback Period = Cash Invested / Annual Cash Flow
  const paybackPeriodYears = annualCashFlow > 0
    ? cashNeeded / annualCashFlow
    : Infinity;

  const monthlyCashFlow = annualCashFlow / 12;

  return {
    totalInvestment: Math.round(totalInvestment),
    annualRentalIncome: Math.round(annualRentalIncome),
    annualExpenses: Math.round(annualExpenses),
    netOperatingIncome: Math.round(netOperatingIncome),
    capRate: Math.round(capRate * 100) / 100,
    mortgagePayment,
    annualDebtService: annualDebtService ? Math.round(annualDebtService) : null,
    cashNeeded: Math.round(cashNeeded),
    annualCashFlow: Math.round(annualCashFlow),
    cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
    paybackPeriodYears: Math.round(paybackPeriodYears * 10) / 10,
    monthlyCashFlow: Math.round(monthlyCashFlow),
  };
}

/**
 * Get rating for cap rate
 */
export function getCapRateRating(capRate: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (capRate >= 8) return 'excellent';
  if (capRate >= 6) return 'good';
  if (capRate >= 4) return 'fair';
  return 'poor';
}

/**
 * Get rating for cash-on-cash return
 */
export function getCashOnCashRating(rate: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (rate >= 12) return 'excellent';
  if (rate >= 8) return 'good';
  if (rate >= 5) return 'fair';
  return 'poor';
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
