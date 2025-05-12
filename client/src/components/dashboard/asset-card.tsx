import { SmartLabelWithTrace, TracePoint } from '@shared/schema';
import { formatTime } from '@/lib/format-utils';
import { History, Info, Package, Truck, Anchor, PackageCheck } from 'lucide-react';

interface AssetCardProps {
  label: SmartLabelWithTrace;
  position: TracePoint;
  status: 'Moving' | 'Idle' | 'Delivered';
  currentTime: Date;
  duration: string;
  onClick: () => void;
  onHistoryClick?: (label: SmartLabelWithTrace, event: React.MouseEvent) => void;
  onDetailsClick?: (label: SmartLabelWithTrace, event: React.MouseEvent) => void;
}

export function AssetCard({
  label,
  position,
  status,
  currentTime,
  duration,
  onClick,
  onHistoryClick = () => {},
  onDetailsClick = () => {}
}: AssetCardProps) {
  return (
    <div 
      className="bg-white rounded-lg shadow-sm mb-4 p-4 border-l-4 border-primary cursor-pointer hover:shadow-md transition" 
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-md">{label.asset}</h3>
        <span className={`text-xs px-2 py-1 flex items-center gap-1 
          ${status === 'Moving' 
            ? 'bg-green-100 text-green-600' 
            : status === 'Delivered' 
              ? 'bg-blue-100 text-blue-600' 
              : 'bg-gray-100 text-gray-500'
          } rounded-full font-medium`}>
          {status === 'Moving' ? (
            <Truck className="h-3 w-3" />
          ) : status === 'Idle' ? (
            <Anchor className="h-3 w-3" />
          ) : (
            <PackageCheck className="h-3 w-3" />
          )}
          {status}
        </span>
      </div>
      <div className="text-xs text-gray-500 mb-3">{label.id}</div>
      
      <div className={`grid ${status === 'Delivered' ? 'grid-cols-2' : 'grid-cols-1'} gap-3 mb-3`}>
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-xs text-gray-500">Last Updated</div>
          <div className="text-sm font-medium">{formatTime(currentTime)}</div>
        </div>
        {status === 'Delivered' && (
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-500">Duration</div>
            <div className="text-sm font-medium">{duration}</div>
          </div>
        )}
      </div>
      
      <div className="flex space-x-2 items-center mb-2">
        <i className="fas fa-location-dot text-gray-400 text-sm"></i>
        <div className="text-sm">{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</div>
      </div>
      
      <div className="flex justify-between mt-3 pt-2 border-t border-gray-100">
        <button 
          className="text-xs text-primary hover:text-blue-700 font-medium"
          onClick={(e) => {
            e.stopPropagation(); // Prevent the card's onClick from firing
            onHistoryClick(label, e);
          }}
        >
          <History className="h-3 w-3 inline mr-1" /> History
        </button>
        <button 
          className="text-xs text-primary hover:text-blue-700 font-medium"
          onClick={(e) => {
            e.stopPropagation(); // Prevent the card's onClick from firing
            onDetailsClick(label, e);
          }}
        >
          <Info className="h-3 w-3 inline mr-1" /> Details
        </button>
      </div>
    </div>
  );
}
