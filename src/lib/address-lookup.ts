// Address lookup utilities for geocoding and neighbourhood detection

export interface GeocodedAddress {
  input: string;
  formatted: string;
  lat: number;
  lng: number;
}

export interface NearbyPermitSummary {
  total: number;
  byCategory: Record<string, number>;
  avgDistance: number;
}

// Geocode an address using Nominatim (OpenStreetMap)
export async function geocodeAddress(address: string): Promise<GeocodedAddress | null> {
  // Add Toronto context to improve results
  const searchQuery = `${address}, Toronto, ON, Canada`;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: searchQuery,
          format: 'json',
          limit: '1',
          addressdetails: '1',
        }),
      {
        headers: {
          'User-Agent': 'TorontoMultiplexDashboard/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error('Geocoding failed:', response.statusText);
      return null;
    }

    const results = await response.json();

    if (!results || results.length === 0) {
      return null;
    }

    const result = results[0];

    // Verify the result is in Toronto area (rough bounding box)
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    // Toronto approximate bounds
    const torontoBounds = {
      minLat: 43.5,
      maxLat: 43.9,
      minLng: -79.7,
      maxLng: -79.1,
    };

    if (
      lat < torontoBounds.minLat ||
      lat > torontoBounds.maxLat ||
      lng < torontoBounds.minLng ||
      lng > torontoBounds.maxLng
    ) {
      console.warn('Address outside Toronto bounds');
      return null;
    }

    return {
      input: address,
      formatted: result.display_name,
      lat,
      lng,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Format distance for display
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 0.1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else {
    return `${distanceKm.toFixed(1)}km`;
  }
}

// Summarize nearby permits
export function summarizeNearbyPermits(
  permits: { category: string; distance: number }[]
): NearbyPermitSummary {
  const byCategory: Record<string, number> = {};
  let totalDistance = 0;

  for (const permit of permits) {
    byCategory[permit.category] = (byCategory[permit.category] || 0) + 1;
    totalDistance += permit.distance;
  }

  return {
    total: permits.length,
    byCategory,
    avgDistance: permits.length > 0 ? totalDistance / permits.length : 0,
  };
}

// Format category name for display
export function formatCategoryName(category: string): string {
  const categoryNames: Record<string, string> = {
    laneway_suite: 'Laneway Suite',
    garden_suite: 'Garden Suite',
    basement_apartment: 'Basement Apartment',
    secondary_suite: 'Secondary Suite',
    duplex_conversion: 'Duplex Conversion',
    triplex_conversion: 'Triplex Conversion',
    fourplex_conversion: 'Fourplex Conversion',
    multiplex_new: 'New Multiplex',
    other: 'Other',
  };
  return categoryNames[category] || category;
}
