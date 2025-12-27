'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CATEGORY_COLORS, TORONTO_CENTER } from '@/lib/constants';

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
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface MapPoint {
  latitude: number;
  longitude: number;
  category: string;
  address: string;
}

interface PermitMapProps {
  data: MapPoint[];
}

export function PermitMap({ data }: PermitMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permit Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permit Locations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96 rounded-lg overflow-hidden">
          <MapContainer
            center={[TORONTO_CENTER.lat, TORONTO_CENTER.lng]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {data.map((point, index) => (
              <CircleMarker
                key={index}
                center={[point.latitude, point.longitude]}
                radius={6}
                fillColor={CATEGORY_COLORS[point.category] || '#6b7280'}
                color="#fff"
                weight={1}
                fillOpacity={0.8}
              >
                <Popup>
                  <div>
                    <p className="font-medium">{point.address}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {point.category.replace(/_/g, ' ')}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
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
      </CardContent>
    </Card>
  );
}
