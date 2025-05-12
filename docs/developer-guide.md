# InPlay Live Asset Tracking Dashboard - Developer Guide

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technical Components](#technical-components)
3. [Frontend Implementation](#frontend-implementation)
4. [Backend Implementation](#backend-implementation)
5. [Data Models](#data-models)
6. [API Integration](#api-integration)
7. [WebSocket Implementation](#websocket-implementation)
8. [Map Rendering](#map-rendering)
9. [Time Simulation](#time-simulation)
10. [Development Guidelines](#development-guidelines)

## System Architecture

The InPlay Live Asset Tracking Dashboard is built as a full-stack web application with the following architecture:

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ React UI    │ ◄───► │ Express API │ ◄───► │ MemStorage  │
└─────────────┘       └─────────────┘       └─────────────┘
       ▲                     ▲                     ▲
       │                     │                     │
       ▼                     ▼                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ WebSockets  │ ◄───► │ ShipRec API │       │ Schema      │
└─────────────┘       └─────────────┘       └─────────────┘
```

**Key Components:**
- Frontend: React with TypeScript and Vite
- Mapping: Leaflet with react-leaflet
- State Management: React Query and React Context
- Backend: Express.js server
- Storage: In-memory storage
- Real-time Updates: WebSockets
- External API: ShipRec tracking API
- Styling: Tailwind CSS with shadcn/ui components

## Technical Components

### Client-side Components

- **Dashboard**: Main container component that coordinates all dashboard elements
- **Map Section**: Interactive map display with filtering and time controls
- **Sidebar**: Asset listing and detailed information display
- **Simulation Controls**: Controls for time simulation speed and playback
- **Real-time Tracking**: Interface for adding and tracking real-time assets
- **ShipRec Integration**: Components for API configuration and package importing

### Server-side Components

- **Express Server**: Handles HTTP requests and WebSocket connections
- **Routes**: API endpoints for data access and manipulation
- **Storage**: In-memory data persistence layer
- **ShipRec Client**: Integration with external ShipRec API
- **WebSocket Server**: Real-time data transmission

## Frontend Implementation

The frontend is built with React and TypeScript, utilizing modern hooks and patterns for state management and component organization.

### Key Libraries

- **React**: UI rendering and component lifecycle
- **TypeScript**: Type safety and developer experience
- **Leaflet**: Map rendering and interaction
- **TanStack Query**: Data fetching and cache management
- **shadcn/ui**: UI component library
- **Tailwind CSS**: Utility-first styling
- **Zod**: Schema validation

### Component Structure

```
client/src/
├── assets/                 # Static assets
├── components/
│   ├── dashboard/          # Dashboard-specific components
│   │   ├── asset-card.tsx  # Asset display card
│   │   ├── header.tsx      # Dashboard header
│   │   ├── legend.tsx      # Map legend
│   │   ├── map-section.tsx # Map container
│   │   ├── sidebar.tsx     # Dashboard sidebar
│   │   └── ...
│   └── ui/                 # Reusable UI components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
│   ├── format-utils.ts     # Formatting helpers
│   ├── map-utils.ts        # Map-specific utilities
│   ├── shiprec-api.ts      # ShipRec API client
│   └── ...
├── pages/                  # Route-level components
├── types/                  # TypeScript type definitions
├── App.tsx                 # Main application component
└── main.tsx               # Application entry point
```

## Backend Implementation

The backend is an Express.js server providing API endpoints and WebSocket connectivity.

### Key Components

- **API Routes**: RESTful endpoints for data access
- **WebSocket Server**: Real-time updates channel
- **Storage Interface**: Data persistence layer
- **ShipRec API Integration**: External API client

### File Structure

```
server/
├── index.ts           # Server entry point
├── routes.ts          # API route definitions
├── storage.ts         # Storage implementation
└── vite.ts            # Development server setup
```

## Data Models

The application uses a shared schema definition to ensure type consistency between frontend and backend. The core data models include:

### Smart Labels

Smart labels represent tracked assets with historical position data:

```typescript
export type SmartLabelWithTrace = {
  id: string;
  asset: string;
  trace: TracePoint[];
  customer?: string;
  description?: string;
};
```

### Trace Points

Trace points represent individual GPS coordinates with timestamps:

```typescript
export type TracePoint = {
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number;
  battery?: number;
};
```

### Real-time Labels

Real-time labels represent currently active tracking devices:

```typescript
export type RealTimeLabel = {
  id: string;
  macId: string;
  name: string;
  position: TracePoint;
  updatedAt: Date;
};
```

### ShipRec Integration

ShipRec packages and locations are mapped to compatible internal types:

```typescript
export type ShipRecPackage = {
  tokenId: string;
  packageId: string;
  deviceId: string;
  status: string;
  origin: string;
  destination: string;
  estimatedDelivery: Date;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  tracking: {
    carrier: string;
    trackingNumber: string;
  };
};
```

## API Integration

### ShipRec API

The system integrates with the ShipRec tracking API to fetch real package tracking data. The integration includes:

1. **API Key Storage**: Secure storage of user's ShipRec API key
2. **Package Listing**: Fetching available packages from the user's account
3. **Tracking Details**: Retrieving detailed location history for specific packages
4. **Data Conversion**: Converting ShipRec data formats to internal types

Implementation details:

```typescript
// ShipRec API client endpoints
export async function fetchShipRecPackages(limit: number = 100, nextToken?: string): Promise<PackageListResponse>;
export async function trackShipRecPackage(tokenId: string, intervalHours: number = 1): Promise<TrackingResponse>;
export async function configureShipRecApiKey(apiKey: string): Promise<boolean>;
```

## WebSocket Implementation

Real-time updates are handled via WebSocket connections:

1. **Server Setup**: WebSocket server initialized on a distinct path
2. **Client Connection**: Frontend establishes WebSocket connection
3. **Real-time Updates**: Position updates transmitted as they occur
4. **Reconnection Logic**: Automatic reconnection on connection loss

WebSocket server implementation:

```typescript
// Server-side
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
wss.on('connection', (ws: WebSocket) => {
  // Handle new connections
  ws.on('message', (message) => {
    // Process incoming messages
  });
  // Send updates
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'update', data: updatedLabel }));
  }
});

// Client-side
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${protocol}//${window.location.host}/ws`;
const socket = new WebSocket(wsUrl);
```

## Map Rendering

The map is rendered using Leaflet and react-leaflet with the following key features:

### Map Components

- **Base Map**: OpenStreetMap tiles for geographic reference
- **Asset Markers**: Interactive markers showing asset positions
- **Route Lines**: Color-coded polylines showing asset movement paths
- **Popups**: Interactive tooltips showing asset details
- **Custom Icons**: Different icons based on asset type and status

### Marker Implementation

```tsx
<Marker
  position={[position.latitude, position.longitude]}
  icon={getMarkerIcon(status, label.asset)}
  eventHandlers={{
    click: () => handleMarkerClick(label),
  }}
>
  <Popup>{label.asset}</Popup>
</Marker>
```

### Route Rendering

```tsx
<Polyline
  positions={trace.map(point => [point.latitude, point.longitude])}
  pathOptions={{ 
    color: getRouteColor(label.id),
    weight: 3,
    opacity: 0.7,
    dashArray: '5, 5'
  }}
/>
```

## Time Simulation

The application implements two distinct time simulation models:

### Demo Mode Time Scale

In demo mode, time is simulated at an accelerated rate to show asset movements that would normally occur over hours or days:

- Base speed (1×): 1 real second = 1 simulated minute
- Available speeds: 1×, 5×, 15×, 30×, 60×
- Maximum acceleration: 60× (1 real second = 1 simulated hour)

### Real-time Mode Time Scale

In real-time mode, time moves at a 1:1 ratio by default but can be adjusted:

- Base speed (1×): 1 real second = 1 real second (true real-time)
- Available speeds: 0.5×, 1×, 2×, 4×, 8×
- Minimum deceleration: 0.5× (1 real second = 0.5 real seconds)
- Maximum acceleration: 8× (1 real second = 8 real seconds)

### Implementation

The time simulation controls the rate at which new positions are calculated and displayed:

```typescript
// Calculate position based on current time
function getPositionAtTime(trace: TracePoint[], currentTime: Date): TracePoint | null {
  // Find the trace points that bracket the current time
  const beforePoints = trace.filter(point => point.timestamp <= currentTime);
  const afterPoints = trace.filter(point => point.timestamp > currentTime);
  
  if (beforePoints.length === 0) return null;
  if (afterPoints.length === 0) return beforePoints[beforePoints.length - 1];
  
  // Get the closest points before and after
  const beforePoint = beforePoints[beforePoints.length - 1];
  const afterPoint = afterPoints[0];
  
  // Interpolate position between the two points
  const totalTimespan = afterPoint.timestamp.getTime() - beforePoint.timestamp.getTime();
  const elapsed = currentTime.getTime() - beforePoint.timestamp.getTime();
  const ratio = elapsed / totalTimespan;
  
  return {
    latitude: beforePoint.latitude + (afterPoint.latitude - beforePoint.latitude) * ratio,
    longitude: beforePoint.longitude + (afterPoint.longitude - beforePoint.longitude) * ratio,
    timestamp: currentTime,
    speed: beforePoint.speed || 0,
    battery: beforePoint.battery
  };
}
```

## Development Guidelines

### Road-Aware Routing

When implementing routes, ensure they strictly follow public roads and major streets:

- Use road-following algorithms for generating routes
- Avoid shortcuts through buildings, private property, or restricted areas
- Validate routes against known road networks
- Consider elevation and road type in route calculations

### Time Scaling Implementation

When implementing time scaling:

1. Use appropriate scales for different modes:
   - Demo: 1×, 5×, 15×, 30×, 60×
   - Real-time: 0.5×, 1×, 2×, 4×, 8×
   
2. Provide clear tooltips for each speed setting:
   - Demo: "1 second = 1 minute", "1 second = 1 hour", etc.
   - Real-time: "Half speed", "Real-time", "2× speed", etc.

3. Ensure UI elements reflect the current mode:
   - Hide demo-specific controls in real-time mode
   - Adjust the legend to show only relevant information
   - Provide mode-appropriate time displays

### WebSocket Best Practices

1. Always verify WebSocket.readyState before sending:
   ```typescript
   if (ws.readyState === WebSocket.OPEN) {
     ws.send(message);
   }
   ```

2. Implement reconnection logic on the client:
   ```typescript
   socket.onclose = () => {
     setTimeout(() => {
       // Reconnect logic
     }, 1000);
   };
   ```

3. Handle connection errors gracefully:
   ```typescript
   socket.onerror = (error) => {
     console.error('WebSocket error:', error);
     // Show user-friendly error message
   };
   ```

---

© 2025 InPlay Asset Tracking Systems. All rights reserved.