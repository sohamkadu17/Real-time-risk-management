1️⃣ FRONTEND FEATURES (Must-Have) + HOW THEY WORK
Think of frontend as “control room + explanation layer”.

🔐 1. Authentication & Role-Based Access
Who: Admin, Risk Analyst, Manager, Viewer
 Features
Login / Signup


JWT-based session


Role-based UI (buttons, tabs, actions hidden/shown)


Data flow
Frontend → /auth/login → Backend → JWT token
Frontend stores token → attaches to every API call


📊 2. Real-Time Risk Dashboard (CORE FEATURE)
What user sees
Overall Risk Score (Low / Medium / High)


Live charts (risk over time)


Active alerts


Key metrics (exposure, volatility, anomalies)


Frontend components
Line charts (Recharts / Chart.js)


Risk cards


Live updates via WebSocket / SSE


How data is fetched
WebSocket / SSE connection
Backend streams risk updates
Frontend auto-updates UI (no refresh)

💡 This is what judges LOVE — “real-time”.

🚨 3. Alerts & Notifications Panel
Features
Real-time alerts (fraud detected, threshold crossed)


Severity levels (Critical / Warning / Info)


Acknowledge / Resolve alert


Data
Pulled from streaming backend


Stored for audit


UI
Toast notifications


Alerts table


Color-coded severity



📈 4. Risk Analysis & Drill-Down View
Click any risk → see WHY it happened.
Features
Risk factor breakdown


Timeline of events


Linked transactions / sensors / logs


AI-generated explanation (optional)


Data fetching
Frontend → /risk/{risk_id}
Backend → DB + Pathway index + ML output


🧠 5. AI Insights / Explainability Panel
Very powerful feature
“Why is this high risk?”


“What changed in last 10 minutes?”


“What should we do next?”


Uses:
RAG (documents + live data)


LLM explanations


UI
Chat-style interface


Citations / sources


Confidence scores



📁 6. Data Sources Management
Admin-only
View connected data sources (Kafka, APIs, files)


Status: live / delayed / failed


Add simulated data streams (for demo)


Backend
Uses Pathway connectors


Frontend polls status



📜 7. Audit Logs & Compliance View
Why important
Risk systems MUST be auditable


Features
Who did what & when


Alerts history


Risk decisions history


UI
Table with filters


Export CSV / PDF



⚙️ 8. Settings & Threshold Configuration
Features
Risk thresholds


Alert rules


Sensitivity tuning
