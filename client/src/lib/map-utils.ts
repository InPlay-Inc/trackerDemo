import { TracePoint } from '@shared/schema';

// Function to get position at a specific time by interpolating between trace points
export function getPositionAtTime(trace: TracePoint[], currentTime: Date): TracePoint | null {
  // If empty trace, return null
  if (!trace || trace.length === 0) {
    return null;
  }
  
  // If before first point, return first point
  if (currentTime < new Date(trace[0].timestamp)) {
    return trace[0];
  }
  
  // If after last point, return last point
  if (currentTime >= new Date(trace[trace.length - 1].timestamp)) {
    return trace[trace.length - 1];
  }
  
  // Find the two points to interpolate between
  for (let i = 0; i < trace.length - 1; i++) {
    const pointA = trace[i];
    const pointB = trace[i + 1];
    
    const pointATime = new Date(pointA.timestamp);
    const pointBTime = new Date(pointB.timestamp);
    
    if (currentTime >= pointATime && currentTime <= pointBTime) {
      // Calculate the interpolation ratio
      const timeDiff = (pointBTime.getTime() - pointATime.getTime()) / 1000; // in seconds
      const elapsed = (currentTime.getTime() - pointATime.getTime()) / 1000;
      const ratio = elapsed / timeDiff;
      
      // Interpolate position
      const lat = pointA.lat + ratio * (pointB.lat - pointA.lat);
      const lng = pointA.lng + ratio * (pointB.lng - pointA.lng);
      
      return {
        lat,
        lng,
        timestamp: currentTime
      };
    }
  }
  
  // Fallback - should not reach here
  return trace[trace.length - 1];
}

// Calculate distance between two points (in kilometers)
export function calculateDistance(pointA: TracePoint, pointB: TracePoint): number {
  const R = 6371; // Earth's radius in km
  const dLat = (pointB.lat - pointA.lat) * Math.PI / 180;
  const dLon = (pointB.lng - pointA.lng) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(pointA.lat * Math.PI / 180) * Math.cos(pointB.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

// Calculate total distance of a trace
export function calculateTotalDistance(trace: TracePoint[]): number {
  let totalDistance = 0;
  
  for (let i = 0; i < trace.length - 1; i++) {
    totalDistance += calculateDistance(trace[i], trace[i+1]);
  }
  
  return totalDistance;
}

// Calculate average speed in km/h
export function calculateAverageSpeed(trace: TracePoint[]): number {
  if (!trace || trace.length < 2) {
    return 0;
  }
  
  const totalDistance = calculateTotalDistance(trace); // in km
  const startTime = new Date(trace[0].timestamp);
  const endTime = new Date(trace[trace.length - 1].timestamp);
  
  // Duration in hours
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  
  if (duration === 0) {
    return 0;
  }
  
  // No need for arbitrary speed multiplier - use the actual calculated values
  // Return realistic speeds based on time and distance
  return (totalDistance / duration);
}
