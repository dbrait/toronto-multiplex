'use client';

import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';

interface TimelineControlsProps {
  currentIndex: number;
  totalMonths: number;
  isPlaying: boolean;
  speed: number;
  currentMonth: string;
  onPlay: () => void;
  onPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (index: number) => void;
  onSpeedChange: (speed: number) => void;
}

const SPEED_OPTIONS = [
  { value: 2000, label: '0.5x' },
  { value: 1000, label: '1x' },
  { value: 500, label: '2x' },
  { value: 250, label: '4x' },
];

export function TimelineControls({
  currentIndex,
  totalMonths,
  isPlaying,
  speed,
  currentMonth,
  onPlay,
  onPause,
  onPrevious,
  onNext,
  onSeek,
  onSpeedChange,
}: TimelineControlsProps) {
  // Format month for display (e.g., "2024-01" -> "Jan 2024")
  const formatMonth = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-CA', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Current Month Display */}
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">
          {formatMonth(currentMonth)}
        </div>
        <div className="text-sm text-gray-500">
          Month {currentIndex + 1} of {totalMonths}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onSeek(0)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          title="Go to start"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={isPlaying ? onPause : onPlay}
          className="p-3 rounded-full bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </button>

        <button
          onClick={onNext}
          disabled={currentIndex === totalMonths - 1}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          onClick={() => onSeek(totalMonths - 1)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          title="Go to end"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Timeline Slider */}
      <div className="px-2">
        <input
          type="range"
          min={0}
          max={totalMonths - 1}
          value={currentIndex}
          onChange={(e) => onSeek(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
        />
      </div>

      {/* Speed Control */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-gray-500">Speed:</span>
        <div className="flex gap-1">
          {SPEED_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onSpeedChange(option.value)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                speed === option.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
