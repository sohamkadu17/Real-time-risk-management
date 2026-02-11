# Quick Start Guide - Config API Testing

## 🚀 Step 1: Start the Backend Server

Open a **new terminal** window and run:

```bash
cd Backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see output like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
✓ Real-Time Risk Management System ready
✓ API docs: http://localhost:8000/api/v1/docs
```

---

## 🧪 Step 2: Test the Config API

### Option A: Using the Interactive Swagger UI (Easiest)

1. Open your browser
2. Go to: **http://localhost:8000/docs**
3. Look for the **Configuration** section
4. Expand and test each endpoint:
   - ✅ GET /api/v1/config
   - ✅ PUT /api/v1/config
   - ✅ GET /api/v1/config/validate

### Option B: Using Python Test Script

In a **different terminal** (while backend is running):

```bash
cd Backend
python test_config_api.py
```

### Option C: Using cURL Commands

First, you need to get a JWT token. Create a test user:

```bash
# Register a new user
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "username": "testuser",
    "password": "testpass123",
    "role": "viewer"
  }'
```

Then login to get token:

```bash
# Login and get JWT token
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

Response will include `access_token`. Copy it and replace `YOUR_TOKEN` below.

Now test config endpoints:

```bash
# Get config
curl -X GET "http://localhost:8000/api/v1/config" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Validate config  
curl -X GET "http://localhost:8000/api/v1/config/validate" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Update config (requires admin role)
curl -X PUT "http://localhost:8000/api/v1/config" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "risk_thresholds": {
      "high_threshold": 0.85,
      "medium_threshold": 0.55,
      "low_threshold": 0.35
    }
  }'
```

---

## 📊 Expected Responses

### GET /api/v1/config - Success (200 OK)

```json
{
  "id": 1,
  "config": {
    "risk_thresholds": {
      "high_threshold": 0.8,
      "medium_threshold": 0.5,
      "low_threshold": 0.3
    },
    "streaming": {
      "buffer_size": 1000,
      "monitoring_enabled": true,
      "event_interval_seconds": 3.0
    },
    "alerts": {
      "auto_acknowledge_duration_minutes": 60,
      "alert_retention_days": 30,
      "max_alerts_per_user": 500
    },
    "debug_mode": false
  },
  "created_at": "2026-02-08T12:00:00",
  "updated_at": "2026-02-08T12:00:00",
  "created_by": "system",
  "updated_by": "system"
}
```

### PUT /api/v1/config - Success (200 OK)

Same response as GET, but with updated values.

### GET /api/v1/config/validate - Valid Response

```json
{
  "valid": true,
  "message": "Configuration is valid",
  "config": { ... }
}
```

### GET /api/v1/config/validate - Invalid Response

```json
{
  "valid": false,
  "errors": [
    "Risk thresholds must be ascending: low(0.3) < medium(0.5) < high(0.8)",
    "Stream buffer size must be 100-10000, got 50"
  ]
}
```

---

## ✅ Verification Checklist

After starting backend, verify everything works:

- [ ] Backend starts without errors
- [ ] Can access http://localhost:8000/docs
- [ ] Can register user via POST /auth/register
- [ ] Can login via POST /auth/login (get token)
- [ ] Can fetch config via GET /config with token
- [ ] Can validate config via GET /config/validate
- [ ] Can update config via PUT /config (shows it persists)
- [ ] All responses are valid JSON

---

## 🔧 Troubleshooting

### Backend won't start: "ModuleNotFoundError"

Install missing dependencies:
```bash
cd Backend
pip install -r requirements.txt
```

### "connection refused" error

Make sure backend is actually running on port 8000. Check the terminal where you started it.

### "Authentication Error" or "401 Unauthorized"

You need to login first:
1. POST to /auth/register with credentials
2. POST to /auth/login to get token
3. Use that token in the Authorization header: `Bearer <token>`

### "403 Forbidden" on PUT /config

The user account doesn't have admin role. Try:
1. Register with role="admin" 
2. Or login with an admin account

### "422 Validation Error" on PUT /config

Check that your request data matches the schema:
- risk_thresholds must be 0.0-1.0
- buffer_size must be 100-10000
- All fields must be in correct format

---

## 🎯 What Just Happened?

You successfully implemented:

✅ **GET /api/v1/config** - Fetch dynamic configuration
✅ **PUT /api/v1/config** - Update configuration (admin-only)
✅ **GET /api/v1/config/validate** - Validate configuration
✅ **Database persistence** - Configuration saved to PostgreSQL
✅ **Audit trail** - All changes tracked with user/timestamp
✅ **Input validation** - Pydantic schemas validate all data
✅ **Authorization** - Admin-only for sensitive operations

---

## 📚 Next Steps

After verifying the Config API works:

1. **Option 1**: Move to **Step 2 - Frontend Charts** for visual improvements
2. **Option 2**: Continue with **Step 3 - UI Polish** for styling
3. **Option 3**: Move to **Step 4 - Explainability** for AI features

Let me know when the backend is running and tests pass! 🚀
