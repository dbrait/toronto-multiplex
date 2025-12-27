// Toronto Building Permit Types

export interface RawPermit {
  PERMIT_NUM: string;
  REVISION_NUM: string;
  PERMIT_TYPE: string;
  STRUCTURE_TYPE: string;
  WORK: string;
  STREET_NUM: string;
  STREET_NAME: string;
  STREET_TYPE: string;
  STREET_DIRECTION: string;
  POSTAL: string;
  GEO_ID: string;
  APPLICATION_DATE: string;
  ISSUED_DATE: string | null;
  COMPLETED_DATE: string | null;
  STATUS: string;
  DESCRIPTION: string;
  CURRENT_USE: string;
  PROPOSED_USE: string;
  DWELLING_UNITS_CREATED: number | null;
  DWELLING_UNITS_LOST: number | null;
  GROSS_FLOOR_AREA: number | null;
  // Coordinates from geocoding
  LATITUDE?: number;
  LONGITUDE?: number;
}

export interface ProcessedPermit {
  id: string;
  permitNum: string;
  revisionNum: string;
  permitType: string;
  structureType: string;
  work: string;
  address: string;
  postalCode: string;
  geoId: string;
  applicationDate: Date;
  issuedDate: Date | null;
  completedDate: Date | null;
  status: string;
  description: string;
  currentUse: string;
  proposedUse: string;
  dwellingUnitsCreated: number;
  dwellingUnitsLost: number;
  netDwellingUnits: number;
  grossFloorArea: number | null;
  latitude: number | null;
  longitude: number | null;
  neighbourhood: string | null;
  ward: string | null;
  // Calculated fields
  processingDays: number | null;
  completionDays: number | null;
  totalDays: number | null;
  category: PermitCategory;
}

export type PermitCategory =
  | 'secondary_suite'
  | 'laneway_suite'
  | 'garden_suite'
  | 'duplex'
  | 'triplex'
  | 'fourplex'
  | 'multiplex_other'
  | 'other';

export interface NeighbourhoodStats {
  name: string;
  totalPermits: number;
  activePermits: number;
  completedPermits: number;
  totalUnitsCreated: number;
  avgProcessingDays: number | null;
  byCategory: Record<PermitCategory, number>;
}

export interface TimeSeriesData {
  date: string;
  count: number;
  category?: PermitCategory;
}

export interface KPIData {
  totalActivePermits: number;
  totalCompletedPermits: number;
  totalUnitsCreated: number;
  avgProcessingDays: number;
  permitsThisYear: number;
  permitsLastYear: number;
  yearOverYearChange: number;
}

export interface FilterState {
  categories: PermitCategory[];
  neighbourhoods: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  status: ('Active' | 'Closed' | 'Cancelled')[];
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    AREA_NAME?: string;
    AREA_S_CD?: string;
    [key: string]: unknown;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}
