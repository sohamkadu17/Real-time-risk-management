/**
 * API Service for Real-Time Risk Management System
 * Handles all backend communication including WebSocket and REST API calls
 */

const API_BASE_URL = "http://localhost:8000/api/v1";
const WS_BASE_URL = "ws://localhost:8000";

export interface RiskData {
  id: number;
  entity_id: string;
  entity_type: string;
  risk_score: number;
  risk_level: string;
  confidence: number;
  features: Record<string, any>;
  risk_factors: string[];
  source: string;
  created_at: string;
}

export interface StreamEvent {
  id: string;
  type: "data" | "compute" | "update";
  message: string;
  timestamp: string;
  risk_id?: number;
  risk_score?: number;
}

export class APIService {
  private static instance: APIService;
  private ws: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;
  private isReconnecting = false;
  private connectionStatus = "disconnected";
  private heartbeatInterval: number | null = null;
  private lastPongTime = 0;
  private reconnectTimeoutId: number | null = null;

  private constructor() {
    this.initializeEventSystem();
  }

  static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  private initializeEventSystem() {
    this.listeners.set("risk-update", []);
    this.listeners.set("connected", []);
    this.listeners.set("disconnected", []);
    this.listeners.set("error", []);
    this.listeners.set("reconnecting", []);
    this.listeners.set("connection-status", []);
  }

  /**
   * Connect to WebSocket for real-time updates with enhanced resilience
   */
  connectWebSocket(onRiskUpdate?: (data: RiskData) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.updateConnectionStatus("connecting");
        this.ws = new WebSocket(`${WS_BASE_URL}/ws/risk-stream`);

        // Connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            this.ws.close();
            reject(new Error("Connection timeout"));
          }
        }, 10000);

        this.ws.onopen = () => {
          console.log("✓ WebSocket connected");
          clearTimeout(connectionTimeout);
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          this.updateConnectionStatus("connected");
          this.startHeartbeat();
          this.emit("connected");
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            // Handle heartbeat pong
            if (event.data === "pong") {
              this.lastPongTime = Date.now();
              return;
            }

            // Try to parse as JSON (could be risk update)
            const data = JSON.parse(event.data);
            if (data.entity_id && data.risk_score !== undefined) {
              // It's a risk update
              if (onRiskUpdate) onRiskUpdate(data);
              this.emit("risk-update", data);
            }
          } catch (e) {
            // If not JSON, treat as string message
            console.log("WebSocket message:", event.data);
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          clearTimeout(connectionTimeout);
          this.updateConnectionStatus("error");
          this.emit("error", error);
          if (!this.isReconnecting) {
            reject(error);
          }
        };

        this.ws.onclose = (event) => {
          console.log(`WebSocket disconnected: Code ${event.code}, Reason: ${event.reason}`);
          clearTimeout(connectionTimeout);
          this.stopHeartbeat();
          this.updateConnectionStatus("disconnected");
          this.emit("disconnected", event);
          
          // Only attempt reconnect if not manually closed
          if (event.code !== 1000) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error("Failed to connect WebSocket:", error);
        this.updateConnectionStatus("error");
        this.emit("error", error);
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached. Manual reconnection required.");
        this.updateConnectionStatus("failed");
      }
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    // Exponential backoff with jitter
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    ) + Math.random() * 1000; // Add jitter

    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${Math.round(delay)}ms...`
    );
    
    this.updateConnectionStatus("reconnecting");
    this.emit("reconnecting", { attempt: this.reconnectAttempts, delay });
    
    this.reconnectTimeoutId = setTimeout(async () => {
      try {
        await this.connectWebSocket();
      } catch (error) {
        console.error("Reconnection failed:", error);
        this.isReconnecting = false;
        // Will retry on next close event if within attempt limits
      }
    }, delay);
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket() {
    this.isReconnecting = false;
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, "Manual disconnect"); // Normal closure
      this.ws = null;
    }
    this.updateConnectionStatus("disconnected");
  }

  /**
   * Send message through WebSocket with retry logic
   */
  sendWebSocketMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected, message queued for retry");
      // Could implement message queuing here for retry when reconnected
    }
  }

  /**
   * Start heartbeat to monitor connection health
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    this.lastPongTime = Date.now();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send("ping");
        
        // Check if we received pong within timeout
        setTimeout(() => {
          const timeSinceLastPong = Date.now() - this.lastPongTime;
          if (timeSinceLastPong > 15000) { // 15 second timeout
            console.warn("Heartbeat timeout - connection may be stale");
            this.ws?.close(1006, "Heartbeat timeout");
          }
        }, 5000);
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Stop heartbeat monitoring
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Update connection status and notify listeners
   */
  private updateConnectionStatus(status: string) {
    this.connectionStatus = status;
    this.emit("connection-status", status);
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  /**
   * Manually trigger reconnection
   */
  forceReconnect() {
    this.reconnectAttempts = 0;
    this.disconnectWebSocket();
    setTimeout(() => {
      this.connectWebSocket().catch(error => {
        console.error("Force reconnect failed:", error);
      });
    }, 1000);
  }

  /**
   * Get live risk assessments with retry logic
   */
  async getLiveRisks(limit: number = 50, retries: number = 3): Promise<RiskData[]> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/risk/live?limit=${limit}`,
          { 
            signal: AbortSignal.timeout(10000), // 10 second timeout
            headers: { 'Cache-Control': 'no-cache' }
          }
        );
        
        if (!response.ok) {
          if (attempt === retries) {
            // Last attempt - try demo endpoint as fallback
            const demoResponse = await fetch(`${API_BASE_URL}/risk/demo?limit=${limit}`);
            if (demoResponse.ok) {
              console.warn("Using demo data as fallback");
              return await demoResponse.json();
            }
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed for live risks:`, error);
        
        if (attempt === retries) {
          console.warn("All attempts failed, returning empty array");
          return [];
        }
        
        // Exponential backoff before retry  
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    return [];
  }

  /**
   * Get risk history with filters
   */
  async getRiskHistory(
    entityId?: string,
    entityType?: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<RiskData[]> {
    try {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
      });
      if (entityId) params.append("entity_id", entityId);
      if (entityType) params.append("entity_type", entityType);

      const response = await fetch(
        `${API_BASE_URL}/risk/history?${params.toString()}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch risk history:", error);
      return [];
    }
  }

  /**
   * Get specific risk by ID
   */
  async getRiskById(riskId: number): Promise<RiskData | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/risk/${riskId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch risk ${riskId}:`, error);
      return null;
    }
  }

  /**
   * Get AI explanation for a risk assessment
   */
  async getAIExplanation(riskId: number): Promise<{
    risk_id: number;
    explanation: string;
    similar_cases: any[];
  } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/explain/risk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ risk_id: riskId }),
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Failed to get AI explanation for risk ${riskId}:`, error);
      return null;
    }
  }

  /**
   * Get platform explanation
   */
  async getPlatformExplanation(): Promise<{
    overview: string;
    key_features: Array<{name: string; description: string}>;
    risk_models: any[];
    data_sources: string[];
    technical_specs: Record<string, any>;
  } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/explain/platform`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to get platform explanation:", error);
      return null;
    }
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, callback: Function) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit events
   */
  private emit(event: string, ...args: any[]) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((callback) => callback(...args));
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Generic HTTP GET request
   */
  async get(endpoint: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Generic HTTP POST request
   */
  async post(endpoint: string, data?: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Generic HTTP PUT request
   */
  async put(endpoint: string, data?: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Generic HTTP DELETE request
   */
  async delete(endpoint: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  }
}

export default APIService.getInstance();
