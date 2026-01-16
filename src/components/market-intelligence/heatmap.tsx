'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TORONTO_CENTER } from '@/lib/constants';
import type { NeighbourhoodIntelligence, HotZoneCategory } from '@/lib/market-intelligence';
import { getCategoryColor } from '@/lib/market-intelligence';

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

interface HeatmapProps {
  data: NeighbourhoodIntelligence[];
  selectedCategory: HotZoneCategory | 'all';
  onNeighbourhoodClick?: (neighbourhood: string) => void;
}

const CATEGORY_LABELS: Record<HotZoneCategory, string> = {
  hot: 'Hot',
  warming: 'Warming',
  stable: 'Stable',
  cooling: 'Cooling',
};

export function Heatmap({ data, selectedCategory, onNeighbourhoodClick }: HeatmapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter data based on selected category
  const filteredData = selectedCategory === 'all'
    ? data
    : data.filter((d) => d.category === selectedCategory);

  // Calculate max permits for sizing
  const maxPermits = Math.max(...data.map((d) => d.metrics.totalPermits), 1);

  // Calculate circle radius based on permit count
  const getRadius = (permits: number) => {
    const minRadius = 8;
    const maxRadius = 25;
    return minRadius + (Math.sqrt(permits / maxPermits) * (maxRadius - minRadius));
  };

  if (!isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hot Zone Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hot Zone Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] rounded-lg overflow-hidden">
          <MapContainer
            center={[TORONTO_CENTER.lat, TORONTO_CENTER.lng]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredData
              .filter((zone) => zone.coordinates)
              .map((zone) => (
                <CircleMarker
                  key={zone.neighbourhood}
                  center={[zone.coordinates!.latitude, zone.coordinates!.longitude]}
                  radius={getRadius(zone.metrics.totalPermits)}
                  fillColor={getCategoryColor(zone.category)}
                  color="#fff"
                  weight={2}
                  fillOpacity={0.7}
                  eventHandlers={{
                    click: () => onNeighbourhoodClick?.(zone.neighbourhood),
                  }}
                >
                  <Popup>
                    <div className="min-w-[180px]">
                      <p className="font-semibold text-base">{zone.neighbourhood}</p>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Score:</span>
                          <span className="font-medium">{zone.hotZoneScore}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Permits:</span>
                          <span>{zone.metrics.totalPermits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Units:</span>
                          <span>{zone.metrics.totalUnits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">YoY Change:</span>
                          <span className={zone.metrics.yoyChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {zone.metrics.yoyChange >= 0 ? '+' : ''}{zone.metrics.yoyChange}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4">
          {(['hot', 'warming', 'stable', 'cooling'] as HotZoneCategory[]).map((category) => (
            <div key={category} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getCategoryColor(category) }}
              />
              <span className="text-sm text-gray-600">
                {CATEGORY_LABELS[category]}
              </span>
            </div>
          ))}
          <div className="text-sm text-gray-400 ml-auto">
            Circle size = permit count
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
