import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  fetchShipRecPackages, 
  convertShipRecPackageToLabel, 
  checkShipRecAuthStatus, 
  addShipRecPackage, 
  getDeviceMetadata, 
  configureShipRecAuth,
  type DeviceMetadata 
} from '@/lib/shiprec-api';
import { ShipRecPackage } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CustomBadge } from '@/components/ui/custom-badge';
import { ShipRecConfig } from './shiprec-config';
import { Loader2, Package, LocateFixed, Plus, ChevronDown, ChevronRight, Battery, Thermometer, MapPin, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ShipRecPackageListProps {
  onSelectPackage?: (pkg: ShipRecPackage) => void;
  onImportPackage?: (pkg: ShipRecPackage) => void;
}

const SHIPREC_CONFIG_KEY = 'shiprec_auth_config';

export function ShipRecPackageList({ onSelectPackage, onImportPackage }: ShipRecPackageListProps) {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const [allPackages, setAllPackages] = useState<ShipRecPackage[]>([]);
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [newPackageData, setNewPackageData] = useState({
    deviceId: '',
    name: '',
    email: '',
    address: ''
  });
  const { toast } = useToast();
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
  const [deviceMetadata, setDeviceMetadata] = useState<Record<string, DeviceMetadata>>({});
  const [loadingMetadata, setLoadingMetadata] = useState<Record<string, boolean>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Handle refresh
  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent duplicate refresh
    
    try {
      setIsRefreshing(true);
      const response = await fetchShipRecPackages();
      
      // Update package list
      setAllPackages(response.packages);
      
      // If a package is selected, ensure it remains selected
      if (selectedPackageId) {
        const updatedSelected = response.packages.find(p => p.tokenId === selectedPackageId);
        if (updatedSelected) {
          onSelectPackage?.(updatedSelected);
        }
      }
      
      // Update device information for expanded packages
      expandedPackages.forEach(tokenId => {
        const pkg = response.packages.find(p => p.tokenId === tokenId);
        if (pkg) {
          fetchDeviceMetadata(pkg);
        }
      });
    } catch (error) {
      console.error('Error refreshing packages:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh package list',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (!isConfigured) return;
    
    const interval = setInterval(() => {
      console.log('Refreshing package list...');
      handleRefresh();
    }, 60000); // Refresh every 1 minute
    
    return () => clearInterval(interval);
  }, [isConfigured]);

  // Check API key configuration and try automatic authentication
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        setIsAuthenticating(true);
        const status = await checkShipRecAuthStatus();
        
        // If configured, set state directly
        if (status) {
          setIsConfigured(true);
          return;
        }
        
        // If not configured but has local storage config, try automatic authentication
        const savedConfig = localStorage.getItem(SHIPREC_CONFIG_KEY);
        if (savedConfig) {
          try {
            const config = JSON.parse(savedConfig);
            const success = await configureShipRecAuth(config);
            
            if (success) {
              setIsConfigured(true);
              toast({
                title: 'Authentication Success',
                description: 'Successfully authenticated with saved configuration.',
                variant: 'default'
              });
              return;
            }
          } catch (error) {
            console.error('Error parsing stored config:', error);
            localStorage.removeItem(SHIPREC_CONFIG_KEY);
          }
        }
        
        setIsConfigured(false);
        
      } catch (error) {
        console.error('Error checking auth status:', error);
        const savedConfig = localStorage.getItem(SHIPREC_CONFIG_KEY);
        if (savedConfig) {
          try {
            const config = JSON.parse(savedConfig);
            const success = await configureShipRecAuth(config);
            
            if (success) {
              setIsConfigured(true);
              toast({
                title: 'Authentication Success',
                description: 'Successfully authenticated with saved configuration.',
                variant: 'default'
              });
              return;
            }
          } catch (retryError) {
            console.error('Error during auto authentication retry:', retryError);
            localStorage.removeItem(SHIPREC_CONFIG_KEY);
          }
        }
        setIsConfigured(false);
        toast({
          title: 'Authentication Failed',
          description: 'Unable to verify authentication status',
          variant: 'destructive'
        });
      } finally {
        setIsAuthenticating(false);
      }
    };
    
    checkApiKey();
  }, [toast]);

  // Fetch packages
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['/api/shiprec/packages', nextToken],
    queryFn: async () => {
      console.log('Fetching packages...');
      const result = await fetchShipRecPackages(100, nextToken);
      console.log('Fetch result:', result);
      return result;
    },
    enabled: isConfigured === true,
    retry: 1
  });

  // Update packages state
  useEffect(() => {
    if (data?.packages) {
      console.log('Received packages:', data.packages);
      try {
        if (nextToken) {
          setAllPackages(prev => [...prev, ...data.packages]);
        } else {
          setAllPackages(data.packages);
        }
      } catch (err) {
        console.error('Error processing packages:', err);
        toast({
          title: 'Error',
          description: 'Failed to process package data',
          variant: 'destructive'
        });
      }
    }
  }, [data?.packages, nextToken, toast]);

  // Handle API configuration completed
  const handleConfigured = () => {
    setIsConfigured(true);
    // Trigger a fetch
    refetch();
  };

  // Handle load more
  const handleLoadMore = () => {
    if (data?.nextToken) {
      setNextToken(data.nextToken);
    }
  };

  // Handle importing a package as a real-time label
  const handleImport = (pkg: ShipRecPackage) => {
    onImportPackage?.(pkg);
  };

  // Handle adding a new package
  const handleAddPackage = async () => {
    if (!newPackageData.deviceId) {
      toast({
        title: 'Error',
        description: 'Device ID is required',
        variant: 'destructive'
      });
      return;
    }

    setIsAddingPackage(true);
    try {
      await addShipRecPackage(newPackageData);
      toast({
        title: 'Success',
        description: 'Package added successfully',
      });
      // Reset form and refresh package list
      setNewPackageData({
        deviceId: '',
        name: '',
        email: '',
        address: ''
      });
      setIsAddDialogOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add package. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsAddingPackage(false);
    }
  };

  // Get device metadata
  const fetchDeviceMetadata = async (pkg: ShipRecPackage) => {
    if (loadingMetadata[pkg.tokenId]) return; // Prevent duplicate requests
    
    try {
      setLoadingMetadata(prev => ({
        ...prev,
        [pkg.tokenId]: true
      }));
      
      const metadata = await getDeviceMetadata(pkg.tokenId);
      setDeviceMetadata(prev => ({
        ...prev,
        [pkg.tokenId]: metadata
      }));
    } catch (error) {
      console.error('Error fetching device metadata:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch device information',
        variant: 'destructive',
      });
      
      // Remove failed requests from metadata cache to allow retry
      setDeviceMetadata(prev => {
        const updated = { ...prev };
        delete updated[pkg.tokenId];
        return updated;
      });
    } finally {
      setLoadingMetadata(prev => ({
        ...prev,
        [pkg.tokenId]: false
      }));
    }
  };

  // Handle package expand/collapse
  const handlePackageExpand = (tokenId: string) => {
    setExpandedPackages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId);
      } else {
        newSet.add(tokenId);
      }
      return newSet;
    });
    
    // Fetch device information when package is expanded
    const pkg = allPackages.find(p => p.tokenId === tokenId);
    //if (pkg && !deviceMetadata[tokenId]) {
    //  void fetchDeviceMetadata(pkg);
    //}
  };

  // Handle package selection
  const handlePackageSelect = (pkg: ShipRecPackage) => {
    setSelectedPackageId(pkg.tokenId);
    onSelectPackage?.(pkg);
  };

  // If authenticating, show loading state
  if (isAuthenticating) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>InPlay Package Tracking</CardTitle>
          <CardDescription>Verifying authentication status...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Verifying authentication status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If not configured, directly display configuration component
  if (isConfigured === false) {
    return <ShipRecConfig onConfigured={handleConfigured} />;
  }

  // Loading state
  if (isLoading && allPackages.length === 0) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>InPlay Packages</CardTitle>
          <CardDescription>Loading packages from InPlay API</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading packages...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>Error Loading Packages</CardTitle>
          <CardDescription>
            There was a problem fetching packages from InPlay
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-6">
            {error instanceof Error ? error.message : 'Unable to load packages. Please check your API key or try again.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
            <Button onClick={() => setIsConfigured(false)}>
              Reconfigure
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>InPlay Packages</CardTitle>
          <CardDescription>
            {allPackages.length} packages available
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Package
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Package</DialogTitle>
                <DialogDescription>
                  Enter the device ID from the QR code on your tracking device and optional details.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="deviceId">Device ID (required)</Label>
                  <Input
                    id="deviceId"
                    placeholder="Enter device ID from QR code"
                    value={newPackageData.deviceId}
                    onChange={(e) => setNewPackageData(prev => ({ ...prev, deviceId: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Recipient Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter recipient name"
                    value={newPackageData.name}
                    onChange={(e) => setNewPackageData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Recipient Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter recipient email"
                    value={newPackageData.email}
                    onChange={(e) => setNewPackageData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Delivery Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter delivery address"
                    value={newPackageData.address}
                    onChange={(e) => setNewPackageData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAddPackage}
                  disabled={isAddingPackage || !newPackageData.deviceId}
                >
                  {isAddingPackage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Package'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              'Refresh'
            )}
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setIsConfigured(false)}
          >
            Reconfigure
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {allPackages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No packages found</p>
              <p className="text-sm mt-2">
                Add packages in your InPlay dashboard to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allPackages.map((pkg) => {
                const isExpanded = expandedPackages.has(pkg.tokenId);
                const metadata = deviceMetadata[pkg.tokenId];
                const isLoadingMetadata = loadingMetadata[pkg.tokenId];
                
                return (
                  <div key={pkg.tokenId} className="p-4 border rounded-lg">
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => handlePackageExpand(pkg.tokenId)}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <h3 className="font-medium">
                          {pkg.name || pkg.deviceId || pkg.packageId || `Package ${pkg.tokenId.substring(0, 8)}`}
                        </h3>
                      </div>
                      <CustomBadge variant={pkg.deleted ? 'destructive' : (pkg.location || pkg.currentLocation) ? 'success' : 'default'}>
                        {pkg.deleted ? 'DELETED' : (pkg.location || pkg.currentLocation) ? 'ACTIVE' : 'INACTIVE'}
                      </CustomBadge>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pl-6 space-y-3">
                        <p className="text-sm">
                          <span className="font-medium">Name:</span> {pkg.name || 'N/A'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Package ID:</span> {pkg.packageId || 'N/A'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Device ID:</span> {pkg.deviceId || 'N/A'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Address:</span> {pkg.address || 'N/A'}
                        </p>
                        {pkg.notes && (
                          <p className="text-sm">
                            <span className="font-medium">Notes:</span> {pkg.notes}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {pkg.location ? 
                                `${pkg.location.lat}, ${pkg.location.long}` : 
                                (pkg.currentLocation ? 
                                  `${pkg.currentLocation.lat}, ${pkg.currentLocation.lng}` : 
                                  'N/A'
                                )
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {pkg.location ? 
                                new Date(pkg.location.timestamp * 1000).toLocaleString() :
                                (pkg.currentLocation ?
                                  new Date(pkg.currentLocation.timestamp).toLocaleString() :
                                  pkg.created ? new Date(pkg.created).toLocaleString() : 'N/A'
                                )
                              }
                            </span>
                          </div>
                        </div>

                        <Separator className="my-3" />
                        
                        <div className="flex gap-2">
                          {pkg.location && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePackageSelect(pkg);
                              }}
                            >
                              <LocateFixed className="h-4 w-4" />
                              View on Map
                            </Button>
                          )}
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImport(pkg);
                            }}
                          >
                            Import to Dashboard
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        {data?.nextToken && (
          <Button 
            variant="outline" 
            onClick={handleLoadMore}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Packages'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}