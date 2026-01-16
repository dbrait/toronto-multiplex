'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
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

interface Permit {
  lat: number;
  lng: number;
  category: string;
  address: string;
  neighbourhood: string | null;
}

interface MonthData {
  month: string;
  permits: Permit[];
  summary: {
    total: number;
    byCategory: Record<string, number>;
  };
}

interface AnimatedMapProps {
  months: MonthData[];
  currentIndex: number;
  showCumulative: boolean;
}

export function AnimatedMap({ months, currentIndex, showCumulative }: AnimatedMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  // Get permits to display based on mode
  const permitsToShow: Permit[] = [];
  if (showCumulative) {
    // Show all permits up to and including current month
    for (let i = 0; i <= currentIndex && i < months.length; i++) {
      permitsToShow.push(...months[i].permits);
    }
  } else {
    // Show only current month's permits
    if (months[currentIndex]) {
      permitsToShow.push(...months[currentIndex].permits);
    }
  }

  // Calculate opacity based on age (for cumulative mode)
  const getOpacity = (permitIndex: number, totalPermits: number) => {
    if (!showCumulative) return 0.8;
    // Older permits are more transparent
    const age = 1 - permitIndex / totalPermits;
    return 0.3 + age * 0.5;
  };

  return (
    <div className="h-[500px] rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={[TORONTO_CENTER.lat, TORONTO_CENTER.lng]}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {permitsToShow.map((permit, index) => (
          <CircleMarker
            key={`${permit.lat}-${permit.lng}-${index}`}
            center={[permit.lat, permit.lng]}
            radius={7}
            fillColor={CATEGORY_COLORS[permit.category] || '#6b7280'}
            color="#fff"
            weight={1}
            fillOpacity={getOpacity(index, permitsToShow.length)}
          >
            <Popup>
              <div>
                <p className="font-medium">{permit.address}</p>
                <p className="text-sm text-gray-600 capitalize">
                  {permit.category.replace(/_/g, ' ')}
                </p>
                {permit.neighbourhood && (
                  <p className="text-xs text-gray-500">{permit.neighbourhood}</p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
