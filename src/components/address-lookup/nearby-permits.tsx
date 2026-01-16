'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDistance } from '@/lib/address-lookup';

interface NearbyPermit {
  id: string;
  address: string;
  category: string;
  categoryDisplay: string;
  status: string;
  distance: number;
  applicationDate: string;
}

interface NearbyPermitsProps {
  permits: NearbyPermit[];
  radiusKm: number;
}

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-blue-100 text-blue-700',
  'Permit Issued': 'bg-green-100 text-green-700',
  'Closed - Issued': 'bg-green-100 text-green-700',
  'Closed - Completed': 'bg-emerald-100 text-emerald-700',
  'Closed - Cancelled': 'bg-gray-100 text-gray-700',
};

export function NearbyPermits({ permits, radiusKm }: NearbyPermitsProps) {
  const [showAll, setShowAll] = useState(false);
  const displayedPermits = showAll ? permits : permits.slice(0, 10);

  if (permits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Nearby Permits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No permits found within {radiusKm}km of this location.</p>
            <p className="text-sm mt-1">This area may be less active for multiplex development.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Nearby Permits ({permits.length} within {radiusKm}km)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Address</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Distance</th>
              </tr>
            </thead>
            <tbody>
              {displayedPermits.map((permit) => (
                <tr key={permit.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 text-gray-700">{permit.address}</td>
                  <td className="py-3 text-gray-600">{permit.categoryDisplay}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        STATUS_COLORS[permit.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {permit.status}
                    </span>
                  </td>
                  <td className="py-3 text-right text-gray-500 font-mono">
                    {formatDistance(permit.distance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {permits.length > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show All {permits.length} Permits
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
