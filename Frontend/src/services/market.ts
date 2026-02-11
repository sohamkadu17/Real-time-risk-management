import api from './api';

export interface MarketStatus {
  exchange: 'NSE' | 'BSE';
  isOpen: boolean;
  currentTime: string;
  nextSessionStart?: string;
  nextSessionEnd?: string;
  sessionType: 'pre-market' | 'normal' | 'post-market' | 'closed';
  timezone: string;
  debug?: {
    current_hour: number;
    current_minute: number;
    current_time_float: number;
    day_of_week: string;
    is_weekend: boolean;
  };
}

export interface MarketSession {
  name: string;
  start: string;
  end: string;
  isActive: boolean;
}

// Market hours for NSE and BSE (IST)
const MARKET_SESSIONS = {
  NSE: [
    { name: 'Pre Market', start: '09:00', end: '09:15' },
    { name: 'Normal Trading', start: '09:15', end: '15:30' },
    { name: 'Post Market', start: '15:40', end: '16:00' }
  ],
  BSE: [
    { name: 'Pre Market', start: '09:00', end: '09:15' },
    { name: 'Normal Trading', start: '09:15', end: '15:30' },
    { name: 'Post Market', start: '15:40', end: '16:00' }
  ]
};

/**
 * Get real-time market status for Indian exchanges
 */
export async function getMarketStatus(exchange: 'NSE' | 'BSE' = 'NSE'): Promise<MarketStatus> {
  try {
    // Try to fetch from backend first
    const response = await api.get(`/market/status/${exchange}`);
    return response.data;
  } catch (error) {
    // Fallback to client-side calculation
    return calculateMarketStatus(exchange);
  }
}

/**
 * Calculate market status based on current time (fallback)
 */
function calculateMarketStatus(exchange: 'NSE' | 'BSE'): MarketStatus {
  const now = new Date();
  const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  const currentTime = istTime.toLocaleTimeString('en-IN', { 
    hour12: false, 
    timeZone: 'Asia/Kolkata' 
  });
  
  // Check if it's a weekend
  const dayOfWeek = istTime.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
  
  if (isWeekend) {
    return {
      exchange,
      isOpen: false,
      currentTime,
      sessionType: 'closed',
      timezone: 'IST',
      nextSessionStart: getNextTradingDayStart()
    };
  }

  const sessions = MARKET_SESSIONS[exchange];
  const currentHour = istTime.getHours();
  const currentMinute = istTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  for (const session of sessions) {
    const [startHour, startMinute] = session.start.split(':').map(Number);
    const [endHour, endMinute] = session.end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes) {
      return {
        exchange,
        isOpen: true,
        currentTime,
        sessionType: session.name === 'Normal Trading' ? 'normal' : 
                    session.name === 'Pre Market' ? 'pre-market' : 'post-market',
        timezone: 'IST',
        nextSessionEnd: `${session.end}:00 IST`
      };
    }
  }

  // Market is closed, find next session
  const nextSession = findNextSession(sessions, currentTimeMinutes);
  return {
    exchange,
    isOpen: false,
    currentTime,
    sessionType: 'closed',
    timezone: 'IST',
    nextSessionStart: nextSession?.start ? `${nextSession.start}:00 IST` : getNextTradingDayStart()
  };
}

function findNextSession(sessions: any[], currentTimeMinutes: number) {
  return sessions.find(session => {
    const [startHour, startMinute] = session.start.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    return startMinutes > currentTimeMinutes;
  });
}

function getNextTradingDayStart(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Skip weekends
  while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
    tomorrow.setDate(tomorrow.getDate() + 1);
  }
  
  return `Monday 09:00:00 IST`;
}

/**
 * Get market sessions with their current status
 */
export function getMarketSessions(exchange: 'NSE' | 'BSE'): MarketSession[] {
  const now = new Date();
  const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  const currentHour = istTime.getHours();
  const currentMinute = istTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  return MARKET_SESSIONS[exchange].map(session => {
    const [startHour, startMinute] = session.start.split(':').map(Number);
    const [endHour, endMinute] = session.end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return {
      name: session.name,
      start: `${session.start} IST`,
      end: `${session.end} IST`,
      isActive: currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes
    };
  });
}