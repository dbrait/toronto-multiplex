import { NextResponse } from 'next/server';
import {
  getAllPermits,
  getKPIData,
  getNeighbourhoodStats,
  getMonthlyTrends,
  getCategoryBreakdown,
  getProcessingTimeDistribution,
  getPermitsWithCoordinates,
} from '@/lib/db';
import type { PermitCategory } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';
  const category = searchParams.get('category') as PermitCategory | null;
  const neighbourhood = searchParams.get('neighbourhood');

  try {
    switch (type) {
      case 'kpi':
        return NextResponse.json(getKPIData());

      case 'neighbourhoods':
        return NextResponse.json(getNeighbourhoodStats());

      case 'trends':
        const months = parseInt(searchParams.get('months') || '24');
        return NextResponse.json(getMonthlyTrends(months));

      case 'categories':
        return NextResponse.json(getCategoryBreakdown());

      case 'processing':
        return NextResponse.json(getProcessingTimeDistribution());

      case 'map':
        return NextResponse.json(getPermitsWithCoordinates());

      case 'all':
      default:
        const permits = getAllPermits(category || undefined);
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
