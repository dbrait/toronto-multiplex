// Turso/LibSQL Database Client
// Uses Turso in production, falls back to local SQLite in development

import { createClient, Client } from '@libsql/client';
import type { ProcessedPermit, PermitCategory, NeighbourhoodStats, KPIData } from './types';

let client: Client | null = null;

export function getClient(): Client | null {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.log('No TURSO_DATABASE_URL set, database unavailable');
    return null;
  }

  try {
    client = createClient({
      url,
      authToken,
    });
    return client;
  } catch (error) {
    console.error('Failed to create Turso client:', error);
    return null;
  }
}

export async function initializeSchema(): Promise<void> {
  const db = getClient();
  if (!db) return;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS permits (
      id TEXT PRIMARY KEY,
      permit_num TEXT NOT NULL,
      revision_num TEXT,
      permit_type TEXT,
      structure_type TEXT,
      work TEXT,
      address TEXT,
      postal_code TEXT,
      geo_id TEXT,
      application_date TEXT,
      issued_date TEXT,
      completed_date TEXT,
      status TEXT,
      description TEXT,
      current_use TEXT,
      proposed_use TEXT,
      dwelling_units_created INTEGER DEFAULT 0,
      dwelling_units_lost INTEGER DEFAULT 0,
      net_dwelling_units INTEGER DEFAULT 0,
      gross_floor_area REAL,
      latitude REAL,
      longitude REAL,
      neighbourhood TEXT,
      ward TEXT,
      processing_days INTEGER,
      completion_days INTEGER,
      total_days INTEGER,
      category TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_permits_category ON permits(category)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_permits_neighbourhood ON permits(neighbourhood)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_permits_status ON permits(status)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_permits_application_date ON permits(application_date)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sync_type TEXT NOT NULL,
      records_added INTEGER DEFAULT 0,
      records_updated INTEGER DEFAULT 0,
      started_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      status TEXT DEFAULT 'running',
      error_message TEXT
    )
  `);
}

export async function upsertPermit(permit: ProcessedPermit): Promise<void> {
  const db = getClient();
  if (!db) return;

  await db.execute({
    sql: `
      INSERT INTO permits (
        id, permit_num, revision_num, permit_type, structure_type, work,
        address, postal_code, geo_id, application_date, issued_date, completed_date,
        status, description, current_use, proposed_use,
        dwelling_units_created, dwelling_units_lost, net_dwelling_units,
        gross_floor_area, latitude, longitude, neighbourhood, ward,
        processing_days, completion_days, total_days, category, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        issued_date = excluded.issued_date,
        completed_date = excluded.completed_date,
        processing_days = excluded.processing_days,
        completion_days = excluded.completion_days,
        total_days = excluded.total_days,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [
      permit.id,
      permit.permitNum,
      permit.revisionNum,
      permit.permitType,
      permit.structureType,
      permit.work,
      permit.address,
      permit.postalCode,
      permit.geoId,
      permit.applicationDate?.toISOString() || null,
      permit.issuedDate?.toISOString() || null,
      permit.completedDate?.toISOString() || null,
      permit.status,
      permit.description,
      permit.currentUse,
      permit.proposedUse,
      permit.dwellingUnitsCreated,
      permit.dwellingUnitsLost,
      permit.netDwellingUnits,
      permit.grossFloorArea,
      permit.latitude,
      permit.longitude,
      permit.neighbourhood,
      permit.ward,
      permit.processingDays,
      permit.completionDays,
      permit.totalDays,
      permit.category,
    ],
  });
}

export async function bulkUpsertPermits(permits: ProcessedPermit[]): Promise<number> {
  const db = getClient();
  if (!db) return 0;

  // Initialize schema first
  await initializeSchema();

  // Use batched transactions for better performance
  const batchSize = 100;
  for (let i = 0; i < permits.length; i += batchSize) {
    const batch = permits.slice(i, i + batchSize);
    await Promise.all(batch.map(upsertPermit));
  }

  return permits.length;
}

export async function getAllPermits(category?: PermitCategory): Promise<ProcessedPermit[]> {
  const db = getClient();
  if (!db) return [];

  let sql = "SELECT * FROM permits WHERE category != 'other'";
  const args: string[] = [];

  if (category) {
    sql += ' AND category = ?';
    args.push(category);
  }

  sql += ' ORDER BY application_date DESC';

  const result = await db.execute({ sql, args });
  return result.rows.map(rowToPermit);
}

