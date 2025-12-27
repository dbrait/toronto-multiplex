// Toronto Open Data API Client

import type { RawPermit } from './types';
import {
  CKAN_BASE_URL,
  ACTIVE_PERMITS_RESOURCE_ID,
  MULTIPLEX_STRUCTURE_TYPES,
} from './constants';
import { isGentleDensityPermit } from './utils';

interface CKANDatastoreResponse {
  success: boolean;
  result: {
    records: RawPermit[];
    total: number;
    _links: {
      next?: string;
    };
  };
}

interface CKANPackageResponse {
  success: boolean;
  result: {
    resources: Array<{
      id: string;
      name: string;
      format: string;
      url: string;
    }>;
  };
}

export async function fetchActivePermits(
  limit: number = 10000,
  offset: number = 0
): Promise<RawPermit[]> {
  const url = new URL(`${CKAN_BASE_URL}/api/3/action/datastore_search`);
  url.searchParams.set('resource_id', ACTIVE_PERMITS_RESOURCE_ID);
  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('offset', offset.toString());

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch permits: ${response.statusText}`);
  }

  const data: CKANDatastoreResponse = await response.json();
  return data.result.records;
}

export async function fetchAllActivePermits(): Promise<RawPermit[]> {
  const allRecords: RawPermit[] = [];
  const batchSize = 10000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const records = await fetchActivePermits(batchSize, offset);
    allRecords.push(...records);

    if (records.length < batchSize) {
      hasMore = false;
    } else {
      offset += batchSize;
    }
  }

  return allRecords;
}

export async function fetchGentleDensityPermits(): Promise<RawPermit[]> {
  // Build a filter query for structure types
  const structureTypeFilter = MULTIPLEX_STRUCTURE_TYPES.map(
    (type) => `"${type}"`
  ).join(',');

  const url = new URL(`${CKAN_BASE_URL}/api/3/action/datastore_search`);
  url.searchParams.set('resource_id', ACTIVE_PERMITS_RESOURCE_ID);
  url.searchParams.set('limit', '50000');

  // Note: CKAN's filter syntax is limited, so we fetch more and filter client-side
  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch permits: ${response.statusText}`);
  }

  const data: CKANDatastoreResponse = await response.json();

  // Filter for gentle density permits
  return data.result.records.filter(isGentleDensityPermit);
}

export async function fetchClearedPermitsCSV(year: number): Promise<string> {
  // Cleared permits are available as CSV files by year
  const url = `${CKAN_BASE_URL}/dataset/building-permits-cleared-permits/resource/download/building-permits-cleared-permits-${year}.csv`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch cleared permits for ${year}: ${response.statusText}`);
  }

  return response.text();
}

export function parseCSVToPermits(csv: string): RawPermit[] {
  const lines = csv.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
  const permits: RawPermit[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Handle CSV parsing with quoted fields
    const values = parseCSVLine(line);
    const permit: Record<string, string | number | null> = {};

    headers.forEach((header, index) => {
      permit[header] = values[index] || null;
    });

    permits.push(permit as unknown as RawPermit);
  }

  return permits;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

// Fetch neighbourhood boundaries GeoJSON
export async function fetchNeighbourhoodBoundaries(): Promise<unknown> {
  // Using the official Toronto Open Data neighbourhood boundaries
  const url =
    'https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=neighbourhoods';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch neighbourhood data');
  }

  const data: CKANPackageResponse = await response.json();

  // Find the GeoJSON resource
  const geojsonResource = data.result.resources.find(
    (r) => r.format.toLowerCase() === 'geojson'
  );

  if (!geojsonResource) {
    throw new Error('No GeoJSON resource found for neighbourhoods');
  }

  const geojsonResponse = await fetch(geojsonResource.url);
  return geojsonResponse.json();
}

// Simple geocoding using address (for permits without coordinates)
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  // Note: In production, you'd use a proper geocoding service
  // This is a placeholder that would need to be replaced
  // with Mapbox, Google Maps, or Nominatim geocoding
  try {
    const encodedAddress = encodeURIComponent(`${address}, Toronto, ON, Canada`);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Toronto-Multiplex-Dashboard/1.0',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.length === 0) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch {
    return null;
  }
}
