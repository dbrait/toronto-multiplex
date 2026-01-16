import { NextResponse } from 'next/server';
import {
  getProcessingDaysData,
  getProcessingTimeDistributionFiltered,
  getAllCategories,
  getAllNeighbourhoods,
} from '@/lib/db-turso';
import { predictProcessingTime, calculateStats } from '@/lib/processing-predictor';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const neighbourhood = searchParams.get('neighbourhood');
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    // Return list of options for dropdowns
    if (type === 'options') {
      const [categories, neighbourhoods] = await Promise.all([
        getAllCategories(),
        getAllNeighbourhoods(),
      ]);

      return NextResponse.json({
        categories,
        neighbourhoods,
      });
    }

    // Return prediction
    if (neighbourhood && category) {
      // Fetch all required data in parallel
      const [
        exactData,
        cityData,
        categoryData,
        neighbourhoodData,
        distribution,
      ] = await Promise.all([
        getProcessingDaysData(neighbourhood, category),
        getProcessingDaysData(),
        getProcessingDaysData(undefined, category),
        getProcessingDaysData(neighbourhood),
        getProcessingTimeDistributionFiltered(neighbourhood, category),
      ]);

      const estimate = predictProcessingTime({
        processingDays: exactData,
        cityProcessingDays: cityData,
        categoryProcessingDays: categoryData,
        neighbourhoodProcessingDays: neighbourhoodData,
      });

      // Get city-wide distribution for comparison
      const cityDistribution = await getProcessingTimeDistributionFiltered();

      return NextResponse.json({
        estimate,
        distribution,
        cityDistribution,
        neighbourhood,
        category,
        generatedAt: new Date().toISOString(),
      });
    }

    // Return city-wide stats if no filters
    const cityData = await getProcessingDaysData();
    const cityStats = calculateStats(cityData);
    const distribution = await getProcessingTimeDistributionFiltered();

    return NextResponse.json({
      cityStats,
      distribution,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Processing time API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate processing time estimate' },
      { status: 500 }
    );
  }
}
