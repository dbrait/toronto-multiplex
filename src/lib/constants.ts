// Toronto Open Data API Constants

export const CKAN_BASE_URL = 'https://ckan0.cf.opendata.inter.prod-toronto.ca';

// Active Permits Dataset
export const ACTIVE_PERMITS_RESOURCE_ID = '6d0229af-bc54-46de-9c2b-26759b01dd05';

// Cleared Permits are available as yearly CSV files
export const CLEARED_PERMITS_DATASET = 'building-permits-cleared-permits';

// Structure types for filtering gentle density housing
export const MULTIPLEX_STRUCTURE_TYPES = [
  'Duplex',
  'Duplex/Semi-Detached',
  'Triplex',
  'Triplex/Semi-Detached',
  '3+ Unit Detached',
  '3+ Unit Semi-Detached',
  'Converted House',
] as const;

// Work descriptions for laneway/garden suites
export const LANEWAY_GARDEN_WORK_TYPES = [
  'Second Suite (New)',
  'New Laneway / Rear Yard Suite',
  'Laneway Suite',
  'Garden Suite',
  'Rear Yard Suite',
] as const;

// Work types to include
export const INCLUDED_WORK_TYPES = [
  'Addition(s)',
  'New Building',
  'Change of Use',
  'Alteration',
  'Multiple Projects',
] as const;

// Status values
export const PERMIT_STATUSES = {
  ACTIVE: ['Active', 'Permit Issued', 'Under Review', 'In Progress'],
  CLOSED: ['Closed', 'Complete', 'Completed'],
  CANCELLED: ['Cancelled', 'Withdrawn', 'Refused'],
} as const;

// Category display names
export const CATEGORY_LABELS: Record<string, string> = {
  secondary_suite: 'Secondary Suite',
  laneway_suite: 'Laneway Suite',
  garden_suite: 'Garden Suite',
  duplex: 'Duplex',
  triplex: 'Triplex',
  fourplex: 'Fourplex',
  multiplex_other: 'Other Multiplex',
  other: 'Other',
};

// Category colors for charts
export const CATEGORY_COLORS: Record<string, string> = {
  secondary_suite: '#3b82f6', // blue
  laneway_suite: '#10b981', // emerald
  garden_suite: '#8b5cf6', // violet
  duplex: '#f59e0b', // amber
  triplex: '#ef4444', // red
  fourplex: '#ec4899', // pink
  multiplex_other: '#6366f1', // indigo
  other: '#6b7280', // gray
};

// Toronto coordinates for map centering
export const TORONTO_CENTER = {
  lat: 43.6532,
  lng: -79.3832,
};

export const TORONTO_BOUNDS = {
  north: 43.855,
  south: 43.58,
  east: -79.12,
  west: -79.64,
};
