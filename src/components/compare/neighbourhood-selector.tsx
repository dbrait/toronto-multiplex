'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Plus, ChevronDown } from 'lucide-react';

interface NeighbourhoodSelectorProps {
  allNeighbourhoods: string[];
  selected: string[];
  onAdd: (neighbourhood: string) => void;
  onRemove: (neighbourhood: string) => void;
  onClearAll: () => void;
}

export function NeighbourhoodSelector({
  allNeighbourhoods,
  selected,
  onAdd,
  onRemove,
  onClearAll,
}: NeighbourhoodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter neighbourhoods based on search
  const availableNeighbourhoods = allNeighbourhoods.filter(
    (n) => !selected.includes(n) && n.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (neighbourhood: string) => {
    onAdd(neighbourhood);
    setSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative" ref={dropdownRef}>
        <div
          className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg cursor-text"
          onClick={() => {
            setIsOpen(true);
            inputRef.current?.focus();
          }}
        >
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search and add neighbourhoods..."
            className="flex-1 outline-none text-gray-700 placeholder-gray-400"
          />
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* Dropdown */}
        {isOpen && availableNeighbourhoods.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
            {availableNeighbourhoods.map((neighbourhood) => (
              <button
                key={neighbourhood}
                onClick={() => handleSelect(neighbourhood)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between group"
              >
                <span className="text-gray-700">{neighbourhood}</span>
                <Plus className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        )}

        {isOpen && search && availableNeighbourhoods.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
            No neighbourhoods found matching &quot;{search}&quot;
          </div>
        )}
      </div>

      {/* Selected Chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Comparing:</span>
          {selected.map((neighbourhood) => (
            <span
              key={neighbourhood}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
            >
              {neighbourhood}
              <button
                onClick={() => onRemove(neighbourhood)}
                className="hover:bg-blue-100 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {selected.length >= 2 && (
            <button
              onClick={onClearAll}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