export async function getPermitsByNeighbourhood(neighbourhood: string): Promise<ProcessedPermit[]> {
  const db = getClient();
  if (!db) return [];

  const result = await db.execute({
    sql: "SELECT * FROM permits WHERE neighbourhood = ? AND category != 'other' ORDER BY application_date DESC",
    args: [neighbourhood],
  });

  return result.rows.map(rowToPermit);
}

export async function getKPIData(): Promise<KPIData> {
  const db = getClient();
  if (!db) {
    return {
      totalActivePermits: 0,
      totalCompletedPermits: 0,
      totalUnitsCreated: 0,
      avgProcessingDays: 0,
      permitsThisYear: 0,
      permitsLastYear: 0,
      yearOverYearChange: 0,
    };
  }

  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  const result = await db.execute({
    sql: `
      SELECT
        COUNT(*) FILTER (WHERE status IN ('Active', 'Permit Issued', 'Under Review', 'In Progress')) as total_active,
        COUNT(*) FILTER (WHERE status IN ('Closed', 'Complete', 'Completed')) as total_completed,
        SUM(dwelling_units_created) as total_units,
        AVG(processing_days) FILTER (WHERE processing_days IS NOT NULL) as avg_processing,
        COUNT(*) FILTER (WHERE strftime('%Y', application_date) = ?) as permits_this_year,
        COUNT(*) FILTER (WHERE strftime('%Y', application_date) = ?) as permits_last_year
      FROM permits
      WHERE category != 'other'
    `,
    args: [currentYear.toString(), lastYear.toString()],
  });

  const row = result.rows[0] || {};
  const permitsThisYear = Number(row.permits_this_year) || 0;
  const permitsLastYear = Number(row.permits_last_year) || 0;
  const yearOverYearChange =
    permitsLastYear > 0
      ? Math.round(((permitsThisYear - permitsLastYear) / permitsLastYear) * 100)
      : 0;

  return {
    totalActivePermits: Number(row.total_active) || 0,
    totalCompletedPermits: Number(row.total_completed) || 0,
    totalUnitsCreated: Number(row.total_units) || 0,
    avgProcessingDays: Math.round(Number(row.avg_processing) || 0),
    permitsThisYear,
    permitsLastYear,
    yearOverYearChange,
  };
}

export async function getNeighbourhoodStats(): Promise<NeighbourhoodStats[]> {
  const db = getClient();
  if (!db) return [];

  const result = await db.execute(`
    SELECT
      neighbourhood as name,
      COUNT(*) as total_permits,
      COUNT(*) FILTER (WHERE status IN ('Active', 'Permit Issued', 'Under Review', 'In Progress')) as active_permits,
      COUNT(*) FILTER (WHERE status IN ('Closed', 'Complete', 'Completed')) as completed_permits,
      SUM(dwelling_units_created) as total_units,
      AVG(processing_days) FILTER (WHERE processing_days IS NOT NULL) as avg_processing,
      COUNT(*) FILTER (WHERE category = 'secondary_suite') as secondary_suite,
      COUNT(*) FILTER (WHERE category = 'laneway_suite') as laneway_suite,
      COUNT(*) FILTER (WHERE category = 'garden_suite') as garden_suite,
      COUNT(*) FILTER (WHERE category = 'duplex') as duplex,
      COUNT(*) FILTER (WHERE category = 'triplex') as triplex,
      COUNT(*) FILTER (WHERE category = 'fourplex') as fourplex,
      COUNT(*) FILTER (WHERE category = 'multiplex_other') as multiplex_other
    FROM permits
    WHERE category != 'other' AND neighbourhood IS NOT NULL
    GROUP BY neighbourhood
    ORDER BY total_permits DESC
  `);

  return result.rows.map((row) => ({
    name: String(row.name),
    totalPermits: Number(row.total_permits) || 0,
    activePermits: Number(row.active_permits) || 0,
    completedPermits: Number(row.completed_permits) || 0,
    totalUnitsCreated: Number(row.total_units) || 0,
    avgProcessingDays: row.avg_processing ? Math.round(Number(row.avg_processing)) : null,
    byCategory: {
      secondary_suite: Number(row.secondary_suite) || 0,
      laneway_suite: Number(row.laneway_suite) || 0,
      garden_suite: Number(row.garden_suite) || 0,
      duplex: Number(row.duplex) || 0,
      triplex: Number(row.triplex) || 0,
      fourplex: Number(row.fourplex) || 0,
      multiplex_other: Number(row.multiplex_other) || 0,
      other: 0,
    },
  }));
}

