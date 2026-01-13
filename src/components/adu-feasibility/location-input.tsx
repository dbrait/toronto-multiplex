'use client';

import { useState } from 'react';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LocationInputProps {
  neighbourhoods: string[];
  onSelect: (neighbourhood: string) => void;
  isLoading: boolean;
}

export function LocationInput({ neighbourhoods, onSelect, isLoading }: LocationInputProps) {
  const [inputMode, setInputMode] = useState<'address' | 'dropdown'>('dropdown');
  const [address, setAddress] = useState('');
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddressSearch = async () => {
    if (!address.trim()) return;

    setIsGeocoding(true);
    setError(null);

    try {
      // Use Nominatim to geocode the address
      const query = encodeURIComponent(`${address}, Toronto, Ontario, Canada`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1`
      );
      const data = await response.json();

      if (data.length === 0) {
        setError('Address not found. Please try a different address or select a neighbourhood.');
        setIsGeocoding(false);
        return;
      }

      const result = data[0];
      const postcode = result.address?.postcode;

      if (!postcode) {
        setError('Could not determine postal code. Please select a neighbourhood instead.');
        setIsGeocoding(false);
        return;
      }

      // Infer neighbourhood from postal code prefix
      const neighbourhood = inferNeighbourhoodFromPostal(postcode);

      if (!neighbourhood) {
        setError('Could not determine neighbourhood. Please select from the dropdown.');
        setIsGeocoding(false);
        return;
      }

      // Check if this neighbourhood exists in our data
      const matchedNeighbourhood = neighbourhoods.find(
        n => n.toLowerCase() === neighbourhood.toLowerCase()
      );

      if (!matchedNeighbourhood) {
        setError(`Neighbourhood "${neighbourhood}" not found in our database. Please select from the dropdown.`);
        setIsGeocoding(false);
        return;
      }

      setSelectedNeighbourhood(matchedNeighbourhood);
      onSelect(matchedNeighbourhood);
    } catch (err) {
      setError('Error looking up address. Please try again or select a neighbourhood.');
      console.error('Geocoding error:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleDropdownSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedNeighbourhood(value);
    if (value) {
      onSelect(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddressSearch();
    }
  };

  return (
    <Card>
      <CardContent className="py-6">
        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setInputMode('dropdown')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'dropdown'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MapPin className="inline-block w-4 h-4 mr-2" />
              Select Neighbourhood
            </button>
            <button
              onClick={() => setInputMode('address')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'address'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Search className="inline-block w-4 h-4 mr-2" />
              Search by Address
            </button>
          </div>

          {/* Dropdown Mode */}
          {inputMode === 'dropdown' && (
            <div className="relative">
              <select
                value={selectedNeighbourhood}
                onChange={handleDropdownSelect}
                disabled={isLoading}
                className="w-full appearance-none bg-white border border-gray-300 rounded-lg py-3 px-4 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select a neighbourhood...</option>
                {neighbourhoods.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Address Search Mode */}
          {inputMode === 'address' && (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter a Toronto address..."
                  className="w-full bg-white border border-gray-300 rounded-lg py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleAddressSearch}
                disabled={isGeocoding || !address.trim()}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isGeocoding ? 'Searching...' : 'Search'}
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}

          {/* Help Text */}
          <p className="text-sm text-gray-500">
            {inputMode === 'dropdown'
              ? 'Select a neighbourhood to see the ADU feasibility score based on historical permit data.'
              : 'Enter a Toronto street address and we\'ll find the neighbourhood for you.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Postal code to neighbourhood mapping (simplified version)
function inferNeighbourhoodFromPostal(postal: string): string | null {
  const prefix = postal.substring(0, 3).toUpperCase();

  const postalToNeighbourhood: Record<string, string> = {
    // Downtown
    'M5V': 'Waterfront Communities-The Island',
    'M5J': 'Waterfront Communities-The Island',
    'M5H': 'Bay Street Corridor',
    'M5G': 'Bay Street Corridor',
    'M5B': 'Moss Park',
    'M5A': 'St. Lawrence-East Bayfront-The Islands',
    'M5E': 'St. Lawrence-East Bayfront-The Islands',
    'M5C': 'Old Toronto',
    'M4Y': 'Church-Yonge Corridor',
    'M4W': 'Rosedale-Moore Park',

    // West End
    'M6K': 'Parkdale-High Park',
    'M6R': 'Parkdale-High Park',
    'M6S': 'High Park-Swansea',
    'M6P': 'High Park North',
    'M6H': 'Dovercourt-Wallace Emerson-Junction',
    'M6J': 'Trinity-Bellwoods',
    'M6G': 'Palmerston-Little Italy',
    'M6E': 'Caledonia-Fairbank',
    'M6N': 'Rockcliffe-Smythe',
    'M6M': 'Mount Dennis',

    // East End
    'M4J': 'Danforth',
    'M4K': 'The Danforth West',
    'M4L': 'The Beaches',
    'M4E': 'The Beaches',
    'M4C': 'East York',
    'M4G': 'Leaside',
    'M4H': 'Thorncliffe Park',
    'M4N': 'Lawrence Park',
    'M4P': 'Davisville Village',
    'M4R': 'North Toronto',
    'M4S': 'Yonge-Eglinton',
    'M4T': 'Moore Park',
    'M4V': 'Deer Park',

    // North York
    'M2K': 'Bayview Woods-Steeles',
    'M2L': 'Banbury-Don Mills',
    'M2M': 'Newtonbrook',
    'M2N': 'Willowdale',
    'M2P': 'York Mills',
    'M2R': 'Lansing-Westgate',
    'M3A': 'Parkwoods-Donalda',
    'M3B': 'Don Mills',
    'M3C': 'Don Mills',
    'M3H': 'Bathurst Manor',
    'M3J': 'Black Creek',
    'M3K': 'Downsview',
    'M3L': 'Downsview',
    'M3M': 'Downsview',
    'M3N': 'Downsview-Roding-CFB',

    // Scarborough
    'M1B': 'Rouge',
    'M1C': 'Rouge',
    'M1E': 'West Hill',
    'M1G': 'Woburn',
    'M1H': 'Woburn',
    'M1J': 'Scarborough Village',
    'M1K': 'Kennedy Park',
    'M1L': 'Golden Mile',
    'M1M': 'Cliffside',
    'M1N': 'Birch Cliff',
    'M1P': 'Dorset Park',
    'M1R': 'Wexford-Maryvale',
    'M1S': 'Agincourt',
    'M1T': "Tam O'Shanter-Sullivan",
    'M1V': 'Milliken',
    'M1W': "L'Amoreaux",
    'M1X': 'Rouge',

    // Etobicoke
    'M8V': 'Mimico',
    'M8W': 'Long Branch',
    'M8X': 'Kingsway South',
    'M8Y': 'Mimico',
    'M8Z': 'Mimico',
    'M9A': 'Etobicoke West Mall',
    'M9B': 'West Deane Park',
    'M9C': 'Markland Wood',
    'M9P': 'Westmount',
    'M9R': 'Kingsview Village-The Westway',
    'M9V': 'Thistletown-Beaumond Heights',
    'M9W': 'Rexdale-Kipling',
  };

  return postalToNeighbourhood[prefix] || null;
}
