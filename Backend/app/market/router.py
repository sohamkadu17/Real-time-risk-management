from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import Literal
import pytz

router = APIRouter()

@router.get("/status/{exchange}")
async def get_market_status(exchange: Literal["NSE", "BSE"]):
    """
    Get real-time market status for NSE or BSE
    """
    try:
        ist_tz = pytz.timezone('Asia/Kolkata')
        now = datetime.now(ist_tz)
        
        # Market sessions (IST)
        sessions = {
            "pre_market": {"start": 9, "end": 9.25},  # 9:00 - 9:15
            "normal": {"start": 9.25, "end": 15.5},   # 9:15 - 15:30
            "post_market": {"start": 15.67, "end": 16}  # 15:40 - 16:00
        }
        
        current_time_float = now.hour + now.minute / 60
        
        # Check if weekend
        is_weekend = now.weekday() >= 5  # Saturday = 5, Sunday = 6
        
        if is_weekend:
            return {
                "exchange": exchange,
                "isOpen": False,
                "currentTime": now.strftime("%H:%M:%S IST"),
                "sessionType": "closed",
                "timezone": "IST",
                "nextSessionStart": "Monday 09:00:00 IST"
            }
        
        # Check current session
        session_type = "closed"
        is_open = False
        next_session_end = None
        next_session_start = None
        
        for session_name, times in sessions.items():
            if times["start"] <= current_time_float < times["end"]:
                session_type = session_name.replace("_", "-")
                is_open = True
                end_hour = int(times["end"])
                end_minute = int((times["end"] % 1) * 60)
                next_session_end = f"{end_hour:02d}:{end_minute:02d}:00 IST"
                break
        
        # If market is closed, find next session
        if not is_open:
            for session_name, times in sessions.items():
                if current_time_float < times["start"]:
                    start_hour = int(times["start"])
                    start_minute = int((times["start"] % 1) * 60)
                    next_session_start = f"{start_hour:02d}:{start_minute:02d}:00 IST"
                    break
            
            if not next_session_start:
                # After all sessions today, next is tomorrow 9 AM
                tomorrow = now + timedelta(days=1)
                while tomorrow.weekday() >= 5:  # Skip weekends
                    tomorrow += timedelta(days=1)
                next_session_start = "09:00:00 IST"
        
        # Add debug info
        debug_info = {
            "current_hour": now.hour,
            "current_minute": now.minute,
            "current_time_float": current_time_float,
            "day_of_week": now.strftime("%A"),
            "is_weekend": is_weekend
        }
        
        return {
            "exchange": exchange,
            "isOpen": is_open,
            "currentTime": now.strftime("%H:%M:%S IST"),
            "sessionType": session_type,
            "timezone": "IST",
            "nextSessionStart": next_session_start,
            "nextSessionEnd": next_session_end,
            "debug": debug_info
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get market status: {str(e)}")

@router.get("/sessions/{exchange}")
async def get_market_sessions(exchange: Literal["NSE", "BSE"]):
    """
    Get market sessions with their current status
    """
    try:
        ist_tz = pytz.timezone('Asia/Kolkata')
        now = datetime.now(ist_tz)
        current_time_float = now.hour + now.minute / 60
        
        sessions_info = [
            {"name": "Pre Market", "start": "09:00 IST", "end": "09:15 IST", "start_float": 9, "end_float": 9.25},
            {"name": "Normal Trading", "start": "09:15 IST", "end": "15:30 IST", "start_float": 9.25, "end_float": 15.5},
            {"name": "Post Market", "start": "15:40 IST", "end": "16:00 IST", "start_float": 15.67, "end_float": 16}
        ]
        
        result = []
        for session in sessions_info:
            is_active = session["start_float"] <= current_time_float < session["end_float"]
            result.append({
                "name": session["name"],
                "start": session["start"],
                "end": session["end"],
                "isActive": is_active and now.weekday() < 5  # Not weekend
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get market sessions: {str(e)}")