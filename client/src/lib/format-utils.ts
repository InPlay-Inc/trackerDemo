// Format a date to a more readable time (e.g., "10:15 AM")
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Format a date to a simple date string (e.g., "Apr 1, 2025")
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Format a date to a full date/time string (e.g., "Apr 1, 2025, 10:15 AM")
export function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Format coordinates to fixed decimal places
export function formatCoordinate(coord: number, decimals = 4): string {
  return coord.toFixed(decimals);
}

// Format distance in kilometers
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${(distanceKm * 1000).toFixed(0)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

// Format speed in km/h
export function formatSpeed(speedKmh: number): string {
  return `${speedKmh.toFixed(1)} km/h`;
}

// Format duration in minutes
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}