export async function getMonthlyTrends(months: number = 24): Promise<{ month: string; count: number; category: string }[]> {
  const db = getClient();
  if (!db) return [];

  const result = await db.execute({
    sql: `
      SELECT
        strftime('%Y-%m', application_date) as month,
        category,
        COUNT(*) as count
      FROM permits
      WHERE category != 'other'
        AND application_date >= date('now', '-' || ? || ' months')
      GROUP BY month, category
      ORDER BY month ASC
    `,
    args: [months],
  });

  return result.rows.map((row) => ({
    month: String(row.month),
    category: String(row.category),
    count: Number(row.count) || 0,
  }));
}

export async function getCategoryBreakdown(): Promise<{ category: string; count: number; units: number }[]> {
  const db = getClient();
  if (!db) return [];

  const result = await db.execute(`
    SELECT
      category,
      COUNT(*) as count,
      SUM(dwelling_units_created) as units
    FROM permits
    WHERE category != 'other'
    GROUP BY category
    ORDER BY count DESC
  `);

  return result.rows.map((row) => ({
    category: String(row.category),
    count: Number(row.count) || 0,
    units: Number(row.units) || 0,
  }));
}

export async function getProcessingTimeDistribution(): Promise<{ range: string; count: number }[]> {
  const db = getClient();
  if (!db) return [];

  const result = await db.execute(`
    SELECT
      CASE
        WHEN processing_days < 30 THEN '< 30 days'
        WHEN processing_days < 60 THEN '30-60 days'
        WHEN processing_days < 90 THEN '60-90 days'
        WHEN processing_days < 180 THEN '90-180 days'
        WHEN processing_days < 365 THEN '180-365 days'
        ELSE '> 365 days'
      END as range,
      COUNT(*) as count
    FROM permits
    WHERE category != 'other' AND processing_days IS NOT NULL
    GROUP BY range
    ORDER BY
      CASE range
        WHEN '< 30 days' THEN 1
        WHEN '30-60 days' THEN 2
        WHEN '60-90 days' THEN 3
        WHEN '90-180 days' THEN 4
        WHEN '180-365 days' THEN 5
        ELSE 6
      END
  `);

  return result.rows.map((row) => ({
    range: String(row.range),
    count: Number(row.count) || 0,
  }));
}

export async function getPermitsWithCoordinates(): Promise<{ latitude: number; longitude: number; category: string; address: string }[]> {
  const db = getClient();
  if (!db) return [];

  const result = await db.execute(`
    SELECT latitude, longitude, category, address
    FROM permits
    WHERE category != 'other'
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
  `);

  return result.rows.map((row) => ({
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    category: String(row.category),
    address: String(row.address),
  }));
}

export async function logSync(type: string, count: number, status: 'completed' | 'failed', errorMessage?: string): Promise<void> {
  const db = getClient();
  if (!db) return;

  await db.execute({
    sql: `
      INSERT INTO sync_log (sync_type, records_added, completed_at, status, error_message)
      VALUES (?, ?, datetime('now'), ?, ?)
    `,
    args: [type, count, status, errorMessage || null],
  });
}

function rowToPermit(row: Record<string, unknown>): ProcessedPermit {
  return {
    id: String(row.id),
    permitNum: String(row.permit_num),
    revisionNum: String(row.revision_num || ''),
    permitType: String(row.permit_type || ''),
    structureType: String(row.structure_type || ''),
    work: String(row.work || ''),
    address: String(row.address || ''),
    postalCode: String(row.postal_code || ''),
    geoId: String(row.geo_id || ''),
    applicationDate: row.application_date ? new Date(String(row.application_date)) : new Date(),
    issuedDate: row.issued_date ? new Date(String(row.issued_date)) : null,
    completedDate: row.completed_date ? new Date(String(row.completed_date)) : null,
    status: String(row.status || ''),
    description: String(row.description || ''),
    currentUse: String(row.current_use || ''),
    proposedUse: String(row.proposed_use || ''),
    dwellingUnitsCreated: Number(row.dwelling_units_created) || 0,
    dwellingUnitsLost: Number(row.dwelling_units_lost) || 0,
    netDwellingUnits: Number(row.net_dwelling_units) || 0,
    grossFloorArea: row.gross_floor_area ? Number(row.gross_floor_area) : null,
    latitude: row.latitude ? Number(row.latitude) : null,
    longitude: row.longitude ? Number(row.longitude) : null,
    neighbourhood: row.neighbourhood ? String(row.neighbourhood) : null,
    ward: row.ward ? String(row.ward) : null,
    processingDays: row.processing_days ? Number(row.processing_days) : null,
    completionDays: row.completion_days ? Number(row.completion_days) : null,
    totalDays: row.total_days ? Number(row.total_days) : null,
    category: String(row.category) as PermitCategory,
  };
}
