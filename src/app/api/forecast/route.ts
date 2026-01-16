import { NextResponse } from 'next/server';
import {
  getActivePermitsWithIssuedDates,
  getHistoricalCompletions,
  getAvgCompletionDaysByNeighbourhood,
  getNeighbourhoodStats,
} from '@/lib/db-turso';
import {
  calculateCityForecast,
  calculateNeighbourhoodForecast,
  calculateSeasonalFactors,
} from '@/lib/forecasting';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const neighbourhood = searchParams.get('neighbourhood');

  try {
    // Fetch all required data
    const [activePermits, historicalCompletions, avgCompletionDays, neighbourhoodStats] =
      await Promise.all([
        getActivePermitsWithIssuedDates(),
        getHistoricalCompletions(24),
        getAvgCompletionDaysByNeighbourhood(),
        getNeighbourhoodStats(),
      ]);

    if (activePermits.length === 0) {
      return NextResponse.json(
        { error: 'No active permits found. Please sync data first.' },
        { status: 404 }
      );
    }

    // Single neighbourhood forecast
    if (neighbourhood) {
      const seasonalFactors = calculateSeasonalFactors(historicalCompletions);
      const avgDays = avgCompletionDays[neighbourhood] || null;

      const forecast = calculateNeighbourhoodForecast(
        neighbourhood,
        activePermits,
        avgDays,
        seasonalFactors
      );

      if (forecast.activePermitCount === 0) {
        return NextResponse.json(
          { error: `No active permits found for "${neighbourhood}"` },
          { status: 404 }
        );
      }

      return NextResponse.json(forecast);
    }

    // City-wide forecast
    const forecast = calculateCityForecast(
      activePermits,
      neighbourhoodStats,
      avgCompletionDays,
      historicalCompletions
    );

    return NextResponse.json(forecast);
  } catch (error) {
    console.error('Error generating forecast:', error);
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    );
  }
}
