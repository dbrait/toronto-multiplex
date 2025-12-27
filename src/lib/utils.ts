import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInDays, parseISO, format } from 'date-fns';
import type { RawPermit, ProcessedPermit, PermitCategory } from './types';
import {
  MULTIPLEX_STRUCTURE_TYPES,
  LANEWAY_GARDEN_WORK_TYPES,
} from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function categorizePermit(permit: RawPermit): PermitCategory {
  const description = (permit.DESCRIPTION || '').toLowerCase();
  const structureType = permit.STRUCTURE_TYPE || '';
  const work = permit.WORK || '';
  const proposedUse = (permit.PROPOSED_USE || '').toLowerCase();

  // Check for laneway suite
  if (
    description.includes('laneway') ||
    work.includes('Laneway') ||
    proposedUse.includes('laneway')
  ) {
    return 'laneway_suite';
  }

  // Check for garden suite
  if (
    description.includes('garden suite') ||
    description.includes('rear yard suite') ||
    work.includes('Garden Suite') ||
    work.includes('Rear Yard Suite')
  ) {
    return 'garden_suite';
  }

  // Check for secondary suite
  if (
    description.includes('secondary suite') ||
    description.includes('second suite') ||
    work.includes('Second Suite') ||
    proposedUse.includes('secondary suite')
  ) {
    return 'secondary_suite';
  }

  // Check structure type for multiplexes
  if (structureType.includes('Duplex')) {
    return 'duplex';
  }

  if (structureType.includes('Triplex')) {
    return 'triplex';
  }

  // Check dwelling units for fourplex
  const unitsCreated = permit.DWELLING_UNITS_CREATED || 0;
  if (
    unitsCreated === 4 ||
    description.includes('fourplex') ||
    description.includes('four-plex') ||
    description.includes('4-plex')
  ) {
    return 'fourplex';
  }

  // Other multiplex types
  if (
    MULTIPLEX_STRUCTURE_TYPES.some((type) => structureType.includes(type)) ||
    structureType.includes('Converted House')
  ) {
    return 'multiplex_other';
  }

  return 'other';
}

export function processPermit(raw: RawPermit): ProcessedPermit {
  const applicationDate = raw.APPLICATION_DATE
    ? parseISO(raw.APPLICATION_DATE)
    : new Date();
  const issuedDate = raw.ISSUED_DATE ? parseISO(raw.ISSUED_DATE) : null;
  const completedDate = raw.COMPLETED_DATE
    ? parseISO(raw.COMPLETED_DATE)
    : null;

  const processingDays =
    issuedDate && applicationDate
      ? differenceInDays(issuedDate, applicationDate)
      : null;

  const completionDays =
    completedDate && issuedDate
      ? differenceInDays(completedDate, issuedDate)
      : null;

  const totalDays =
    completedDate && applicationDate
      ? differenceInDays(completedDate, applicationDate)
      : null;

  const address = [
    raw.STREET_NUM,
    raw.STREET_NAME,
    raw.STREET_TYPE,
    raw.STREET_DIRECTION,
  ]
    .filter(Boolean)
    .join(' ');

  const dwellingUnitsCreated = raw.DWELLING_UNITS_CREATED || 0;
  const dwellingUnitsLost = raw.DWELLING_UNITS_LOST || 0;

  return {
    id: `${raw.PERMIT_NUM}-${raw.REVISION_NUM}`,
    permitNum: raw.PERMIT_NUM,
    revisionNum: raw.REVISION_NUM,
    permitType: raw.PERMIT_TYPE,
    structureType: raw.STRUCTURE_TYPE,
    work: raw.WORK,
    address,
    postalCode: raw.POSTAL || '',
    geoId: raw.GEO_ID || '',
    applicationDate,
    issuedDate,
    completedDate,
    status: raw.STATUS,
    description: raw.DESCRIPTION || '',
    currentUse: raw.CURRENT_USE || '',
    proposedUse: raw.PROPOSED_USE || '',
    dwellingUnitsCreated,
    dwellingUnitsLost,
    netDwellingUnits: dwellingUnitsCreated - dwellingUnitsLost,
    grossFloorArea: raw.GROSS_FLOOR_AREA,
    latitude: raw.LATITUDE || null,
    longitude: raw.LONGITUDE || null,
    neighbourhood: null, // Will be set by geo matching
    ward: null,
    processingDays,
    completionDays,
    totalDays,
    category: categorizePermit(raw),
  };
}

export function isGentleDensityPermit(permit: RawPermit): boolean {
  const category = categorizePermit(permit);
  return category !== 'other';
}

export function formatDate(date: Date | null): string {
  if (!date) return 'N/A';
  return format(date, 'MMM d, yyyy');
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-CA').format(num);
}

export function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function groupByMonth(
  permits: ProcessedPermit[],
  dateField: 'applicationDate' | 'issuedDate' | 'completedDate' = 'applicationDate'
): Map<string, ProcessedPermit[]> {
  const grouped = new Map<string, ProcessedPermit[]>();

  for (const permit of permits) {
    const date = permit[dateField];
    if (!date) continue;

    const key = format(date, 'yyyy-MM');
    const existing = grouped.get(key) || [];
    existing.push(permit);
    grouped.set(key, existing);
  }

  return grouped;
}

export function groupByNeighbourhood(
  permits: ProcessedPermit[]
): Map<string, ProcessedPermit[]> {
  const grouped = new Map<string, ProcessedPermit[]>();

  for (const permit of permits) {
    const key = permit.neighbourhood || 'Unknown';
    const existing = grouped.get(key) || [];
    existing.push(permit);
    grouped.set(key, existing);
  }

  return grouped;
}

export function groupByCategory(
  permits: ProcessedPermit[]
): Map<PermitCategory, ProcessedPermit[]> {
  const grouped = new Map<PermitCategory, ProcessedPermit[]>();

  for (const permit of permits) {
    const existing = grouped.get(permit.category) || [];
    existing.push(permit);
    grouped.set(permit.category, existing);
  }

  return grouped;
}

export function calculateAverageProcessingDays(permits: ProcessedPermit[]): number | null {
  const validPermits = permits.filter((p) => p.processingDays !== null);
  if (validPermits.length === 0) return null;

  const total = validPermits.reduce((sum, p) => sum + (p.processingDays || 0), 0);
  return Math.round(total / validPermits.length);
}
