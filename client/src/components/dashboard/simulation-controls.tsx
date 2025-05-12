import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Info, RefreshCw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SimulationControlsProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  speedMultiplier: number;
  setSpeedMultiplier: (multiplier: number) => void;
  onRestart?: () => void;
  displayMode?: 'demo' | 'realtime';
}

export function SimulationControls({
  isPlaying,
  setIsPlaying,
  speedMultiplier,
  setSpeedMultiplier,
  onRestart = () => {},
  displayMode = 'demo'
}: SimulationControlsProps) {
  // Convert numeric multiplier to display string based on mode
  const getSpeedText = (multiplier: number) => {
    if (displayMode === 'demo') {
      // In demo mode, we show the actual multiplier (1x means 1 min per second)
      if (multiplier === 0.1) return '0.1× Speed';
      if (multiplier === 0.25) return '0.25× Speed';
      if (multiplier === 0.5) return '0.5× Speed';
      if (multiplier === 1) return '1× Speed';
      if (multiplier === 1.5) return '1.5× Speed';
      if (multiplier === 2) return '2× Speed';
      if (multiplier === 3) return '3× Speed';
    } else {
      // In real-time mode, these are relative to real time (1x means 1 sec per second)
      if (multiplier === 0.5) return '0.5× Speed';
      if (multiplier === 1) return '1× Speed';
      if (multiplier === 2) return '2× Speed';
      if (multiplier === 4) return '4× Speed';
      if (multiplier === 8) return '8× Speed';
    }
    return '1× Speed';
  };
  
  // Convert display string to numeric multiplier based on mode
  const getSpeedMultiplier = (text: string) => {
    if (displayMode === 'demo') {
      // For demo mode
      if (text === '0.1× Speed') return 0.1;
      if (text === '0.25× Speed') return 0.25;
      if (text === '0.5× Speed') return 0.5;
      if (text === '1× Speed') return 1;
      if (text === '1.5× Speed') return 1.5;
      if (text === '2× Speed') return 2;
      if (text === '3× Speed') return 3;
    } else {
      // For real-time mode
      if (text === '0.5× Speed') return 0.5;
      if (text === '1× Speed') return 1;
      if (text === '2× Speed') return 2;
      if (text === '4× Speed') return 4;
      if (text === '8× Speed') return 8;
    }
    return displayMode === 'demo' ? 1 : 1;
  };
  
  const [speed, setSpeed] = useState(getSpeedText(speedMultiplier));
  
  // Update speed text when display mode or multiplier changes
  useEffect(() => {
    setSpeed(getSpeedText(speedMultiplier));
  }, [displayMode, speedMultiplier]);
  
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md flex items-center space-x-4 z-[1000]">
      <button 
        className="bg-primary hover:bg-blue-600 text-white h-8 w-8 rounded-full flex items-center justify-center"
        onClick={() => setIsPlaying(!isPlaying)}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      
      <div className="h-5 border-r border-gray-300"></div>
      
      <div className="flex items-center">
        <select 
          className="text-sm bg-transparent border-0 focus:ring-0 text-gray-600"
          value={speed}
          onChange={(e) => {
            const newSpeed = e.target.value;
            setSpeed(newSpeed);
            setSpeedMultiplier(getSpeedMultiplier(newSpeed));
          }}
        >
          {displayMode === 'demo' ? (
            <>
              <option>0.1× Speed</option>
              <option>0.25× Speed</option>
              <option>0.5× Speed</option>
              <option>1× Speed</option>
              <option>1.5× Speed</option>
              <option>2× Speed</option>
              <option>3× Speed</option>
            </>
          ) : (
            <>
              <option>0.5× Speed</option>
              <option>1× Speed</option>
              <option>2× Speed</option>
              <option>4× Speed</option>
              <option>8× Speed</option>
            </>
          )}
        </select>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="ml-1 text-gray-400 cursor-help">
                <Info className="h-3.5 w-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {displayMode === 'demo' 
                  ? `At ${speedMultiplier}× speed, each real second represents ${speedMultiplier} minutes of journey time` 
                  : `At ${speedMultiplier}× speed, time passes at ${speedMultiplier} times the normal rate`}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="h-5 border-r border-gray-300"></div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 h-8 w-8 rounded-full flex items-center justify-center"
              onClick={onRestart}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Replay Simulation</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
