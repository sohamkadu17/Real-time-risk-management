# Configuration Management API - Documentation

## Overview

The Configuration Management API enables dynamic runtime configuration of the Real-Time Risk Management System without requiring server restarts. All configuration changes are persisted to the database.

## Endpoints

### 1. GET `/api/v1/config` - Get Current Configuration

**Authentication**: Required (all users)

**Description**: Retrieve the current system configuration

**Response Example**:
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
  "created_at": "2024-02-08T10:00:00Z",
  "updated_at": "2024-02-08T10:00:00Z",
  "created_by": "system",
  "updated_by": "system"
}
```

**Status Codes**:
- `200 OK` - Configuration retrieved successfully
- `401 Unauthorized` - Missing or invalid authentication token
- `500 Internal Server Error` - Database error

---

### 2. PUT `/api/v1/config` - Update Configuration

**Authentication**: Required (Admin only)

**Description**: Update system configuration. All fields are optional - only provided fields will be updated.

**Request Body Example**:
```json
{
  "risk_thresholds": {
    "high_threshold": 0.85,
    "medium_threshold": 0.55,
    "low_threshold": 0.35
  },
  "streaming": {
    "buffer_size": 1500,
    "monitoring_enabled": true,
    "event_interval_seconds": 2.5
  },
  "alerts": {
    "auto_acknowledge_duration_minutes": 45,
    "alert_retention_days": 45,
    "max_alerts_per_user": 1000
  },
  "debug_mode": true
}
```

**Response**: Same structure as GET /config with updated values

**Status Codes**:
- `200 OK` - Configuration updated successfully
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User doesn't have admin role
- `422 Unprocessable Entity` - Invalid request data
- `500 Internal Server Error` - Database error

**Validation**:
- `risk_thresholds.high_threshold`: 0.0 - 1.0
- `risk_thresholds.medium_threshold`: 0.0 - 1.0
- `risk_thresholds.low_threshold`: 0.0 - 1.0
- `streaming.buffer_size`: 100 - 10000
- `streaming.event_interval_seconds`: 0.1 - 60.0
- `alerts.auto_acknowledge_duration_minutes`: 1 - 1440
- `alerts.alert_retention_days`: 1 - 365
- `alerts.max_alerts_per_user`: 10 - 10000

---

### 3. GET `/api/v1/config/validate` - Validate Configuration

**Authentication**: Required (all users)

**Description**: Check if current configuration is valid and sensible

**Response Example (Valid)**:
```json
{
  "valid": true,
  "message": "Configuration is valid",
  "config": { ... }
}
```

**Response Example (Invalid)**:
```json
{
  "valid": false,
  "errors": [
    "Risk thresholds must be ascending: low(0.3) < medium(0.5) < high(0.8)",
    "Stream buffer size must be 100-10000, got 50"
  ]
}
```

**Validation Checks**:
- Risk thresholds must be in ascending order: `low < medium < high`
- All thresholds must be between 0.0 and 1.0
- Streaming buffer size must be 100-10000
- Alert retention must be 1-365 days

---

## Usage Examples

### cURL Examples

**Get current config**:
```bash
curl -X GET "http://localhost:8000/api/v1/config" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Update config (admin only)**:
```bash
curl -X PUT "http://localhost:8000/api/v1/config" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "risk_thresholds": {
      "high_threshold": 0.85,
      "medium_threshold": 0.55,
      "low_threshold": 0.35
    }
  }'
```

**Validate config**:
```bash
curl -X GET "http://localhost:8000/api/v1/config/validate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Python Examples

```python
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"
TOKEN = "your_jwt_token_here"

headers = {"Authorization": f"Bearer {TOKEN}"}

# Get config
response = requests.get(f"{BASE_URL}/config", headers=headers)
current_config = response.json()
print(json.dumps(current_config, indent=2))

# Update config (requires admin token)
admin_headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
update_data = {
    "risk_thresholds": {
        "high_threshold": 0.85,
        "medium_threshold": 0.55,
        "low_threshold": 0.35
    }
}

response = requests.put(
    f"{BASE_URL}/config",
    json=update_data,
    headers=admin_headers
)
print(response.json())

# Validate config
response = requests.get(f"{BASE_URL}/config/validate", headers=headers)
validation = response.json()
if validation["valid"]:
    print("✓ Config is valid!")
else:
    print("✗ Config has errors:")
    for error in validation["errors"]:
        print(f"  - {error}")
```

---

## Configuration Parameters

### Risk Thresholds
Defines when risks are classified as low, medium, or high:

- **high_threshold** (default: 0.8): Risk score ≥ this value = HIGH risk
- **medium_threshold** (default: 0.5): Risk score ≥ this value = MEDIUM risk  
- **low_threshold** (default: 0.3): Risk score ≥ this value = LOW risk
- **Rule**: All thresholds must be in ascending order

### Streaming Configuration
Controls the real-time data processing pipeline:

- **buffer_size** (default: 1000): How many events to buffer in memory
- **monitoring_enabled** (default: true): Enable Pathway performance monitoring
- **event_interval_seconds** (default: 3.0): Time between simulated events (in production, this varies)

### Alert Configuration
Controls alert system behavior:

- **auto_acknowledge_duration_minutes** (default: 60): Auto-close alerts after N minutes
- **alert_retention_days** (default: 30): Keep alerts in database for N days
- **max_alerts_per_user** (default: 500): Maximum alerts per user before pruning

### Debug Mode
- **debug_mode** (default: false): Enable verbose logging and debugging

---

## Audit Trail

All configuration changes are tracked with:
- Timestamp of change
- Admin user who made the change
- Before/after values (snapshot)

Query audit logs:
```bash
curl "http://localhost:8000/api/v1/audit/logs?entity_type=configuration" \
  -H "Authorization: Bearer TOKEN"
```

---

## Error Handling

### Common Errors

**401 Unauthorized**:
```json
{
  "detail": "Not authenticated"
}
```
Solution: Include valid JWT token in Authorization header

**403 Forbidden**:
```json
{
  "detail": "Only admin users can update configuration"
}
```
Solution: Use admin account to update config

**422 Unprocessable Entity**:
```json
{
  "detail": [
    {
      "loc": ["body", "risk_thresholds", "high_threshold"],
      "msg": "ensure this value is less than or equal to 1.0",
      "type": "value_error.number.not_le"
    }
  ]
}
```
Solution: Check all values are within valid ranges

---

## Integration Examples

### React Frontend Integration

```typescript
import { useState, useEffect } from 'react';

export function ConfigManager() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/v1/config', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setConfig(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // Update config
  const handleUpdateConfig = async (newConfig) => {
    try {
      const response = await fetch('/api/v1/config', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });
      
      if (response.ok) {
        const updated = await response.json();
        setConfig(updated);
        alert('✓ Configuration updated successfully');
      } else {
        alert('✗ Failed to update configuration');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading configuration...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>System Configuration</h2>
      <pre>{JSON.stringify(config, null, 2)}</pre>
      <button onClick={() => handleUpdateConfig({...config})}>
        Update Configuration
      </button>
    </div>
  );
}
```

---

## Best Practices

1. **Always validate before updating**: Use GET /config/validate before critical updates
2. **Change only what you need**: Partial updates are supported - don't send unchanged values
3. **Keep thresholds reasonable**: Follow the ascending order rule (low < medium < high)
4. **Monitor impact**: After updating, watch for changes in risk calculations
5. **Log changes**: All updates create audit logs for compliance
6. **Use admin accounts**: Only admins should modify configuration

---

## API Documentation

Full interactive documentation available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Look for the `Configuration` tag to see all endpoints with live testing.
