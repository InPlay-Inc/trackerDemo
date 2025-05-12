import { SmartLabelWithTrace, RealTimeLabel } from '@shared/schema';
import { AssetCard } from './asset-card';
import { getPositionAtTime, calculateTotalDistance, calculateDistance, calculateAverageSpeed } from '@/lib/map-utils';
import { formatDistance, formatSpeed, formatDuration } from '@/lib/format-utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTime, formatDateTime } from '@/lib/format-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  Clock,
  Map,
  Package,
  Star,
  Bell,
  HelpCircle,
  Settings,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';

interface SidebarProps {
  labels: SmartLabelWithTrace[];
  currentTime: Date;
  onLabelClick: (label: SmartLabelWithTrace) => void;
  children?: React.ReactNode;
  realTimeLabels?: RealTimeLabel[];
  onRealTimeLabelClick?: (label: RealTimeLabel) => void;
  selectedRealTimeLabel?: RealTimeLabel;
  onTabChange?: (tab: 'demo' | 'realtime') => void;
  onRealTimeLabelDelete?: (labelId: string) => void;
}

export function Sidebar({ 
  labels, 
  currentTime, 
  onLabelClick, 
  children, 
  realTimeLabels = [], 
  onRealTimeLabelClick, 
  selectedRealTimeLabel,
  onTabChange,
  onRealTimeLabelDelete
}: SidebarProps) {
  // State for dialogs
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedLabelForDialog, setSelectedLabelForDialog] = useState<SmartLabelWithTrace | null>(null);
  const [activeTab, setActiveTab] = useState<string>("realtime");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();
  
  // On mobile, start with sidebar collapsed
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  }, [isMobile]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (onTabChange && (value === 'demo' || value === 'realtime')) {
      onTabChange(value);
    }
  };
  
  // Handlers for History and Details buttons
  const handleHistoryClick = (label: SmartLabelWithTrace, event: React.MouseEvent) => {
    setSelectedLabelForDialog(label);
    setHistoryDialogOpen(true);
  };
  
  const handleDetailsClick = (label: SmartLabelWithTrace, event: React.MouseEvent) => {
    setSelectedLabelForDialog(label);
    setDetailsDialogOpen(true);
  };
  
  // Get total number of labels
  const totalLabels = labels.length;
  const totalRealTimeLabels = realTimeLabels.length;

  // If sidebar is collapsed, show mini sidebar instead
  if (isCollapsed) {
    return (
      <div className="relative z-50 flex-shrink-0 w-14 bg-gray-900 text-white flex flex-col items-center py-4">
        {/* Collapse button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute -right-3 top-6 rounded-full bg-primary text-white shadow-md h-6 w-6 z-50"
          onClick={() => setIsCollapsed(false)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <TooltipProvider delayDuration={300} disableHoverableContent={true}>
          {/* Navigation icons */}
          <div className="flex flex-col items-center space-y-6 pt-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                  onClick={() => {
                    setIsCollapsed(false);
                    setActiveTab("demo");
                  }}
                >
                  <LayoutDashboard className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="z-[100]">Dashboard</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                  onClick={() => setIsCollapsed(false)}
                >
                  <Map className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="z-[100]">Map View</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                  onClick={() => {
                    setIsCollapsed(false);
                    setActiveTab("realtime");
                  }}
                >
                  <Package className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="z-[100]">Assets</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                  onClick={() => {
                    if (labels.length > 0) {
                      // Open history dialog for the first label
                      setSelectedLabelForDialog(labels[0]);
                      setHistoryDialogOpen(true);
                    }
                  }}
                >
                  <Clock className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="z-[100]">History</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                  onClick={() => {
                    // Show favorites (will expand to a full feature in future)
                    setIsCollapsed(false);
                    toast({
                      title: "Favorites",
                      description: "Favorites feature coming soon!",
                      variant: "default",
                    });
                  }}
                >
                  <Star className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="z-[100]">Favorites</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                  onClick={() => {
                    setIsCollapsed(false);
                    toast({
                      title: "Notifications",
                      description: "No new notifications at this time.",
                      variant: "default",
                    });
                  }}
                >
                  <Bell className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="z-[100]">Notifications</TooltipContent>
            </Tooltip>
          </div>
          
          {/* Bottom icons */}
          <div className="mt-auto flex flex-col items-center space-y-6 pb-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                  onClick={() => {
                    setIsCollapsed(false);
                    toast({
                      title: "Help Center",
                      description: "Help documentation will be available soon.",
                      variant: "default",
                    });
                  }}
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="z-[100]">Help</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                  onClick={() => {
                    setIsCollapsed(false);
                    toast({
                      title: "Settings",
                      description: "Settings panel will be available in a future update.",
                      variant: "default",
                    });
                  }}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="z-[100]">Settings</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    );
  }

  // Full sidebar view
  return (
    <div className="relative h-full flex-shrink-0 w-[30%] p-4 bg-gray-50 overflow-y-auto border-l border-gray-200 z-50">
      {/* Collapse button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute -left-3 top-6 rounded-full bg-primary text-white shadow-md h-6 w-6"
        onClick={() => setIsCollapsed(true)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex justify-between items-center mb-4 mt-2">
        <h2 className="text-lg font-semibold">Asset Tracking</h2>
        <span className="text-sm bg-gray-200 px-2 py-1 rounded-md">
          {activeTab === "demo" 
            ? `${totalLabels} Demo Asset${totalLabels !== 1 ? 's' : ''}`
            : `${totalRealTimeLabels} Real-time Asset${totalRealTimeLabels !== 1 ? 's' : ''}`
          }
        </span>
      </div>
      
      <Tabs defaultValue="realtime" value={activeTab} onValueChange={handleTabChange} className="w-full mb-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="demo">Demo Mode</TabsTrigger>
          <TabsTrigger value="realtime">Real-time Tracking</TabsTrigger>
        </TabsList>
        
        <TabsContent value="demo" className="space-y-4 mt-2">
          {/* Demo Asset Cards */}
          {labels.map(label => {
            const position = getPositionAtTime(label.trace, currentTime);
            if (position) {
              // Calculate status and duration
              const lastTracePoint = label.trace[label.trace.length - 1];
              const lastTraceTime = new Date(lastTracePoint.timestamp);
              let status: 'Moving' | 'Idle' | 'Delivered';
              
              // Check for delivered status (if package is at final position and time)
              if (currentTime >= lastTraceTime && label.targetReached) {
                status = 'Delivered';
              } else if (currentTime < lastTraceTime) {
                status = 'Moving';
              } else {
                status = 'Idle';
              }
              
              // Calculate duration (time from first to last trace point)
              const firstTracePoint = label.trace[0];
              const firstTraceTime = new Date(firstTracePoint.timestamp);
              const durationMs = lastTraceTime.getTime() - firstTraceTime.getTime();
              const durationMins = Math.floor(durationMs / (1000 * 60));
              
              return (
                <AssetCard
                  key={label.id}
                  label={label}
                  position={position}
                  status={status}
                  currentTime={currentTime}
                  duration={`${durationMins} mins`}
                  onClick={() => onLabelClick(label)}
                  onHistoryClick={handleHistoryClick}
                  onDetailsClick={handleDetailsClick}
                />
              );
            }
            return null;
          })}
        </TabsContent>
        
        <TabsContent value="realtime" className="space-y-4 mt-2">
          {/* Real-time tracking section (from children prop) */}
          {children}
          
          {/* Real-time labels */}
          {realTimeLabels.map(label => (
            <div 
              key={label.id}
              className={`p-4 border rounded-lg mb-3 cursor-pointer transition-colors ${
                selectedRealTimeLabel?.id === label.id ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div 
                  className="flex-1"
                  onClick={() => onRealTimeLabelClick?.(label)}
                >
                  <h3 className="font-medium flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${label.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    {label.name || `Asset ${label.macId.slice(0, 6)}`}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">ID: {label.macId}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-muted-foreground">
                    <p>Lat: {label.position.lat.toFixed(5)}</p>
                    <p>Lng: {label.position.lng.toFixed(5)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    label.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {label.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-muted-foreground mt-2">
                    {label.lastUpdated 
                      ? `Updated: ${formatTime(new Date(label.lastUpdated))}` 
                      : 'Not yet updated'}
                  </span>
                  {onRealTimeLabelDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRealTimeLabelDelete(label.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {realTimeLabels.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No real-time assets available</p>
              <p className="text-sm mt-2">Add a device using the form above</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      
      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-md z-[2000]">
          <DialogHeader>
            <DialogTitle>Movement History</DialogTitle>
            <DialogDescription>
              {selectedLabelForDialog && `Tracking history for ${selectedLabelForDialog.asset}`}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[350px] rounded-md border p-4">
            {selectedLabelForDialog && (
              <div className="space-y-4">
                {selectedLabelForDialog.trace.map((point, index) => (
                  <div key={index} className="border-b border-gray-100 pb-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Checkpoint {index + 1}</span>
                      <span className="text-xs text-gray-500">{formatDateTime(new Date(point.timestamp))}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Position: {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                    </div>
                    {index > 0 && (
                      <div className="text-xs text-gray-600 mt-1">
                        Distance from previous: {formatDistance(
                          calculateDistance(
                            selectedLabelForDialog.trace[index - 1],
                            point
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-md z-[2000]">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
            <DialogDescription>
              {selectedLabelForDialog && `Detailed information for ${selectedLabelForDialog.asset}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLabelForDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500 mb-1">Asset ID</div>
                  <div className="text-sm font-medium">{selectedLabelForDialog.id}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500 mb-1">Asset Name</div>
                  <div className="text-sm font-medium">{selectedLabelForDialog.asset}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500 mb-1">Start Time</div>
                  <div className="text-sm font-medium">
                    {formatDateTime(new Date(selectedLabelForDialog.trace[0].timestamp))}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500 mb-1">End Time</div>
                  <div className="text-sm font-medium">
                    {formatDateTime(
                      new Date(selectedLabelForDialog.trace[selectedLabelForDialog.trace.length - 1].timestamp)
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500 mb-1">Total Distance</div>
                  <div className="text-sm font-medium">
                    {formatDistance(calculateTotalDistance(selectedLabelForDialog.trace))}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500 mb-1">Average Speed</div>
                  <div className="text-sm font-medium">
                    {formatSpeed(calculateAverageSpeed(selectedLabelForDialog.trace))}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500 mb-1">Duration</div>
                  <div className="text-sm font-medium">
                    {formatDuration(
                      Math.floor(
                        (new Date(selectedLabelForDialog.trace[selectedLabelForDialog.trace.length - 1].timestamp).getTime() - 
                         new Date(selectedLabelForDialog.trace[0].timestamp).getTime()) / (1000 * 60)
                      )
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <div className="text-sm font-medium">
                    {selectedLabelForDialog.targetReached ? "Delivered" : "In Transit"}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500 mb-1">Description</div>
                <div className="text-sm">
                  {selectedLabelForDialog.description || "No description available"}
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500 mb-1">Route Details</div>
                <div className="text-sm">
                  <span className="font-medium">Start:</span> {
                    `${selectedLabelForDialog.trace[0].lat.toFixed(4)}, ${selectedLabelForDialog.trace[0].lng.toFixed(4)}`
                  }
                  <br />
                  <span className="font-medium">End:</span> {
                    `${selectedLabelForDialog.trace[selectedLabelForDialog.trace.length - 1].lat.toFixed(4)}, ${selectedLabelForDialog.trace[selectedLabelForDialog.trace.length - 1].lng.toFixed(4)}`
                  }
                  <br />
                  <span className="font-medium">Checkpoints:</span> {selectedLabelForDialog.trace.length}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
