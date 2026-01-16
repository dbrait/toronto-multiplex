import { NextRequest, NextResponse } from 'next/server';
import { getPermitDescriptions } from '@/lib/db-turso';
import { buildContractorLeaderboard } from '@/lib/contractor-extractor';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minPermits = parseInt(searchParams.get('minPermits') || '2');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get all permit descriptions
    const permits = await getPermitDescriptions();

    if (!permits || permits.length === 0) {
      return NextResponse.json(
        { error: 'No permit data available' },
        { status: 404 }
      );
    }

    // Build the leaderboard
    const leaderboard = buildContractorLeaderboard(permits, minPermits);

    // Limit results
    const limitedContractors = leaderboard.contractors.slice(0, limit);

    return NextResponse.json({
      ...leaderboard,
      contractors: limitedContractors,
    });
  } catch (error) {
    console.error('Contractor leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to build contractor leaderboard' },
      { status: 500 }
    );
  }
}
