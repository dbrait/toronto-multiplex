import { NextRequest, NextResponse } from 'next/server';
import { getProcessingTimeByMonth, getAllCategories } from '@/lib/db-turso';
import { analyzeByMonth } from '@/lib/best-time';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const type = searchParams.get('type');

    // Return available categories for the dropdown
    if (type === 'options') {
      const categories = await getAllCategories();
      return NextResponse.json({ categories });
    }

    // Get monthly processing stats
    const monthlyData = await getProcessingTimeByMonth(category);

    if (!monthlyData || monthlyData.length === 0) {
      return NextResponse.json(
        { error: 'No data available' },
        { status: 404 }
      );
    }

    // Analyze the data
    const analysis = analyzeByMonth(monthlyData);

    return NextResponse.json({
      ...analysis,
      category: category || 'all',
    });
  } catch (error) {
    console.error('Failed to analyze best time:', error);
    return NextResponse.json(
      { error: 'Failed to analyze data' },
      { status: 500 }
    );
  }
}
