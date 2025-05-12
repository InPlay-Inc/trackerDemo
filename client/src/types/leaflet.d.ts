declare module 'leaflet' {
  export * from 'leaflet';
  
  export function divIcon(options: DivIconOptions): DivIcon;
  
  export interface DivIconOptions extends IconOptions {
    html?: string;
    bgPos?: PointExpression;
    iconSize?: PointExpression;
    iconAnchor?: PointExpression;
    className?: string;
  }
  
  export interface DivIcon extends Icon {
    createIcon(oldIcon?: HTMLElement): HTMLElement;
    createShadow(oldIcon?: HTMLElement): HTMLElement;
  }
}

declare module 'react-leaflet' {
  import { DivIcon, Icon, Path, LatLngExpression, PathOptions } from 'leaflet';
  import { ReactNode } from 'react';
  
  // Component Interfaces
  export const MapContainer: React.FC<MapContainerProps>;
  export const TileLayer: React.FC<TileLayerProps>;
  export const Marker: React.FC<MarkerProps>;
  export const Popup: React.FC<PopupProps>;
  export const Polyline: React.FC<PolylineProps>;
  
  // Hook Exports
  export function useMap(): any;
  export function useMapEvent(event: string, handler: (...args: any[]) => void): any;
  
  // Props interfaces
  export interface MarkerProps {
    position: [number, number] | LatLngExpression;
    icon?: Icon | DivIcon;
    eventHandlers?: {
      click?: () => void;
      mouseover?: () => void;
      mouseout?: () => void;
      [key: string]: (() => void) | undefined;
    };
    children?: ReactNode;
  }
  
  export interface PopupProps {
    children?: ReactNode;
  }
  
  export interface PolylineProps {
    positions: LatLngExpression[] | LatLngExpression[][];
    pathOptions?: PathOptions;
    children?: ReactNode;
  }
  
  export interface TileLayerProps {
    attribution: string;
    url: string;
    children?: ReactNode;
  }
  
  export interface MapContainerProps {
    center: [number, number] | LatLngExpression;
    zoom: number;
    className?: string;
    scrollWheelZoom?: boolean;
    zoomControl?: boolean;
    doubleClickZoom?: boolean;
    children?: ReactNode;
  }
}