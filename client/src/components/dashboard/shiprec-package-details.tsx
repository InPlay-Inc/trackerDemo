import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShipRecPackage, ShipRecLocation } from '@shared/schema';
import { trackShipRecPackage } from '@/lib/shiprec-api';
import { formatDateTime, formatDistance } from '@/lib/format-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CustomBadge } from '@/components/ui/custom-badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Calendar, Package, ArrowLeftRight, ArrowRight } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface ShipRecPackageDetailsProps {
  package: ShipRecPackage;
  onClose?: () => void;
  onViewOnMap?: (pkg: ShipRecPackage) => void;
}

export function ShipRecPackageDetails({ package: pkg, onClose, onViewOnMap }: ShipRecPackageDetailsProps) {
  const [intervalHours, setIntervalHours] = useState(1);
  
  // Fetch tracking data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/shiprec/packages/track', pkg.tokenId, intervalHours],
    queryFn: () => trackShipRecPackage(pkg.tokenId, intervalHours),
    refetchOnWindowFocus: false,
  });
  
  // Calculate total distance
  const calculateTotalDistance = (locations: ShipRecLocation[]): number => {
    if (!locations || locations.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i-1];
      const curr = locations[i];
      
      // Calculate distance using Haversine formula
      const R = 6371; // Earth radius in km
      const dLat = (curr.lat - prev.lat) * Math.PI / 180;
      const dLon = (curr.lng - prev.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      totalDistance += distance;
    }
    
    return totalDistance;
  };
  
  // Handle interval change
  const handleIntervalChange = (interval: number) => {
    setIntervalHours(interval);
  };
  
  return (
    <Card className="w-full h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>
              {pkg.name || pkg.packageId || `Package ${pkg.tokenId.substring(0, 8)}`}
            </CardTitle>
            <CardDescription>
              Tracking details and location history
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading tracking data...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="text-center py-8">
            <p className="mb-4">Unable to load tracking data. Please try again.</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="locations">Location History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              {/* Package Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Package Information</h3>
                  <div className="mt-2 space-y-2">
                    <div>
                      <Label>InPlay Package ID</Label>
                      <div className="mt-1">{pkg.packageId}</div>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">
                        <CustomBadge variant={pkg.status === 'delivered' ? 'success' : pkg.status === 'in_transit' ? 'default' : 'outline'}>
                          {pkg.status ? pkg.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                        </CustomBadge>
                      </div>
                    </div>
                    <div>
                      <Label>Device ID</Label>
                      <div className="mt-1">{pkg.deviceId}</div>
                    </div>
                    <div>
                      <Label>InPlay Token</Label>
                      <div className="mt-1">{pkg.tokenId}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Shipping Details</h3>
                  <div className="mt-2 space-y-2">
                    <div>
                      <Label>Shipping Address</Label>
                      <div className="mt-1">{pkg.address}</div>
                    </div>
                    <div>
                      <Label>Contact Email</Label>
                      <div className="mt-1">{pkg.email}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Additional Information</h3>
                  <div className="mt-2 space-y-2">
                    <div>
                      <Label>Notes</Label>
                      <div className="mt-1">{pkg.notes || 'No notes available'}</div>
                    </div>
                    <div>
                      <Label>Created Date</Label>
                      <div className="mt-1">{new Date(pkg.created).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Tracking Statistics */}
              {data?.locations && data.locations.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center">
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Journey Statistics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div className="bg-muted/40 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Distance Traveled</p>
                      <p className="text-lg font-medium">{formatDistance(calculateTotalDistance(data.locations))}</p>
                    </div>
                    <div className="bg-muted/40 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-lg font-medium">
                        {data.locations.length > 1 ? (
                          (() => {
                            const startTime = new Date(data.locations[data.locations.length - 1].timestamp);
                            const endTime = new Date(data.locations[0].timestamp);
                            const durationHours = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
                            return `${durationHours} hours`;
                          })()
                        ) : (
                          'N/A'
                        )}
                      </p>
                    </div>
                    <div className="bg-muted/40 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Location Updates</p>
                      <p className="text-lg font-medium">{data.locations.length}</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="locations">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-sm font-medium">Location History</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Interval:</span>
                  <select 
                    className="text-xs border rounded p-1" 
                    value={intervalHours}
                    onChange={(e) => handleIntervalChange(Number(e.target.value))}
                  >
                    <option value="1">1 hour</option>
                    <option value="3">3 hours</option>
                    <option value="6">6 hours</option>
                    <option value="12">12 hours</option>
                    <option value="24">24 hours</option>
                  </select>
                </div>
              </div>
              <ScrollArea className="h-[400px] pr-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : data?.locations && data.locations.length > 0 ? (
                  <div className="space-y-2">
                    {data.locations.map((location, index) => (
                      <div 
                        key={index} 
                        className={`relative pl-8 py-2 border-l-2 ${index === 0 ? 'border-primary' : 'border-muted'}`}
                      >
                        <div className={`absolute left-[-8px] top-3 w-4 h-4 rounded-full border-2 
                          ${index === 0 ? 'bg-primary border-primary' : 'bg-background border-muted'}`}
                        />
                        <p className="text-sm font-medium flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDateTime(new Date(location.timestamp))}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                        </p>
                        {index < data.locations.length - 1 && (
                          <div className="text-xs mt-1 flex items-center">
                            <ArrowRight className="h-3 w-3 mr-1" />
                            {formatDistance(calculateTotalDistance([location, data.locations[index + 1]]))} to next point
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-muted-foreground">
                    No location history available
                  </p>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}