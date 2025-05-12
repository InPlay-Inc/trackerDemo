import { RealTimeLabel, ShipRecLocation, TracePoint, ShipRecPackage } from '@shared/schema';
import { apiRequest } from './queryClient';

interface PackageListResponse {
  packages: ShipRecPackage[];
  nextToken?: string;
}

interface TrackingResponse {
  packageInfo: ShipRecPackage;
  locations: ShipRecLocation[];
}

interface AuthConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface AuthStatus {
  configured: boolean;
}

interface NewPackageRequest {
  deviceId: string;
  name?: string;
  email?: string;
  address?: string;
}

interface NewPackageResponse {
  token: string;
}

export interface DeviceMetadata {
  mac_id: string;
  device_type: string;
  firmware_version: string;
  battery_level: number;
  last_seen: string;
  status: string;
}

const API_BASE_URL = 'https://track.inplay.io/api';

/**
 * Check if ShipRec auth is configured
 * @returns True if auth is configured, false otherwise
 */
export async function checkShipRecAuthStatus(): Promise<boolean> {
  try {
    const response = await apiRequest<AuthStatus>({
      url: '/api/shiprec/config/status',
      method: 'GET'
    });
    return response.configured;
  } catch (error) {
    console.error('Error checking ShipRec auth status:', error);
    return false;
  }
}

/**
 * Configure ShipRec authentication
 * @param config The auth configuration to store
 * @returns True if auth was configured successfully
 */
export async function configureShipRecAuth(config: AuthConfig): Promise<boolean> {
  try {
    await apiRequest<{message: string}>({
      url: '/api/shiprec/config/auth',
      method: 'POST',
      body: config
    });
    return true;
  } catch (error) {
    console.error('Error configuring ShipRec auth:', error);
    return false;
  }
}

/**
 * Fetch packages from ShipRec API
 * @param limit Maximum number of packages to return (default: 100, max: 1000)
 * @param nextToken Optional token for paginated results
 * @returns Array of packages and next page token if available
 */
export async function fetchShipRecPackages(limit: number = 100, nextToken?: string): Promise<PackageListResponse> {
  try {
    let url = `/api/shiprec/packages?limit=${Math.min(Math.max(1, limit), 1000)}`;
    if (nextToken) {
      url += `&nextToken=${encodeURIComponent(nextToken)}`;
    }
    
    console.log('Fetching packages from:', url);
    const response = await apiRequest<ShipRecPackage[]>({
      url,
      method: 'GET'
    });
    console.log('Raw API response:', response);

    // Convert response to expected format
    const packages = response.map(pkg => {
      // Ensure status is string type
      const status = pkg.status?.toString() || 'UNKNOWN';
      
      // Convert location to currentLocation for compatibility with existing code
      const currentLocation = pkg.location ? {
        lat: pkg.location.lat,
        lng: pkg.location.long,
        timestamp: new Date(pkg.location.timestamp).toISOString()
      } : undefined;
      
      return {
        ...pkg,
        status,
        currentLocation
      };
    });

    console.log('Processed packages:', packages);
    return {
      packages,
      nextToken: undefined // nextToken will be obtained from response headers by server
    };
  } catch (error) {
    console.error('Error fetching ShipRec packages:', error);
    throw error;
  }
}

/**
 * Track a specific package using its token ID
 * @param tokenId The token ID of the package to track
 * @param intervalHours Granularity for older location reports (default: 1, min: 1, max: 168)
 * @returns Location data for the package
 */
export async function trackShipRecPackage(tokenId: string, intervalHours: number = 1): Promise<TrackingResponse> {
  try {
    const url = `/api/shiprec/packages/track/${tokenId}?interval_hours=${intervalHours}`;
    
    return await apiRequest<TrackingResponse>({
      url,
      method: 'GET'
    });
  } catch (error) {
    console.error('Error tracking ShipRec package:', error);
    throw error;
  }
}

/**
 * Convert ShipRec package to RealTimeLabel format for compatibility with existing UI
 * @param shipRecPackage The ShipRec package to convert
 * @returns A RealTimeLabel compatible object
 */
