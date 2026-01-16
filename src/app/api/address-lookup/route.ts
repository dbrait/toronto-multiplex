import { NextRequest, NextResponse } from 'next/server';
import {
  getPermitsNearLocation,
  getNeighbourhoodStats,
} from '@/lib/db-turso';
import { calculateAllNeighbourhoodScores } from '@/lib/scoring';
import {
  geocodeAddress,
  summarizeNearbyPermits,
  formatCategoryName,
} from '@/lib/address-lookup';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const radiusParam = searchParams.get('radius');
    const radius = radiusParam ? parseFloat(radiusParam) : 1; // Default 1km

    if (!address) {
      return NextResponse.json(
        { error: 'Missing address parameter' },
        { status: 400 }
      );
    }

    // Geocode the address
    const geocoded = await geocodeAddress(address);

    if (!geocoded) {
      return NextResponse.json(
        { error: 'Could not find address in Toronto. Please try a more specific address.' },
        { status: 404 }
      );
    }

    // Get nearby permits
    const nearbyPermits = await getPermitsNearLocation(
      geocoded.lat,
      geocoded.lng,
      radius
    );

    // Determine neighbourhood from nearest permit
    let neighbourhood: string | null = null;
    if (nearbyPermits.length > 0 && nearbyPermits[0].neighbourhood) {
      neighbourhood = nearbyPermits[0].neighbourhood;
    }

    // Get neighbourhood stats and feasibility if we found a neighbourhood
    let neighbourhoodData = null;
    if (neighbourhood) {
      const allStats = await getNeighbourhoodStats();
      const stats = allStats.find(
        (n) => n.name.toLowerCase() === neighbourhood!.toLowerCase()
      );

      if (stats) {
        const feasibilityScores = calculateAllNeighbourhoodScores(allStats);
        const feasibility = feasibilityScores.find(
          (f: { neighbourhood: string }) =>
            f.neighbourhood.toLowerCase() === neighbourhood!.toLowerCase()
        );

        neighbourhoodData = {
          name: neighbourhood,
          stats: {
            totalPermits: stats.totalPermits,
            activePermits: stats.activePermits,
            completedPermits: stats.completedPermits,
            unitsCreated: stats.totalUnitsCreated,
            avgProcessingDays: stats.avgProcessingDays,
          },
          feasibility: feasibility
            ? {
                score: feasibility.score,
                grade: feasibility.grade,
                rank: feasibility.rank,
                totalNeighbourhoods: feasibilityScores.length,
              }
            : null,
        };
      }
    }

    // Summarize permits
    const summary = summarizeNearbyPermits(nearbyPermits);

    // Format permits for response
    const formattedPermits = nearbyPermits.map((p) => ({
      id: p.id,
      address: p.address,
      category: p.category,
      categoryDisplay: formatCategoryName(p.category),
      status: p.status,
      distance: p.distance,
      latitude: p.latitude,
      longitude: p.longitude,
      applicationDate: p.applicationDate,
    }));

    return NextResponse.json({
      address: {
        input: geocoded.input,
        formatted: geocoded.formatted,
        lat: geocoded.lat,
        lng: geocoded.lng,
      },
      neighbourhood: neighbourhoodData,
      nearbyPermits: formattedPermits,
      summary: {
        total: summary.total,
        byCategory: Object.entries(summary.byCategory).map(([category, count]) => ({
          category,
          categoryDisplay: formatCategoryName(category),
          count,
        })),
        avgDistanceKm: summary.avgDistance,
        radiusKm: radius,
      },
    });
  } catch (error) {
    console.error('Address lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to process address lookup' },
      { status: 500 }
    );
  }
}
