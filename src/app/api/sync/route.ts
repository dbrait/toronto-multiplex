import { NextResponse } from 'next/server';
import { fetchAllActivePermits } from '@/lib/toronto-api';
import { bulkUpsertPermits, getDatabase } from '@/lib/db';
import { processPermit, isGentleDensityPermit } from '@/lib/utils';
import type { RawPermit } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for Vercel

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // Optional: Check for authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting permit sync...');

    // Fetch all active permits from Toronto Open Data
    const rawPermits: RawPermit[] = await fetchAllActivePermits();
    console.log(`Fetched ${rawPermits.length} raw permits`);

    // Filter for gentle density permits only
    const gentleDensityRaw = rawPermits.filter(isGentleDensityPermit);
    console.log(`Filtered to ${gentleDensityRaw.length} gentle density permits`);

    // Process permits
    const processedPermits = gentleDensityRaw.map(processPermit);

    // Assign neighbourhoods based on postal code prefix (simplified)
    // In production, you'd use proper geocoding and point-in-polygon
    for (const permit of processedPermits) {
      permit.neighbourhood = inferNeighbourhoodFromPostal(permit.postalCode);
    }

    // Bulk upsert to database
    const count = bulkUpsertPermits(processedPermits);

    const duration = Date.now() - startTime;

    // Log the sync
    const db = getDatabase();
    if (db) {
      db.prepare(
        `
        INSERT INTO sync_log (sync_type, records_added, completed_at, status)
        VALUES ('active_permits', ?, datetime('now'), 'completed')
      `
      ).run(count);
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${count} permits`,
      duration: `${duration}ms`,
      stats: {
        totalFetched: rawPermits.length,
        gentleDensityFiltered: gentleDensityRaw.length,
        upserted: count,
      },
    });
  } catch (error) {
    console.error('Sync error:', error);

    const db = getDatabase();
    if (db) {
      db.prepare(
        `
        INSERT INTO sync_log (sync_type, completed_at, status, error_message)
        VALUES ('active_permits', datetime('now'), 'failed', ?)
      `
      ).run((error as Error).message);
    }

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// Simplified neighbourhood inference from postal code
// This is a rough approximation - proper implementation would use geocoding
function inferNeighbourhoodFromPostal(postalCode: string): string | null {
  if (!postalCode) return null;

  const prefix = postalCode.substring(0, 3).toUpperCase();

  // Toronto postal code to neighbourhood mapping (simplified)
  const postalToNeighbourhood: Record<string, string> = {
    // Downtown Core
    M5V: 'Waterfront Communities-The Island',
    M5J: 'Waterfront Communities-The Island',
    M5H: 'Bay Street Corridor',
    M5G: 'Bay Street Corridor',
    M5B: 'Moss Park',
    M5A: 'St. Lawrence-East Bayfront-The Islands',
    M5C: 'Old Toronto',
    M5E: 'Old Toronto',

    // West End
    M6K: 'Parkdale-High Park',
    M6H: 'Dovercourt-Wallace Emerson-Junction',
    M6J: 'Trinity-Bellwoods',
    M6G: 'Palmerston-Little Italy',
    M6P: 'Runnymede-Bloor West Village',
    M6R: 'Parkdale-High Park',
    M6S: 'Swansea',
    M6N: 'Weston-Pelham Park',
    M6M: 'Mount Dennis',

    // East End
    M4M: 'South Riverdale',
    M4J: 'East End-Danforth',
    M4K: 'The Danforth East York',
    M4E: 'The Beaches',
    M4L: 'East End-Danforth',
    M4C: 'East York',
    M4G: 'Leaside-Bennington',
    M4H: 'Thorncliffe Park',

    // North York
    M2N: 'Willowdale East',
    M2M: 'Willowdale East',
    M2J: 'Henry Farm',
    M2K: 'Bayview Village',
    M2L: 'Banbury-Don Mills',
    M2P: 'York Mills-Windfields',
    M2R: 'Willowdale West',
    M3A: 'Parkwoods-Donalda',
    M3B: 'Don Valley Village',
    M3C: 'Flemingdon Park',
    M3H: 'Bathurst Manor',
    M3J: 'Black Creek',
    M3K: 'Downsview',
    M3L: 'Downsview',
    M3M: 'Downsview',
    M3N: 'Downsview',

    // Scarborough
    M1B: 'Rouge',
    M1C: 'Highland Creek',
    M1E: 'Guildwood',
    M1G: 'Woburn',
    M1H: 'Woburn',
    M1J: 'Scarborough Village',
    M1K: 'Kennedy Park',
    M1L: 'Oakridge',
    M1M: 'Cliffcrest',
    M1N: 'Birch Cliff',
    M1P: 'Dorset Park',
    M1R: 'Wexford-Maryvale',
    M1S: 'Agincourt North',
    M1T: 'Tam O\'Shanter-Sullivan',
    M1V: 'Milliken',
    M1W: "L'Amoreaux",
    M1X: 'Rouge',

    // Etobicoke
    M8V: 'Mimico',
    M8W: 'Long Branch',
    M8X: 'Kingsway South',
    M8Y: 'Mimico',
    M8Z: 'Stonegate-Queensway',
    M9A: 'Islington-City Centre West',
    M9B: 'Islington-City Centre West',
    M9C: 'Eringate-Centennial-West Deane',
    M9M: 'Humber Summit',
    M9N: 'Weston-Pelham Park',
    M9P: 'Kingsview Village-The Westway',
    M9R: 'Kingsview Village-The Westway',
    M9V: 'Elms-Old Rexdale',
    M9W: 'Rexdale-Kipling',

    // Central
    M4N: 'Lawrence Park South',
    M4P: 'Davisville Village',
    M4R: 'North Toronto',
    M4S: 'Davisville Village',
    M4T: 'Moore Park',
    M4V: 'Forest Hill South',
    M4W: 'Rosedale-Moore Park',
    M4X: 'Cabbagetown-South St. James Town',
    M4Y: 'Church-Yonge Corridor',
    M5M: 'Bedford Park-Nortown',
    M5N: 'Roselawn',
    M5P: 'Casa Loma',
    M5R: 'The Annex',
    M5S: 'University',
    M5T: 'Kensington-Chinatown',
  };

  return postalToNeighbourhood[prefix] || null;
}

// GET endpoint to check sync status
export async function GET() {
  try {
    const db = getDatabase();
    if (!db) {
      return NextResponse.json({
        totalPermits: 0,
        recentSyncs: [],
      });
    }

    const lastSync = db
      .prepare(
        `
      SELECT * FROM sync_log
      ORDER BY started_at DESC
      LIMIT 5
    `
      )
      .all();

    const permitCount = db
      .prepare("SELECT COUNT(*) as count FROM permits WHERE category != 'other'")
      .get() as { count: number };

    return NextResponse.json({
      totalPermits: permitCount.count,
      recentSyncs: lastSync,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