export function convertShipRecPackageToLabel(shipRecPackage: ShipRecPackage): RealTimeLabel {
  console.log('Converting ShipRec package to label:', {
    input: shipRecPackage,
    hasLocation: !!shipRecPackage.location,
    hasCurrentLocation: !!shipRecPackage.currentLocation
  });

  // Ensure location information is correctly converted
  const currentLocation = shipRecPackage.location ? {
    lat: shipRecPackage.location.lat,
    lng: shipRecPackage.location.long,
    timestamp: new Date(shipRecPackage.location.timestamp)
  } : undefined;

  if (!currentLocation) {
    throw new Error('Package has no location information');
  }

  // Create tracking point
  const position: TracePoint = {
    lat: currentLocation.lat,
    lng: currentLocation.lng,
    timestamp: currentLocation.timestamp
  };

  // Generate name
  const name = shipRecPackage.name || 
    `Package ${shipRecPackage.tokenId.slice(-6)}`;

  // Create and return RealTimeLabel object
  return {
    id: `shiprec-${shipRecPackage.tokenId}`,
    macId: shipRecPackage.deviceId || shipRecPackage.tokenId,
    name,
    position,
    isActive: shipRecPackage.status !== 'DELIVERED',  // Set active status based on state
    isSelected: false,  // Add required isSelected field
    meta: {
      ...shipRecPackage.meta,
      packageId: shipRecPackage.packageId,
      tokenId: shipRecPackage.tokenId,
      status: shipRecPackage.status
    },
    updatedAt: new Date(currentLocation.timestamp),  // Use location timestamp
    createdAt: new Date(shipRecPackage.created)
  };
}

/**
 * Add a new package to track
 * @param data Package information including device ID and optional details
 * @returns The token ID for the new package
 */
export const addShipRecPackage = async (packageData: NewPackageRequest): Promise<string> => {
  try {
    console.log('Adding package with data:', packageData);
    
    // 验证输入数据
    if (!packageData.deviceId) {
      throw new Error('Device ID is required');
    }
    
    // 尝试添加包裹
    const response = await apiRequest<NewPackageResponse>({
      url: '/api/shiprec/packages/new',
      method: 'POST',
      body: packageData

    });

    console.log('Add package response:', response);

    // 验证响应
    if (!response || typeof response !== 'object') {
      console.error('Invalid response format:', response);
      throw new Error('Server returned invalid response format');
    }

    if (!response.token || typeof response.token !== 'string') {
      console.error('Missing token in response:', response);
      throw new Error('Server response missing valid token');
    }

    return response.token;
  } catch (error) {
    // 记录详细的错误信息
    console.error('Error adding ShipRec package:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : String(error),
      requestData: packageData
    });

    // 根据错误类型返回用户友好的错误消息
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new Error('认证失败，请检查您的凭据并重试。');
      } else if (error.message.includes('404')) {
        throw new Error('找不到 API 端点，请联系支持人员。');
      } else if (error.message.includes('500')) {
        throw new Error('服务器错误，请稍后重试。');
      } else if (error.message.includes('text/html')) {
        throw new Error('服务器返回了无效的响应格式，请联系支持人员。');
      }
      throw error;
    }
    
    throw new Error('添加包裹失败，请检查设备 ID 并重试。');
  }
};

/**
 * Get device metadata for a specific package
 * @param tokenId The token ID of the package
 * @returns Device metadata including battery and temperature status
 */
export async function getDeviceMetadata(tokenId: string): Promise<DeviceMetadata> {
  try {
    const url = `https://track.shiprec.io/api/packages/device?token=${encodeURIComponent(tokenId)}`;
    console.log('Fetching device metadata from:', url);
    
    const response = await fetch(url, {
      method: 'POST',
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Raw response data:', data);
    
    return data as DeviceMetadata;
  } catch (error) {
    console.error('Error fetching device metadata:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Delete ShipRec authentication configuration
 * @returns True if auth configuration was deleted successfully
 */
export async function deleteShipRecAuth(): Promise<boolean> {
  try {
    await apiRequest<{message: string}>({
      url: '/api/shiprec/config/auth',
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error('Error deleting ShipRec auth:', error);
    return false;
  }
}

export async function fetchInPlayPackages(apiKey: string): Promise<ShipRecPackage[]> {
  const response = await fetch(`${API_BASE_URL}/packages`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch InPlay packages');
  }

  return response.json();
}

export async function trackInPlayPackage(packageId: string, apiKey: string): Promise<ShipRecPackage> {
  const response = await fetch(`${API_BASE_URL}/packages/${packageId}/track`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to track InPlay package');
  }

  return response.json();
}