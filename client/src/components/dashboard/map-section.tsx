import { useState } from 'react';
import { MapContainer } from '@/components/ui/map-container';
import { Marker, Polyline, Popup } from 'react-leaflet';
import { 
  Search, Layers, Crosshair, Truck, Anchor, PackageCheck,
  Flag, MapPin, Heart
} from 'lucide-react';
import L from 'leaflet';
import { SmartLabelWithTrace, TracePoint, RealTimeLabel } from '@shared/schema';
import { SimulationControls } from './simulation-controls';
import { Legend } from './legend';
import { getPositionAtTime } from '@/lib/map-utils';

interface MapSectionProps {
  labels: SmartLabelWithTrace[];
  currentTime: Date;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onLabelClick: (label: SmartLabelWithTrace) => void;
  selectedLabel?: SmartLabelWithTrace;
  speedMultiplier?: number;
  setSpeedMultiplier?: (multiplier: number) => void;
  onRestart?: () => void;
  realTimeLabels?: RealTimeLabel[];
  selectedRealTimeLabel?: RealTimeLabel;
  onRealTimeLabelClick?: (label: RealTimeLabel) => void;
  displayMode?: 'demo' | 'realtime';
}

export function MapSection({
  labels,
  currentTime,
  isPlaying,
  setIsPlaying,
  onLabelClick,
  selectedLabel,
  speedMultiplier = 1,
  setSpeedMultiplier = () => {},
  onRestart,
  realTimeLabels = [],
  selectedRealTimeLabel,
  onRealTimeLabelClick = () => {},
  displayMode = 'demo'
}: MapSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Assets');
  
  // Helper function to create an icon with a name label
  const createAssetIcon = (color: string, name: string) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="position: relative; text-align: center;">
          <div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; margin: 0 auto;"></div>
          <div style="position: absolute; white-space: nowrap; font-size: 10px; font-weight: bold; background: rgba(255,255,255,0.8); 
                      padding: 2px 4px; border-radius: 2px; top: 12px; left: 50%; transform: translateX(-50%);">
            ${name}
          </div>
        </div>
      `,
      iconSize: [60, 40],  // Make the icon size larger to accommodate the label
      iconAnchor: [30, 6], // Adjust anchor point to account for the label
    });
  };
  
  // Create a start point icon using Flag icon
  const createStartPointIcon = (name: string) => {
    return L.divIcon({
      className: 'custom-start-icon',
      html: `
        <div style="position: relative; text-align: center;">
          <div style="color: #16a34a; font-size: 20px; margin: 0 auto;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
          </div>
          <div style="position: absolute; white-space: nowrap; font-size: 10px; font-weight: bold; background: rgba(255,255,255,0.8); 
                      padding: 2px 4px; border-radius: 2px; top: 18px; left: 50%; transform: translateX(-50%);">
            Start: ${name}
          </div>
        </div>
      `,
      iconSize: [80, 50],  // Make the icon size larger to accommodate the label
      iconAnchor: [40, 20], // Adjust anchor point to account for the label
    });
  };
  
  // Create an end point icon using MapPin icon
  const createEndPointIcon = (name: string) => {
    return L.divIcon({
      className: 'custom-end-icon',
      html: `
        <div style="position: relative; text-align: center;">
          <div style="color: #ef4444; font-size: 20px; margin: 0 auto;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          <div style="position: absolute; white-space: nowrap; font-size: 10px; font-weight: bold; background: rgba(255,255,255,0.8); 
                      padding: 2px 4px; border-radius: 2px; top: 18px; left: 50%; transform: translateX(-50%);">
            End: ${name}
          </div>
        </div>
      `,
      iconSize: [80, 50],  // Make the icon size larger to accommodate the label
      iconAnchor: [40, 20], // Adjust anchor point to account for the label
    });
  };
  
  // Create a real-time label icon (with a pulsing effect)
  const createRealTimeLabelIcon = (name: string, status: string = 'active') => {
    // 根据状态确定颜色
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'moving':
          return '#10b981';  // green
        case 'delivered':
          return '#3b82f6';  // blue
        case 'idle':
          return '#6b7280';  // gray
        default:
          return '#10b981';  // 默认使用绿色
      }
    };

    const color = getStatusColor(status);

    return L.divIcon({
      className: 'custom-realtime-icon',
      html: `
        <div style="position: relative; text-align: center;">
          <div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; margin: 0 auto;"></div>
          <div style="position: absolute; white-space: nowrap; font-size: 10px; font-weight: bold; background: rgba(255,255,255,0.8); 
                      padding: 2px 4px; border-radius: 2px; top: 12px; left: 50%; transform: translateX(-50%);">
            ${name}
          </div>
        </div>
      `,
      iconSize: [60, 40],
      iconAnchor: [30, 6],
    });
  };
  
  // Calculate where to fly to if a label is selected
  const flyToPosition = selectedLabel 
    ? getPositionAtTime(selectedLabel.trace, currentTime)
    : selectedRealTimeLabel 
      ? selectedRealTimeLabel.position
      : undefined;
  
  const flyToCenter = flyToPosition 
    ? [flyToPosition.lat, flyToPosition.lng] as [number, number] 
    : undefined;

  // Determine color based on status
  const getMarkerColor = (label: SmartLabelWithTrace | RealTimeLabel) => {
    if ('isActive' in label) {
      return label.isActive ? '#3b82f6' : '#6b7280';
    }
    
    const currentPoint = getCurrentPoint(label);
    if (!currentPoint) return '#6b7280';
    
    return '#10b981';  // Default to green
  };

  // Determine display state based on label status
  const getMarkerState = (label: SmartLabelWithTrace | RealTimeLabel) => {
    if ('isActive' in label) {
      return label.isActive ? 'active' : 'inactive';
    }
    return 'active';
  };

  return (
    <div className="flex-1 p-4 h-full flex flex-col">
      <div className="bg-white p-3 rounded-lg shadow-sm mb-4 flex justify-between items-center">
        <div className="flex space-x-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search assets..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
          </div>
          <select 
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option>All Assets</option>
            <option>Moving</option>
            <option>Idle</option>
            <option>Delivered</option>
          </select>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-gray-100 hover:bg-gray-200 p-2 rounded text-gray-600">
            <Layers className="h-5 w-5" />
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 p-2 rounded text-gray-600">
            <Crosshair className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="flex-1 bg-gray-200 rounded-lg shadow-sm relative">
        <MapContainer
          center={[34.0522, -118.2437]} // Los Angeles center
          zoom={13}
          flyToCenter={flyToCenter}
          flyToZoom={15}
          routePoints={selectedLabel?.trace || []}
          shouldFitBounds={!!selectedLabel}
        >
          {/* Only show demo labels in demo mode */}
          {displayMode === 'demo' && labels.map(label => {
            const position = getPositionAtTime(label.trace, currentTime);
            const pastTrace = label.trace.filter(pos => new Date(pos.timestamp) <= currentTime);
            
            if (position) {
              // Determine asset status
              const lastTracePoint = label.trace[label.trace.length - 1];
              const lastTraceTime = new Date(lastTracePoint.timestamp);
              let assetStatus: 'Moving' | 'Idle' | 'Delivered';
              
              if (currentTime >= lastTraceTime && label.targetReached) {
                assetStatus = 'Delivered';
              } else if (currentTime < lastTraceTime) {
                assetStatus = 'Moving';
              } else {
                assetStatus = 'Idle';
              }
              
              // Filter assets based on selected status
              if (filterStatus !== 'All Assets' && assetStatus !== filterStatus) {
                return null;
              }
              
              // Create an icon with the appropriate color and asset name
              const statusColor = assetStatus === 'Moving' 
                ? '#10b981'  // green 
                : assetStatus === 'Delivered' 
                  ? '#3b82f6'  // blue
                  : '#6b7280'; // gray
              
              const icon = createAssetIcon(statusColor, label.asset);
              
              return (
                <div key={label.id}>
                  <Marker 
                    position={[position.lat, position.lng]} 
                    icon={icon}
                    eventHandlers={{
                      click: () => onLabelClick(label)
                    }}
                  >
                    <Popup>
                      <div className="text-sm font-medium">{label.asset}</div>
                      <div className="text-xs mt-1">{assetStatus}</div>
                    </Popup>
                  </Marker>
                  {pastTrace.length > 1 && (
                    <Polyline
                      positions={pastTrace.map(pos => [pos.lat, pos.lng])}
                      pathOptions={{
                        // Assign different colors based on label ID
                        color: label.id === "label001" ? "#3b82f6" : // blue
                              label.id === "label002" ? "#ef4444" : // red
                              label.id === "label003" ? "#10b981" : // green
                              label.id === "label004" ? "#8b5cf6" : // purple
                              label.id === "label005" ? "#f97316" : // orange
                              "#6b7280", // gray (default)
                        weight: 3,
                        dashArray: "5, 10"
                      }}
                    />
                  )}
                  
                  {/* Add start point marker */}
                  {label.trace.length > 0 && (
                    <Marker
                      position={[label.trace[0].lat, label.trace[0].lng]}
                      icon={createStartPointIcon(label.asset)}
                    >
                      <Popup>
                        <div className="text-sm font-medium">Starting Point</div>
                        <div className="text-xs mt-1">{label.asset}</div>
                        <div className="text-xs">
                          {new Date(label.trace[0].timestamp).toLocaleTimeString()}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Add end point marker */}
                  {label.trace.length > 0 && (
                    <Marker
                      position={[label.trace[label.trace.length - 1].lat, label.trace[label.trace.length - 1].lng]}
                      icon={createEndPointIcon(label.asset)}
                    >
                      <Popup>
                        <div className="text-sm font-medium">Destination</div>
                        <div className="text-xs mt-1">{label.asset}</div>
                        <div className="text-xs">
                          {new Date(label.trace[label.trace.length - 1].timestamp).toLocaleTimeString()}
                        </div>
                        <div className="text-xs mt-1">
                          {label.targetReached ? "Delivered ✓" : "Not yet delivered"}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </div>
              );
            }
            return null;
          })}

          {/* Real-time labels */}
          {displayMode === 'realtime' && realTimeLabels.map(label => {
            // 根据标签状态确定显示状态
            const status = label.meta?.status || 'active';
            const icon = createRealTimeLabelIcon(label.name || label.macId, status);
            
            return (
              <div key={label.id}>
                <Marker 
                  position={[label.position.lat, label.position.lng]} 
                  icon={icon}
                  eventHandlers={{
                    click: () => onRealTimeLabelClick(label)
                  }}
                >
                  <Popup>
                    <div className="text-sm font-medium">{label.name || label.macId}</div>
                    {label.meta && (
                      <>
                        <div className="text-xs mt-1">Status: {status}</div>
                        {label.meta.battery !== undefined && (
                          <div className="text-xs">Battery: {label.meta.battery}%</div>
                        )}
                        {label.meta.temperature !== undefined && (
                          <div className="text-xs">Temperature: {label.meta.temperature}°C</div>
                        )}
                        <div className="text-xs">
                          Last Updated: {new Date(label.position.timestamp).toLocaleString()}
                        </div>
                      </>
                    )}
                  </Popup>
                </Marker>
              </div>
            );
          })}
        </MapContainer>
        
        {/* Simulation Controls */}
        <SimulationControls 
          isPlaying={isPlaying} 
          setIsPlaying={setIsPlaying} 
          speedMultiplier={speedMultiplier}
          setSpeedMultiplier={setSpeedMultiplier}
          onRestart={onRestart}
          displayMode={displayMode}
        />
        
        {/* Map Legend */}
        <Legend displayMode={displayMode} />
      </div>
    </div>
  );
}
