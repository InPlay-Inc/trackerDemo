import { Flag, MapPin, Heart } from 'lucide-react';

interface LegendProps {
  displayMode: 'demo' | 'realtime';
}

export function Legend({ displayMode }: LegendProps) {
  return (
    <div className="absolute right-4 top-4 bg-white p-4 rounded-lg shadow-md z-[1000]">
      <h3 className="font-medium mb-2 text-sm">Legend</h3>
      {displayMode === 'demo' ? (
        <>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs">Moving</span>
          </div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs">Delivered</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span className="text-xs">Idle</span>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
            <span className="text-xs">Moving</span>
          </div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
            <span className="text-xs">Delivered</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-white"></div>
            <span className="text-xs">Idle</span>
          </div>
        </>
      )}
    </div>
  );
}

