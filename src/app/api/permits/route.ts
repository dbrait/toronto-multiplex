import { NextResponse } from 'next/server';
import {
  getAllPermits,
  getKPIData,
  getNeighbourhoodStats,
  getMonthlyTrends,
  getCategoryBreakdown,
  getProcessingTimeDistribution,
  getPermitsWithCoordinates,
} from '@/lib/db-turso';
import type { PermitCategory } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';
  const category = searchParams.get('category') as PermitCategory | null;

  try {
    switch (type) {
      case 'kpi':
        return NextResponse.json(await getKPIData());

      case 'neighbourhoods':
        return NextResponse.json(await getNeighbourhoodStats());

      case 'trends':
        const months = parseInt(searchParams.get('months') || '24');
        return NextResponse.json(await getMonthlyTrends(months));

      case 'categories':
        return NextResponse.json(await getCategoryBreakdown());

      case 'processing':
        return NextResponse.json(await getProcessingTimeDistribution());

      case 'map':
        return NextResponse.json(await getPermitsWithCoordinates());

      case 'all':
      default:
        const permits = await getAllPermits(category || undefined);
        return NextResponse.json({
          permits,
          total: permits.length,
        });
    }
  } catch (error) {
    console.error('Error fetching permits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permits' },
      { status: 500 }
    );
  }
}
