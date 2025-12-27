// SQLite Database Setup and Operations
// Note: This runs server-side only

import Database from 'better-sqlite3';
import path from 'path';
import type { ProcessedPermit, PermitCategory, NeighbourhoodStats, KPIData } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'permits.db');

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(database: Database.Database): void {
  database.exec(`
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
    );

    CREATE INDEX IF NOT EXISTS idx_permits_category ON permits(category);
    CREATE INDEX IF NOT EXISTS idx_permits_neighbourhood ON permits(neighbourhood);
    CREATE INDEX IF NOT EXISTS idx_permits_status ON permits(status);
    CREATE INDEX IF NOT EXISTS idx_permits_application_date ON permits(application_date);
    CREATE INDEX IF NOT EXISTS idx_permits_structure_type ON permits(structure_type);

    CREATE TABLE IF NOT EXISTS neighbourhoods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      area_code TEXT,
      geojson TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sync_type TEXT NOT NULL,
      records_added INTEGER DEFAULT 0,
      records_updated INTEGER DEFAULT 0,
      started_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      status TEXT DEFAULT 'running',
      error_message TEXT
    );
  `);
}

export function upsertPermit(permit: ProcessedPermit): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO permits (
      id, permit_num, revision_num, permit_type, structure_type, work,
      address, postal_code, geo_id, application_date, issued_date, completed_date,
      status, description, current_use, proposed_use,
      dwelling_units_created, dwelling_units_lost, net_dwelling_units,
      gross_floor_area, latitude, longitude, neighbourhood, ward,
      processing_days, completion_days, total_days, category, updated_at
    ) VALUES (
      @id, @permitNum, @revisionNum, @permitType, @structureType, @work,
      @address, @postalCode, @geoId, @applicationDate, @issuedDate, @completedDate,
      @status, @description, @currentUse, @proposedUse,
      @dwellingUnitsCreated, @dwellingUnitsLost, @netDwellingUnits,
      @grossFloorArea, @latitude, @longitude, @neighbourhood, @ward,
      @processingDays, @completionDays, @totalDays, @category, CURRENT_TIMESTAMP
    )
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      issued_date = excluded.issued_date,
      completed_date = excluded.completed_date,
      processing_days = excluded.processing_days,
      completion_days = excluded.completion_days,
      total_days = excluded.total_days,
      updated_at = CURRENT_TIMESTAMP
  `);

  stmt.run({
    id: permit.id,
    permitNum: permit.permitNum,
    revisionNum: permit.revisionNum,
    permitType: permit.permitType,
    structureType: permit.structureType,
    work: permit.work,
    address: permit.address,
    postalCode: permit.postalCode,
    geoId: permit.geoId,
    applicationDate: permit.applicationDate?.toISOString() || null,
    issuedDate: permit.issuedDate?.toISOString() || null,
    completedDate: permit.completedDate?.toISOString() || null,
    status: permit.status,
    description: permit.description,
    currentUse: permit.currentUse,
    proposedUse: permit.proposedUse,
    dwellingUnitsCreated: permit.dwellingUnitsCreated,
    dwellingUnitsLost: permit.dwellingUnitsLost,
    netDwellingUnits: permit.netDwellingUnits,
    grossFloorArea: permit.grossFloorArea,
    latitude: permit.latitude,
    longitude: permit.longitude,
    neighbourhood: permit.neighbourhood,
    ward: permit.ward,
    processingDays: permit.processingDays,
    completionDays: permit.completionDays,
    totalDays: permit.totalDays,
    category: permit.category,
  });
}

export function bulkUpsertPermits(permits: ProcessedPermit[]): number {
  const db = getDatabase();
  const upsert = db.transaction((permits: ProcessedPermit[]) => {
    for (const permit of permits) {
      upsertPermit(permit);
    }
    return permits.length;
  });

  return upsert(permits);
}

export function getAllPermits(category?: PermitCategory): ProcessedPermit[] {
  const db = getDatabase();
  let query = 'SELECT * FROM permits WHERE category != "other"';
  const params: Record<string, string> = {};

  if (category) {
    query += ' AND category = @category';
    params.category = category;
  }

  query += ' ORDER BY application_date DESC';

  const rows = db.prepare(query).all(params) as Record<string, unknown>[];
  return rows.map(rowToPermit);
}

export function getPermitsByNeighbourhood(neighbourhood: string): ProcessedPermit[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      'SELECT * FROM permits WHERE neighbourhood = ? AND category != "other" ORDER BY application_date DESC'
    )
    .all(neighbourhood) as Record<string, unknown>[];

  return rows.map(rowToPermit);
}

export function getKPIData(): KPIData {
  const db = getDatabase();
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  const stats = db
    .prepare(
      `
    SELECT
      COUNT(*) FILTER (WHERE status IN ('Active', 'Permit Issued', 'Under Review', 'In Progress')) as total_active,
      COUNT(*) FILTER (WHERE status IN ('Closed', 'Complete', 'Completed')) as total_completed,
      SUM(dwelling_units_created) as total_units,
      AVG(processing_days) FILTER (WHERE processing_days IS NOT NULL) as avg_processing,
      COUNT(*) FILTER (WHERE strftime('%Y', application_date) = @currentYear) as permits_this_year,
      COUNT(*) FILTER (WHERE strftime('%Y', application_date) = @lastYear) as permits_last_year
    FROM permits
    WHERE category != 'other'
  `
    )
    .get({ currentYear: currentYear.toString(), lastYear: lastYear.toString() }) as Record<string, number>;

  const permitsThisYear = stats.permits_this_year || 0;
  const permitsLastYear = stats.permits_last_year || 0;
  const yearOverYearChange =
    permitsLastYear > 0
      ? Math.round(((permitsThisYear - permitsLastYear) / permitsLastYear) * 100)
      : 0;

  return {
    totalActivePermits: stats.total_active || 0,
    totalCompletedPermits: stats.total_completed || 0,
    totalUnitsCreated: stats.total_units || 0,
    avgProcessingDays: Math.round(stats.avg_processing || 0),
    permitsThisYear,
    permitsLastYear,
    yearOverYearChange,
  };
}

export function getNeighbourhoodStats(): NeighbourhoodStats[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
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
  `
    )
    .all() as Record<string, unknown>[];

  return rows.map((row) => ({
    name: row.name as string,
    totalPermits: row.total_permits as number,
    activePermits: row.active_permits as number,
    completedPermits: row.completed_permits as number,
    totalUnitsCreated: row.total_units as number || 0,
    avgProcessingDays: row.avg_processing ? Math.round(row.avg_processing as number) : null,
    byCategory: {
      secondary_suite: row.secondary_suite as number || 0,
      laneway_suite: row.laneway_suite as number || 0,
      garden_suite: row.garden_suite as number || 0,
      duplex: row.duplex as number || 0,
      triplex: row.triplex as number || 0,
      fourplex: row.fourplex as number || 0,
      multiplex_other: row.multiplex_other as number || 0,
      other: 0,
    },
  }));
}

