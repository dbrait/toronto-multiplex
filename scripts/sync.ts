#!/usr/bin/env npx tsx

/**
 * Weekly Data Sync Script
 *
 * This script fetches the latest permit data from Toronto Open Data
 * and updates the local SQLite database.
 *
 * Usage:
 *   npx tsx scripts/sync.ts
 *
 * For weekly automation:
 *   - Use cron: 0 0 * * 0 cd /path/to/project && npx tsx scripts/sync.ts
 *   - Or GitHub Actions (see .github/workflows/sync.yml)
 *   - Or Vercel Cron Jobs
 */

import { fetchAllActivePermits } from '../src/lib/toronto-api';
import { bulkUpsertPermits, getDatabase } from '../src/lib/db';
import { processPermit, isGentleDensityPermit } from '../src/lib/utils';

async function main() {
  console.log('Starting permit data sync...');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const startTime = Date.now();

  try {
    // Fetch all active permits
    console.log('\nFetching permits from Toronto Open Data...');
    const rawPermits = await fetchAllActivePermits();
    console.log(`Fetched ${rawPermits.length} total permits`);

    // Filter for gentle density only
    const gentleDensity = rawPermits.filter(isGentleDensityPermit);
    console.log(`Filtered to ${gentleDensity.length} gentle density permits`);

    // Process permits
    console.log('\nProcessing permits...');
    const processed = gentleDensity.map(processPermit);

    // Simple neighbourhood assignment from postal code
    for (const permit of processed) {
      permit.neighbourhood = inferNeighbourhood(permit.postalCode);
    }

    // Upsert to database
    console.log('\nUpserting to database...');
    const count = bulkUpsertPermits(processed);
    console.log(`Upserted ${count} permits`);

    // Log sync
    const db = getDatabase();
    if (db) {
      db.prepare(
        `
        INSERT INTO sync_log (sync_type, records_added, completed_at, status)
        VALUES ('weekly_sync', ?, datetime('now'), 'completed')
      `
      ).run(count);
    }

    const duration = Date.now() - startTime;
    console.log(`\nSync completed in ${duration}ms`);

    // Print summary
    if (db) {
      const stats = db
        .prepare(
          `
        SELECT
          category,
          COUNT(*) as count
        FROM permits
        WHERE category != 'other'
        GROUP BY category
        ORDER BY count DESC
    `
      )
      .all() as { category: string; count: number }[];

      console.log('\nPermit Summary:');
      console.log('---------------');
      for (const { category, count } of stats) {
        console.log(`  ${category}: ${count}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('\nSync failed:', error);

    const db = getDatabase();
    if (db) {
      db.prepare(
        `
        INSERT INTO sync_log (sync_type, completed_at, status, error_message)
        VALUES ('weekly_sync', datetime('now'), 'failed', ?)
      `
      ).run((error as Error).message);
    }

    process.exit(1);
  }
}

function inferNeighbourhood(postalCode: string): string | null {
  if (!postalCode) return null;

  const prefix = postalCode.substring(0, 3).toUpperCase();

  const mapping: Record<string, string> = {
    M5V: 'Waterfront Communities',
    M5J: 'Waterfront Communities',
    M5H: 'Bay Street Corridor',
    M5G: 'Bay Street Corridor',
    M5B: 'Moss Park',
    M5A: 'St. Lawrence',
    M6K: 'Parkdale-High Park',
    M6H: 'Dovercourt-Wallace Emerson-Junction',
    M6J: 'Trinity-Bellwoods',
    M6G: 'Palmerston-Little Italy',
    M6P: 'Runnymede-Bloor West Village',
    M6R: 'Parkdale-High Park',
    M6S: 'Swansea',
    M6N: 'Weston-Pelham Park',
    M6M: 'Mount Dennis',
    M4M: 'South Riverdale',
    M4J: 'East End-Danforth',
    M4K: 'The Danforth',
    M4E: 'The Beaches',
    M4L: 'East End-Danforth',
    M4C: 'East York',
    M4G: 'Leaside-Bennington',
    M2N: 'Willowdale East',
    M2M: 'Willowdale East',
    M2J: 'Henry Farm',
    M2K: 'Bayview Village',
    M3A: 'Parkwoods-Donalda',
    M3B: 'Don Valley Village',
    M3C: 'Flemingdon Park',
    M3H: 'Bathurst Manor',
    M3J: 'Black Creek',
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
    M8V: 'Mimico',
    M8W: 'Long Branch',
    M8X: 'Kingsway South',
    M8Y: 'Mimico',
    M8Z: 'Stonegate-Queensway',
    M9A: 'Islington-City Centre West',
    M9B: 'Islington-City Centre West',
    M4N: 'Lawrence Park South',
    M4P: 'Davisville Village',
    M4R: 'North Toronto',
    M4S: 'Davisville Village',
    M4T: 'Moore Park',
    M4V: 'Forest Hill South',
    M4W: 'Rosedale-Moore Park',
    M4X: 'Cabbagetown',
    M4Y: 'Church-Yonge Corridor',
    M5M: 'Bedford Park-Nortown',
    M5P: 'Casa Loma',
    M5R: 'The Annex',
    M5S: 'University',
    M5T: 'Kensington-Chinatown',
  };

  return mapping[prefix] || null;
}

main();
