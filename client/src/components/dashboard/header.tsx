import { Settings, User } from 'lucide-react';
import InPlayLogo from '../../assets/InPlay_logo.png';

interface HeaderProps {
  currentTime: Date;
}

export function Header({ currentTime }: HeaderProps) {
  // Format the date for display
  const formattedTime = currentTime.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  });

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img src={InPlayLogo} alt="InPlay Logo" className="h-10" />
          <h1 className="text-xl font-semibold">Smart Label Asset Tracking</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="font-medium">{formattedTime}</span>
          </div>
          <button className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition">
            <Settings className="h-5 w-5 text-gray-500" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white">
              <span className="font-medium">JD</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
