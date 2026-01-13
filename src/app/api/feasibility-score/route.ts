import { NextResponse } from 'next/server';
import { getNeighbourhoodStats } from '@/lib/db-turso';
import {
  calculateFeasibilityScore,
  calculateAllNeighbourhoodScores,
  getCityAverageScore,
} from '@/lib/scoring';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const neighbourhood = searchParams.get('neighbourhood');
  const type = searchParams.get('type');

  try {
    const allStats = await getNeighbourhoodStats();

    if (allStats.length === 0) {
      return NextResponse.json(
        { error: 'No neighbourhood data available. Please sync data first.' },
        { status: 404 }
      );
    }

    // Return all neighbourhood rankings
    if (type === 'rankings') {
      const rankings = calculateAllNeighbourhoodScores(allStats);
      return NextResponse.json(rankings);
    }

    // Return city average score
    if (type === 'city-average') {
      const avgScore = getCityAverageScore(allStats);
      return NextResponse.json({ cityAverageScore: avgScore });
    }

    // Return list of neighbourhood names for dropdown
    if (type === 'neighbourhoods') {
      const names = allStats.map(s => s.name).sort();
      return NextResponse.json(names);
    }

    // Return score for specific neighbourhood
    if (neighbourhood) {
      const stats = allStats.find(
        s => s.name.toLowerCase() === neighbourhood.toLowerCase()
      );

      if (!stats) {
        return NextResponse.json(
          { error: `Neighbourhood "${neighbourhood}" not found` },
          { status: 404 }
        );
      }

      const score = calculateFeasibilityScore(stats, allStats);
      return NextResponse.json(score);
    }

    // Default: return all scores
    const rankings = calculateAllNeighbourhoodScores(allStats);
    return NextResponse.json(rankings);
  } catch (error) {
    console.error('Error calculating feasibility score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate feasibility score' },
      { status: 500 }
    );
  }
}
