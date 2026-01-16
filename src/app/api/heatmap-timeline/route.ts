import { NextRequest, NextResponse } from 'next/server';
import { getPermitsByMonth } from '@/lib/db-turso';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthsParam = searchParams.get('months');
    const months = monthsParam ? parseInt(monthsParam, 10) : 24;

    const data = await getPermitsByMonth(months);

    if (data.length === 0) {
      return NextResponse.json({
        months: [],
        dateRange: { start: null, end: null },
        totalPermits: 0,
      });
    }

    // Build response with summaries for each month
    const monthsWithSummary = data.map((monthData) => {
      const byCategory: Record<string, number> = {};
      for (const permit of monthData.permits) {
        byCategory[permit.category] = (byCategory[permit.category] || 0) + 1;
      }

      return {
        month: monthData.month,
        permits: monthData.permits.map((p) => ({
          lat: p.latitude,
          lng: p.longitude,
          category: p.category,
          address: p.address,
          neighbourhood: p.neighbourhood,
        })),
        summary: {
          total: monthData.permits.length,
          byCategory,
        },
      };
    });

    // Calculate total permits across all months
    const totalPermits = monthsWithSummary.reduce(
      (sum, m) => sum + m.summary.total,
      0
    );

    return NextResponse.json({
      months: monthsWithSummary,
      dateRange: {
        start: data[0].month,
        end: data[data.length - 1].month,
      },
      totalPermits,
    });
  } catch (error) {
    console.error('Heatmap timeline error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline data' },
      { status: 500 }
    );
  }
}
