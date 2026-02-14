import { useEffect, useState } from 'react';

export function useISTClock() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isMarketHours, setIsMarketHours] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      
      // Format time
      const timeString = istTime.toLocaleTimeString('en-IN', { 
        hour12: false, 
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      // Check market hours (9:15 AM to 3:30 PM IST, Monday to Friday)
      const hour = istTime.getHours();
      const minute = istTime.getMinutes();
      const dayOfWeek = istTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
      const currentTimeMinutes = hour * 60 + minute;
      const marketStartMinutes = 9 * 60 + 15; // 9:15 AM
      const marketEndMinutes = 15 * 60 + 30; // 3:30 PM
      
      const marketOpen = isWeekday && 
                        currentTimeMinutes >= marketStartMinutes && 
                        currentTimeMinutes <= marketEndMinutes;
      
      setCurrentTime(timeString);
      setIsMarketHours(marketOpen);
    };

    updateTime(); // Initial call
    const interval = setInterval(updateTime, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  return { currentTime, isMarketHours };
}