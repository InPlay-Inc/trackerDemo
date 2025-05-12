import { useEffect, useRef } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet';
import { TracePoint } from '@shared/schema';

interface MapControlComponentProps {
  center?: [number, number];
  zoom?: number;
  selectedLabelChanged: boolean;
  routeBounds?: [number, number][];
  fitBoundsOptions?: {
    padding?: [number, number];
    maxZoom?: number;
  };
}

// Component to handle map controls without re-rendering the map
function MapControlComponent({ 
  center, 
  zoom, 
  selectedLabelChanged, 
  routeBounds,
  fitBoundsOptions = { padding: [50, 50], maxZoom: 12 }
}: MapControlComponentProps) {
  const map = useMap();
  const prevCenterRef = useRef<[number, number] | undefined>(undefined);
  
  useEffect(() => {
    // Handle route bounds if provided (takes priority for long routes)
    if (routeBounds) {
      map.fitBounds(routeBounds, fitBoundsOptions);
      return;
    }
    
    // Otherwise fly to center if specifically requested by label selection
    if (center && selectedLabelChanged) {
      // Check if center has changed to avoid unnecessary flying
      const centerChanged = !prevCenterRef.current || 
        prevCenterRef.current[0] !== center[0] || 
        prevCenterRef.current[1] !== center[1];
        
      if (centerChanged) {
        map.flyTo(center, zoom || map.getZoom());
        prevCenterRef.current = center;
      }
    }
  }, [center, zoom, map, selectedLabelChanged, routeBounds, fitBoundsOptions]);
  
  return null;
}

interface MapContainerProps {
  className?: string;
  center: [number, number];
  zoom?: number;
  children?: React.ReactNode;
  flyToCenter?: [number, number];
  flyToZoom?: number;
  routePoints?: TracePoint[];
  shouldFitBounds?: boolean;
}

export function MapContainer({
  className = '',
  center,
  zoom = 13,
  children,
  flyToCenter,
  flyToZoom,
  routePoints = [],
  shouldFitBounds = false,
}: MapContainerProps) {
  const mapClassName = `w-full h-full relative z-10 ${className}`;
  
  // Track if flyToCenter was triggered by a label selection
  const prevFlyToCenterRef = useRef<[number, number] | undefined>(undefined);
  const selectedLabelChanged = flyToCenter !== prevFlyToCenterRef.current;
  
  // Update the ref with the current flyToCenter value
  if (flyToCenter !== prevFlyToCenterRef.current) {
    prevFlyToCenterRef.current = flyToCenter;
  }
  
  // Calculate bounds for route points if provided and should fit bounds
  const routeBounds = shouldFitBounds && routePoints.length > 1 
    ? routePoints.map(point => [point.lat, point.lng] as [number, number])
    : undefined;
    
  // Adjust padding and zoom based on route length
  const isLongRoute = routePoints.length > 50; // LA to SF route has many points
  const fitBoundsOptions = isLongRoute 
    ? { padding: [50, 50], maxZoom: 8 } // Use lower zoom for long routes
    : { padding: [50, 50], maxZoom: 14 }; // Higher zoom for short routes
  
  return (
    <LeafletMapContainer
      center={center}
      zoom={zoom}
      className={mapClassName}
      scrollWheelZoom={true}
      zoomControl={true}
      doubleClickZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
      <MapControlComponent 
        center={flyToCenter} 
        zoom={flyToZoom} 
        selectedLabelChanged={selectedLabelChanged}
        routeBounds={routeBounds}
        fitBoundsOptions={fitBoundsOptions}
      />
    </LeafletMapContainer>
  );
}
