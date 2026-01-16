'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { CATEGORY_COLORS } from '@/lib/constants';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

interface NearbyPermit {
  id: string;
  address: string;
  category: string;
  categoryDisplay: string;
  status: string;
  distance: number;
  latitude: number;
  longitude: number;
}

interface LocationMapProps {
  searchLocation: {
    lat: number;
    lng: number;
    formatted: string;
  };
  permits: NearbyPermit[];
  radiusKm: number;
}

export function LocationMap({ searchLocation, permits, radiusKm }: LocationMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [leafletIcon, setLeafletIcon] = useState<L.Icon | null>(null);

  useEffect(() => {
    setIsMounted(true);

    // Import Leaflet and create icon on client side
    import('leaflet').then((L) => {
      const icon = new L.Icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      setLeafletIcon(icon);
    });
  }, []);

  if (!isMounted || !leafletIcon) {
    return (
      <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-80 rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={[searchLocation.lat, searchLocation.lng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Search radius circle */}
          <Circle
            center={[searchLocation.lat, searchLocation.lng]}
            radius={radiusKm * 1000}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '5, 5',
            }}
          />

          {/* Search location marker */}
          <Marker
            position={[searchLocation.lat, searchLocation.lng]}
            icon={leafletIcon}
          >
            <Popup>
              <div>
                <p className="font-medium text-blue-600">Search Location</p>
                <p className="text-sm text-gray-600">{searchLocation.formatted}</p>
              </div>
            </Popup>
          </Marker>

          {/* Nearby permits */}
          {permits.map((permit) => (
            <CircleMarker
              key={permit.id}
              center={[permit.latitude, permit.longitude]}
              radius={8}
              fillColor={CATEGORY_COLORS[permit.category] || '#6b7280'}
              color="#fff"
              weight={2}
              fillOpacity={0.9}
            >
              <Popup>
                <div>
                  <p className="font-medium">{permit.address}</p>
                  <p className="text-sm text-gray-600">{permit.categoryDisplay}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {permit.distance < 0.1
                      ? `${Math.round(permit.distance * 1000)}m away`
                      : `${permit.distance.toFixed(2)}km away`}
                  </p>
                  <p className="text-xs text-gray-500">Status: {permit.status}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow" />
          <span className="text-xs text-gray-600">Search Location</span>
        </div>
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <div key={category} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-600 capitalize">
              {category.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
