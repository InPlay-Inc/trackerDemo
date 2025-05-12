import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the current device is a mobile device
 * @returns {boolean} True if the device is mobile, false otherwise
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to check if the device is mobile based on screen width
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on initial render
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
}