import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/dashboard/header';
import { MapSection } from '@/components/dashboard/map-section';
import { Sidebar } from '@/components/dashboard/sidebar';
import { RealTimeTracking } from '@/components/dashboard/real-time-tracking';
import { SmartLabelWithTrace, RealTimeLabel, ShipRecPackage } from '@shared/schema';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { convertShipRecPackageToLabel } from '@/lib/shiprec-api';

const IMPORTED_DEVICES_KEY = 'imported_devices';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  
  // Initial simulation time
  const initialTime = new Date("2025-04-01T10:00:00Z");
  
  // State for the simulation and display
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // Default 1x speed (1 minute per second)
  const [selectedLabel, setSelectedLabel] = useState<SmartLabelWithTrace | undefined>(undefined);
  const [selectedRealTimeLabel, setSelectedRealTimeLabel] = useState<RealTimeLabel | undefined>(undefined);
  const [displayMode, setDisplayMode] = useState<'demo' | 'realtime'>('realtime');
  const [realTimeLabels, setRealTimeLabels] = useState<RealTimeLabel[]>([]);
  
  // Load saved devices on mount
  useEffect(() => {
    const savedDevices = localStorage.getItem(IMPORTED_DEVICES_KEY);
    if (savedDevices) {
      try {
        const devices = JSON.parse(savedDevices);
        setRealTimeLabels(devices);
      } catch (error) {
        console.error('Error loading saved devices:', error);
      }
    }
  }, []);

  // Save devices when they change
  useEffect(() => {
    if (realTimeLabels.length > 0) {
      localStorage.setItem(IMPORTED_DEVICES_KEY, JSON.stringify(realTimeLabels));
    } else {
      localStorage.removeItem(IMPORTED_DEVICES_KEY);
    }
  }, [realTimeLabels]);
  
  // Function to restart the simulation
  const handleRestart = () => {
    setCurrentTime(initialTime);
    setIsPlaying(true);
  };
  
  // Fetch smart label data
  const { data: labels = [], isLoading: isLoadingLabels } = useQuery<SmartLabelWithTrace[]>({
    queryKey: ['/api/smart-labels'],
  });
  
  // Fetch real-time labels
  const { data: realTimeLabelsData = [], isLoading: isLoadingRealTime } = useQuery<RealTimeLabel[]>({
    queryKey: ['/api/real-time-labels'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });
  
  // Sync API data to local state
  useEffect(() => {
    if (realTimeLabelsData && realTimeLabelsData.length > 0) {
      console.log('Updating real-time label data:', realTimeLabelsData);
      setRealTimeLabels(prevLabels => {
        const mergedLabels = [...prevLabels];
        realTimeLabelsData.forEach(newLabel => {
          const existingIndex = mergedLabels.findIndex(l => l.id === newLabel.id);
          if (existingIndex >= 0) {
            // Preserve existing label states (like selection status)
            mergedLabels[existingIndex] = {
              ...newLabel,
              isSelected: mergedLabels[existingIndex].isSelected
            };
          } else {
            mergedLabels.push(newLabel);
          }
        });
        return mergedLabels;
      });
    }
  }, [realTimeLabelsData]);
  
  // Handle adding a new real-time label
  const handleRealTimeLabelAdded = (label: RealTimeLabel) => {
    console.log('Adding new real-time label:', label);
    // Update local state
    setRealTimeLabels(prevLabels => {
      const existingIndex = prevLabels.findIndex(l => l.id === label.id);
      if (existingIndex >= 0) {
        const updatedLabels = [...prevLabels];
        updatedLabels[existingIndex] = {
          ...label,
          isSelected: prevLabels[existingIndex].isSelected
        };
        return updatedLabels;
      } else {
        return [...prevLabels, { ...label, isSelected: false }];
      }
    });

    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/real-time-labels'] });
    
    // Switch to real-time mode
    setDisplayMode('realtime');
    
    // Show success message
    toast({
      title: 'Device Added',
      description: `Successfully added device ${label.name || label.macId}`,
    });
  };
  
  // WebSocket connection setup
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      try {
        // Build WebSocket URL
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = window.location.hostname;
        const wsPort = process.env.NODE_ENV === 'development' ? ':5000' : (window.location.port ? `:${window.location.port}` : '');
        const wsUrl = `${wsProtocol}//${wsHost}${wsPort}/ws`;
        
        console.log('Preparing to connect WebSocket:', {
          protocol: wsProtocol,
          host: wsHost,
          port: wsPort,
          fullUrl: wsUrl,
          env: process.env.NODE_ENV,
          windowLocation: window.location
        });

        const socket = new WebSocket(wsUrl);
        ws = socket;
        wsRef.current = socket;

        socket.onopen = () => {
          console.log('WebSocket connection established, URL:', socket.url);
          toast({
            title: 'Connected',
            description: 'Real-time updates activated',
            variant: 'default',
          });
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received WebSocket message:', {
              type: data.type,
              dataLength: data.data?.length,
              rawData: data
            });
            
            if (data.type === 'labelUpdate') {
              console.log('Processing label update:', data.label);
              setRealTimeLabels(prevLabels => {
                const existingLabelIndex = prevLabels.findIndex(l => l.id === data.label.id);
                const updatedLabels = [...prevLabels];
                
                if (existingLabelIndex >= 0) {
                  console.log('Updating existing label:', {
                    oldLabel: prevLabels[existingLabelIndex],
                    newLabel: data.label
                  });
                  updatedLabels[existingLabelIndex] = {
                    ...data.label,
                    isSelected: prevLabels[existingLabelIndex].isSelected
                  };
                } else {
                  console.log('Adding new label:', data.label);
                  updatedLabels.push({
                    ...data.label,
                    isSelected: false
                  });
                }
                
                console.log('Label state after update:', updatedLabels);
                return updatedLabels;
              });

              // Update selected label if the updated one is currently selected
              if (selectedRealTimeLabel?.id === data.label.id) {
                console.log('Updating selected label:', data.label);
                setSelectedRealTimeLabel(data.label);
              }

              // If receiving real-time updates in demo mode, switch to real-time mode
              if (displayMode === 'demo') {
                console.log('Switching from demo mode to real-time mode');
                setDisplayMode('realtime');
                toast({
                  title: 'Mode Switch',
                  description: 'Received real-time update, switched to real-time mode',
                });
              }
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', {
            error,
            socketUrl: socket.url,
            readyState: socket.readyState,
            wsUrl: wsUrl
          });
          toast({
            title: 'Connection Error',
            description: 'Connection issue, retrying in 5 seconds',
            variant: 'destructive',
          });
        };

        socket.onclose = (event) => {
          console.log('WebSocket connection closed:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          console.log('Retrying in 5 seconds...');
          wsRef.current = null;
          reconnectTimeout = setTimeout(connectWebSocket, 5000);
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', {
          error,
          errorName: error instanceof Error ? error.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      console.log('Cleaning up WebSocket connection');
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [toast, selectedRealTimeLabel, displayMode]);
  
  // Simulate time progression with different scales for demo and real-time modes
  useEffect(() => {
    if (!isPlaying) return;
    
    // Different time scale based on mode
    // Demo mode: 1 minute of simulation per 1 second real time at 1x speed (baseMinutesPerSecond = 1)
    // Real-time mode: 1 second of simulation per 1 second real time at 1x speed (baseMinutesPerSecond = 1/60)
    const baseMinutesPerSecond = displayMode === 'demo' ? 1 : 1/60;
    const adjustedMinutes = baseMinutesPerSecond * speedMultiplier;
    
    // Use a shorter interval to make the movement smoother
    // Update 10 times per second, with each update advancing by a smaller increment
    const updatesPerSecond = 10;
    const minutesPerUpdate = adjustedMinutes / updatesPerSecond;
    
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        // Calculate how many milliseconds to add for each update
        const msToAdd = minutesPerUpdate * 60000;
        return new Date(prev.getTime() + msToAdd);
      });
    }, 1000 / updatesPerSecond); // Run several times per second for smoother animation
    
    return () => clearInterval(interval);
  }, [isPlaying, speedMultiplier, displayMode]);
  
  // Handle tab change in sidebar
  const handleDisplayModeChange = (mode: 'demo' | 'realtime') => {
    setDisplayMode(mode);
    
    // When switching to real-time mode, set appropriate speed
    if (mode === 'realtime') {
      // Default to 1x for real-time (1 second = 1 second)
      setSpeedMultiplier(1);
    } else {
      // Default to 1x for demo (1 second = 1 minute)
      setSpeedMultiplier(1);
    }
    
    // Reset selections when switching modes
    if (mode === 'demo') {
      setSelectedRealTimeLabel(undefined);
    } else {
      setSelectedLabel(undefined);
    }
  };
  
  // Handle label click - select the label to center the map on it
  const handleLabelClick = (label: SmartLabelWithTrace) => {
    setSelectedLabel(label);
    setSelectedRealTimeLabel(undefined); // Deselect real-time label when selecting a smart label
    setDisplayMode('demo'); // Switch to demo mode
  };
  
  // Handle real-time label click
  const handleRealTimeLabelClick = (label: RealTimeLabel) => {
    setSelectedRealTimeLabel(label);
    setSelectedLabel(undefined); // Deselect smart label when selecting a real-time label
    setDisplayMode('realtime'); // Switch to real-time mode
  };
  
  // Handle deleting a real-time label
  const handleRealTimeLabelDelete = (labelId: string) => {
    console.log('Deleting real-time label:', labelId);
    // Remove label from local state
    setRealTimeLabels(prevLabels => prevLabels.filter(l => l.id !== labelId));
    
    // If the deleted label was selected, clear selection
    if (selectedRealTimeLabel?.id === labelId) {
      setSelectedRealTimeLabel(undefined);
    }
    
    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/real-time-labels'] });
    
    // Show success message
    toast({
      title: 'Device Removed',
      description: 'Device has been removed from dashboard',
    });
  };
  
  // Handle viewing a ShipRec package on map
  const handleViewShipRecOnMap = (pkg: ShipRecPackage) => {
    console.log('Viewing package on map:', pkg);
    if (pkg.location || pkg.currentLocation) {
      // Convert ShipRec package to RealTimeLabel format
      const label = convertShipRecPackageToLabel(pkg);
      console.log('Converted real-time label:', label);
      
      // Update real-time label list
      handleRealTimeLabelAdded(label);
      
      // Select the newly added label
      setSelectedRealTimeLabel(label);
      
      // Ensure we're in real-time mode
      if (displayMode !== 'realtime') {
        setDisplayMode('realtime');
      }
      
      // Show notification
      toast({
        title: "Locating",
        description: `Displaying ${label.name} on map`,
      });
    } else {
      toast({
        title: "Unable to Locate",
        description: "This package has no location information",
        variant: "destructive"
      });
    }
  };
  
  // Show loading state if any data is still loading
  const isLoading = isLoadingLabels || isLoadingRealTime;
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading asset tracking data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen">
      <Header currentTime={currentTime} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          labels={labels}
          currentTime={currentTime}
          onLabelClick={handleLabelClick}
          realTimeLabels={realTimeLabels}
          onRealTimeLabelClick={handleRealTimeLabelClick}
          selectedRealTimeLabel={selectedRealTimeLabel}
          onTabChange={handleDisplayModeChange}
          onRealTimeLabelDelete={handleRealTimeLabelDelete}
        >
          <RealTimeTracking
            onLabelAdded={handleRealTimeLabelAdded}
            onViewOnMap={handleViewShipRecOnMap}
          />
        </Sidebar>
        
        <MapSection 
          labels={labels}
          currentTime={currentTime}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          onLabelClick={handleLabelClick}
          selectedLabel={selectedLabel}
          speedMultiplier={speedMultiplier}
          setSpeedMultiplier={setSpeedMultiplier}
          onRestart={handleRestart}
          realTimeLabels={realTimeLabels}
          selectedRealTimeLabel={selectedRealTimeLabel}
          onRealTimeLabelClick={handleRealTimeLabelClick}
          displayMode={displayMode}
        />
      </div>
    </div>
  );
}