export function getMonthlyTrends(months: number = 24): { month: string; count: number; category: string }[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
    SELECT
      strftime('%Y-%m', application_date) as month,
      category,
      COUNT(*) as count
    FROM permits
    WHERE category != 'other'
      AND application_date >= date('now', '-' || @months || ' months')
    GROUP BY month, category
    ORDER BY month ASC
  `
    )
    .all({ months }) as { month: string; category: string; count: number }[];

  return rows;
}

export function getCategoryBreakdown(): { category: string; count: number; units: number }[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
    SELECT
      category,
      COUNT(*) as count,
      SUM(dwelling_units_created) as units
    FROM permits
    WHERE category != 'other'
    GROUP BY category
    ORDER BY count DESC
  `
    )
    .all() as { category: string; count: number; units: number }[];

  return rows;
}

export function getProcessingTimeDistribution(): { range: string; count: number }[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
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
  `
    )
    .all() as { range: string; count: number }[];

  return rows;
}

export function getPermitsWithCoordinates(): { latitude: number; longitude: number; category: string; address: string }[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
    SELECT latitude, longitude, category, address
    FROM permits
    WHERE category != 'other'
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
  `
    )
    .all() as { latitude: number; longitude: number; category: string; address: string }[];

  return rows;
}

function rowToPermit(row: Record<string, unknown>): ProcessedPermit {
  return {
    id: row.id as string,
    permitNum: row.permit_num as string,
    revisionNum: row.revision_num as string,
    permitType: row.permit_type as string,
    structureType: row.structure_type as string,
    work: row.work as string,
    address: row.address as string,
    postalCode: row.postal_code as string,
    geoId: row.geo_id as string,
    applicationDate: row.application_date ? new Date(row.application_date as string) : new Date(),
    issuedDate: row.issued_date ? new Date(row.issued_date as string) : null,
    completedDate: row.completed_date ? new Date(row.completed_date as string) : null,
    status: row.status as string,
    description: row.description as string,
    currentUse: row.current_use as string,
    proposedUse: row.proposed_use as string,
    dwellingUnitsCreated: row.dwelling_units_created as number,
    dwellingUnitsLost: row.dwelling_units_lost as number,
    netDwellingUnits: row.net_dwelling_units as number,
    grossFloorArea: row.gross_floor_area as number | null,
    latitude: row.latitude as number | null,
    longitude: row.longitude as number | null,
    neighbourhood: row.neighbourhood as string | null,
    ward: row.ward as string | null,
    processingDays: row.processing_days as number | null,
    completionDays: row.completion_days as number | null,
    totalDays: row.total_days as number | null,
    category: row.category as PermitCategory,
  };
}
