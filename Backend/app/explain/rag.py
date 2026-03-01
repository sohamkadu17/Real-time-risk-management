"""
RAG (Retrieval-Augmented Generation) for risk explainability.
Powered by Google Gemini (free API) with TF-IDF retrieval over a rich
in-process knowledge base.

RAG pipeline:
  1. RETRIEVE  — BM25-style TF-IDF scoring ranks KB documents against a
                 query derived from the current risk assessment.
  2. AUGMENT   — Top-k documents are concatenated into the LLM prompt.
  3. GENERATE  — Gemini produces a natural-language explanation.

When Gemini is unavailable (no API key, quota, network) the system falls
back to a deterministic template-based explanation that still uses the
retrieved context to surface relevant detail.
"""

import math
import re
from collections import Counter
from typing import Optional, List, Dict, Any
import logging
import json

logger = logging.getLogger(__name__)

# ── Optional Gemini import ───────────────────────────────────────────────────
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-generativeai not installed. RAG will use template-based fallback.")


# ═══════════════════════════════════════════════════════════════════════════
# KNOWLEDGE BASE
# Each document has a rich set of keywords that aid TF-IDF retrieval.
# ═══════════════════════════════════════════════════════════════════════════

RISK_KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    {
        "id": "risk_scoring",
        "title": "Risk Scoring Methodology",
        "tags": ["score", "velocity", "amount", "anomaly", "reputation", "weighted", "formula"],
        "content": (
            "The risk scoring engine uses a weighted multi-factor model:\n"
            "- Transaction Velocity (30%): Number of transactions per time window. "
            "High velocity (>100/hr) indicates potential automated attacks or wash trading.\n"
            "- Transaction Amount (25%): Normalized against historical baselines. "
            "Amounts exceeding 5x average flag potential fraud.\n"
            "- Anomaly Score (25%): Statistical deviation from entity's normal behaviour "
            "pattern using rolling z-scores. Score >0.7 = statistical anomaly.\n"
            "- Entity Reputation (20%): Historical trustworthiness score. New entities "
            "start at 0.5, adjusted based on observed behaviour.\n"
            "Final Score = Σ(weight_i × normalised_feature_i), clamped to [0, 1]."
        ),
    },
    {
        "id": "risk_levels",
        "title": "Risk Level Classification",
        "tags": ["critical", "high", "medium", "low", "level", "classification", "threshold"],
        "content": (
            "Risk levels are classified as:\n"
            "- CRITICAL (≥0.9): Immediate blocking required. Automated circuit breaker triggers. "
            "Requires senior analyst review within 5 minutes.\n"
            "- HIGH (≥0.8): Manual review required before processing. Alert sent to risk team. "
            "15-minute SLA for review.\n"
            "- MEDIUM (≥0.5): Enhanced monitoring activated. Pattern tracked for 24 hours. "
            "Auto-cleared if no escalation.\n"
            "- LOW (<0.5): Standard processing. Routine monitoring. No manual intervention needed."
        ),
    },
    {
        "id": "market_risk",
        "title": "Market Risk Indicators — Greeks & Volatility",
        "tags": [
            "delta", "gamma", "theta", "vega", "rho", "implied_vol", "volatility",
            "spot_price", "greeks", "options", "futures", "nifty", "banknifty",
            "liquidity", "bid_ask", "market_session", "open_interest", "expiry",
        ],
        "content": (
            "Market-specific risk factors for Indian equity derivatives (NSE/BSE):\n"
            "- Implied Volatility (IV): IV > 2× historical average signals market stress. "
            "IV skew indicates directional fear. IV > 0.3 = elevated; >0.5 = extreme.\n"
            "- Delta: High absolute delta (>0.8) means the position behaves like a stock — "
            "directional risk is high. Delta near 0 = gamma/vega play.\n"
            "- Gamma: High gamma near expiry creates pin risk and rapid P&L swings. "
            "Gamma > 0.05 near expiry requires careful hedging.\n"
            "- Theta: Large negative theta (time decay) accelerates losses in volatile markets.\n"
            "- Vega: High vega exposure during earnings or events amplifies IV-move risk.\n"
            "- Liquidity: Bid-ask spread > 2% indicates poor liquidity. Volume drop >50% = caution.\n"
            "- Market Session: Pre-open gaps >2% and after-hours low-liquidity conditions "
            "increase adverse-fill and gap risk.\n"
            "- Open Interest: Surge in OI near key strikes signals potential pinning at expiry.\n"
            "- Correlation: Breakdown of historical correlations signals a regime change. "
            "Cross-asset correlation spike indicates systemic risk."
        ),
    },
    {
        "id": "alert_actions",
        "title": "Alert Response Procedures",
        "tags": ["alert", "critical", "high", "action", "block", "review", "escalate", "compliance"],
        "content": (
            "When risk alerts are triggered:\n"
            "- CRITICAL alerts: Auto-block the transaction, notify senior risk officers "
            "immediately, log to compliance audit trail with full feature snapshot.\n"
            "- HIGH alerts: Queue for manual review, apply temporary position/transaction limits, "
            "send email/SMS notification within 15 minutes.\n"
            "- MEDIUM alerts: Flag for monitoring, add entity to watchlist, include in daily "
            "risk report for next-day review.\n"
            "Alert lifecycle: Open → Acknowledged → Investigating → Resolved / Escalated.\n"
            "All actions are audit-logged with timestamps for SEBI / regulatory compliance."
        ),
    },
    {
        "id": "fraud_patterns",
        "title": "Common Fraud & Anomaly Patterns",
        "tags": [
            "fraud", "anomaly", "pattern", "blacklist", "unusual", "wash_trading",
            "layering", "spoofing", "velocity", "burst", "unusual_pattern", "blacklist_match",
        ],
        "content": (
            "Known fraud and anomaly patterns detected by the engine:\n"
            "- Velocity Bursts: Sudden spikes in transaction frequency (>5× baseline in 60s) "
            "suggest bot activity or wash-trading.\n"
            "- Layering / Spoofing: Rapid order placement and cancellation without fills; "
            "detected via unusual_pattern flag.\n"
            "- Blacklist Match: Entity ID, IP, or account matches a known bad-actor list — "
            "always triggers a CRITICAL or HIGH alert.\n"
            "- New-entity Large Transaction: Reputation < 0.4 combined with amount > ₹50,000 "
            "is a high-risk combination.\n"
            "- Anomaly Score >0.8: Statistical outlier — z-score > 3σ from entity's 30-day "
            "behaviour baseline.\n"
            "- Low Liquidity + High Amount: Executing large orders in illiquid markets "
            "creates market-impact and potential manipulation risk."
        ),
    },
    {
        "id": "nse_bse_context",
        "title": "NSE/BSE Market Context & Regulations",
        "tags": [
            "nse", "bse", "sebi", "india", "regulation", "circuit_breaker",
            "market_open", "market_close", "ist", "pre_open", "derivatives",
        ],
        "content": (
            "Indian equity market context:\n"
            "- Market Hours: NSE/BSE equities trade 09:15–15:30 IST. Pre-open 09:00–09:15.\n"
            "- F&O Expiry: Index options (NIFTY, BANKNIFTY) expire every Thursday. "
            "Near-expiry positions carry elevated gamma and liquidity risk.\n"
            "- Circuit Breakers: SEBI mandates market-wide circuit breaker at 10%, 15%, 20% index "
            "movement. Individual stocks have upper/lower circuit limits of 5–20%.\n"
            "- Position Limits: SEBI sets F&O position limits per entity. Breach triggers "
            "mandatory reporting and potential regulatory action.\n"
            "- Compliance: All risk events above MEDIUM must be logged in the Suspicious "
            "Transaction Report (STR) system within 7 days per PMLA guidelines.\n"
            "- Settlement: T+1 rolling settlement for equities; daily MTM for F&O positions."
        ),
    },
    {
        "id": "risk_mitigation",
        "title": "Risk Mitigation Strategies",
        "tags": [
            "mitigation", "hedge", "diversification", "stop_loss", "position_sizing",
            "monitoring", "limit", "reduce", "manage",
        ],
        "content": (
            "Risk mitigation strategies:\n"
            "- Delta Hedging: Maintain near-zero net delta for options portfolios by taking "
            "offsetting positions in the underlying or futures.\n"
            "- Position Sizing: Never risk more than 2% of portfolio NAV on a single trade. "
            "Scale down position size as volatility increases.\n"
            "- Stop-Loss Orders: Mandatory stop-loss at 1.5× ATR for all directional trades.\n"
            "- Diversification: Correlation monitoring ensures no two positions move together "
            "under stress scenarios (avoid concentration risk).\n"
            "- Real-Time Monitoring: Continuous risk-score polling every 3 seconds via the "
            "Pathway streaming pipeline. Alerts fire within 100ms of threshold breach.\n"
            "- Stress Testing: Daily VaR and CVaR computation against 1-day, 5-day, and "
            "30-day historical scenarios including COVID (Mar 2020) and COVID recovery."
        ),
    },
]


# ═══════════════════════════════════════════════════════════════════════════
# TF-IDF RETRIEVAL ENGINE
# ═══════════════════════════════════════════════════════════════════════════

def _tokenise(text: str) -> List[str]:
    """Lowercase, strip punctuation, return word tokens."""
    return re.findall(r"[a-z0-9_]+", text.lower())


def _build_query_terms(
    risk_score: float,
    risk_level: str,
    risk_factors: List[str],
    features: dict,
) -> List[str]:
    """
    Build a bag-of-words query from the current risk assessment context.
    Includes risk-level keywords, feature names, and risk-factor text so the
    TF-IDF retriever can match relevant KB documents.
    """
    terms: List[str] = []

    # Risk level and score range
    terms.append(risk_level)
    if risk_score >= 0.9:
        terms.extend(["critical", "block", "escalate"])
    elif risk_score >= 0.8:
        terms.extend(["high", "alert", "review"])
    elif risk_score >= 0.5:
        terms.append("medium")
    else:
        terms.append("low")

    # Feature names present in this event
    market_feature_keys = {
        "delta", "gamma", "theta", "vega", "rho", "implied_vol",
        "spot_price", "open_interest", "bid_ask_spread",
    }
    for key in features:
        terms.append(key)
        if key in market_feature_keys:
            terms.extend(["market", "greeks", "volatility"])

    # Tokens from risk-factor strings
    for factor in risk_factors:
        terms.extend(_tokenise(factor))

    # Named flags
    if features.get("blacklist_match"):
        terms.extend(["blacklist", "fraud"])
    if features.get("unusual_pattern"):
        terms.extend(["unusual", "pattern", "anomaly"])
    if features.get("volatility_regime") == "volatile":
        terms.extend(["volatile", "volatility"])

    return terms


def _tfidf_score(query_terms: List[str], doc: Dict[str, Any], all_docs: List[Dict]) -> float:
    """
    BM25-inspired TF-IDF score for one KB document against the query terms.

    We blend:
      - Tag overlap  (exact match in the document's `tags` list — high weight)
      - Content TF-IDF (term frequency in doc content vs. inverse doc frequency)
    """
    query_counter = Counter(query_terms)
    N = len(all_docs)

    # ── Tag overlap score (tags carry extra weight) ─────────────────────────
    tag_score = sum(1.5 for t in doc.get("tags", []) if t in query_counter)

    # ── Content TF-IDF ───────────────────────────────────────────────────────
    content_words = _tokenise(doc["content"])
    content_counter = Counter(content_words)
    doc_len = max(len(content_words), 1)

    tfidf_score = 0.0
    for term, qcount in query_counter.items():
        tf = content_counter.get(term, 0) / doc_len
        # Document frequency: count how many docs contain this term
        df = sum(
            1 for d in all_docs
            if term in _tokenise(d["content"]) or term in d.get("tags", [])
        )
        idf = math.log((N + 1) / (df + 1)) + 1  # smoothed IDF
        tfidf_score += tf * idf * qcount

    return tag_score + tfidf_score


class RAGExplainability:
    """
    RAG-based explainability for risk assessments.

    Uses Google Gemini (free API) for natural-language generation.
    Falls back to a template-based explanation if Gemini is unavailable.

    RAG Flow:
      1. RETRIEVE — TF-IDF ranks the knowledge base and selects top-k docs.
      2. AUGMENT  — Builds a rich prompt: retrieved context + full risk data.
      3. GENERATE — Gemini (or template) produces the explanation.
    """

    TOP_K = 4   # number of KB documents to include in prompt context

    def __init__(self):
        self.knowledge_base: List[Dict[str, Any]] = list(RISK_KNOWLEDGE_BASE)
        self.model = None
        self.is_initialized = False
        self.gemini_available = False

    def initialize(self, api_key: Optional[str] = None):
        """
        Initialise the RAG system with Google Gemini.

        Args:
            api_key: Gemini API key (free from https://aistudio.google.com/apikey)
        """
        if not GEMINI_AVAILABLE:
            logger.warning("Gemini SDK not installed. Using template fallback.")
            self.is_initialized = True
            return

        if not api_key or api_key in ("your-gemini-api-key-here", "", None):
            logger.warning("No valid Gemini API key. Using template fallback.")
            self.is_initialized = True
            return

        try:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                generation_config={
                    "temperature": 0.3,
                    "top_p": 0.8,
                    "max_output_tokens": 1024,
                },
            )
            self.gemini_available = True
            self.is_initialized = True
            logger.info("✓ Gemini RAG system initialised successfully")
        except Exception as exc:
            logger.error("✗ Failed to initialise Gemini: %s — using template fallback.", exc)
            self.is_initialized = True

    # ── RETRIEVE step ────────────────────────────────────────────────────────
    def _retrieve_context(
        self,
        risk_score: float,
        risk_level: str,
        risk_factors: List[str],
        features: dict,
    ) -> str:
        """
        RETRIEVE step: TF-IDF rank all KB documents against the query and
        return the top-k most relevant, concatenated for the LLM prompt.

        Unlike the old version that always returned the same hardcoded docs,
        this uses query-term scoring so the context is actually relevant to
        the specific event being explained.
        """
        query_terms = _build_query_terms(risk_score, risk_level, risk_factors, features)

        # Score every document
        scored_docs = [
            (doc, _tfidf_score(query_terms, doc, self.knowledge_base))
            for doc in self.knowledge_base
        ]
        # Sort by score descending, take top-k
        scored_docs.sort(key=lambda x: x[1], reverse=True)
        top_docs = [doc for doc, score in scored_docs[: self.TOP_K] if score > 0]

        if not top_docs:
            # Fallback: always include the two core docs
            top_docs = self.knowledge_base[:2]

        logger.debug(
            "RAG retrieved %d docs for risk_level=%s scores=%s",
            len(top_docs),
            risk_level,
            [round(s, 3) for _, s in scored_docs[: self.TOP_K]],
        )

        return "\n---\n".join(
            f"[{doc['title']}]\n{doc['content']}" for doc in top_docs
        )
    
    # ── AUGMENT step ─────────────────────────────────────────────────────────
    def _build_prompt(
        self,
        risk_score: float,
        risk_level: str,
        risk_factors: List[str],
        features: dict,
        context: str,
    ) -> str:
        """
        AUGMENT step: combine retrieved context + risk data into the LLM prompt.
        """
        features_str = json.dumps(features, indent=2, default=str)
        factors_str = (
            "\n".join(f"  - {f}" for f in risk_factors)
            if risk_factors
            else "  - None identified"
        )

        prompt = (
            "You are a senior risk analyst AI assistant for a real-time risk management platform "
            "covering Indian equity derivatives (NSE/BSE).\n"
            "Your job is to explain risk assessments in clear, professional language that both "
            "technical analysts and business stakeholders can understand.\n\n"
            "## Retrieved Knowledge Base Context\n"
            f"{context}\n\n"
            "## Current Risk Assessment\n"
            f"- Risk Score: {risk_score:.4f}  (0.0 = no risk, 1.0 = maximum risk)\n"
            f"- Risk Level: {risk_level.upper()}\n"
            f"- Identified Risk Factors:\n{factors_str}\n\n"
            "## Raw Feature Snapshot\n"
            f"```json\n{features_str}\n```\n\n"
            "## Task\n"
            "Based on the knowledge base context and risk data above, provide:\n"
            "1. SUMMARY (2-3 sentences): What this score means in plain language.\n"
            "2. KEY DRIVERS (bullets): Which features pushed the score highest and why.\n"
            "3. MARKET CONTEXT (only if market/Greek features are present): "
            "How current market conditions affect this assessment.\n"
            "4. RECOMMENDATION: Exact action required for this risk level.\n\n"
            "Be concise, professional, and reference specific numbers from the data. "
            "Use plain section headings, not markdown."
        )
        return prompt

    # ── GENERATE step (full pipeline) ────────────────────────────────────────
    async def explain_risk(
        self,
        risk_score: float,
        risk_level: str,
        risk_factors: List[str],
        features: dict,
    ) -> str:
        """
        Full RAG pipeline: RETRIEVE → AUGMENT → GENERATE.

        Returns a natural-language explanation from Gemini, or a rich
        template-based explanation if Gemini is unavailable.
        """
        if not self.is_initialized:
            from app.core.config import settings
            self.initialize(api_key=settings.GEMINI_API_KEY)

        # Step 1: RETRIEVE — TF-IDF ranked context
        context = self._retrieve_context(risk_score, risk_level, risk_factors, features)

        # Step 2+3: AUGMENT + GENERATE with Gemini
        if self.gemini_available and self.model:
            try:
                prompt = self._build_prompt(risk_score, risk_level, risk_factors, features, context)
                response = await self.model.generate_content_async(prompt)

                if response and response.text:
                    logger.info("Gemini explanation generated (risk_score=%.3f)", risk_score)
                    return response.text
                else:
                    logger.warning("Gemini returned empty response — using template fallback.")
            except Exception as exc:
                logger.error("Gemini API error: %s — using template fallback.", exc)
        
        # Fallback: rich template-based explanation (no LLM needed)
        return self._template_explanation(risk_score, risk_level, risk_factors, features)

    # ── Template-based fallback explanation ───────────────────────────────────
    def _template_explanation(
        self,
        risk_score: float,
        risk_level: str,
        risk_factors: List[str],
        features: dict,
    ) -> str:
        """
        Deterministic, information-rich explanation based on retrieved KB context.
        Used when Gemini is unavailable.  Still reflects TF-IDF retrieved context
        so the output is tailored to the specific event type.
        """
        parts: List[str] = [
            "RISK ASSESSMENT SUMMARY",
            f"Score: {risk_score:.4f} | Level: {risk_level.upper()}",
            "",
            f"This entity was assessed with a {risk_level.upper()} risk level "
            f"(score {risk_score:.2f} / 1.00). "
            + {
                "critical": "Immediate action is required — auto-blocking has been triggered.",
                "high": "Manual review is required before further processing.",
                "medium": "Enhanced monitoring has been activated for this entity.",
                "low": "No manual intervention required; routine monitoring continues.",
            }.get(risk_level, ""),
            "",
        ]

        # ── Key risk indicators ───────────────────────────────────────────────
        if risk_factors:
            parts.append("KEY RISK INDICATORS:")
            for i, factor in enumerate(risk_factors, 1):
                parts.append(f"  {i}. {factor}")
            parts.append("")

        # ── Transaction / behavioural features ───────────────────────────────
        parts.append("FEATURE ANALYSIS:")

        if "velocity" in features:
            v = features["velocity"]
            sev = "HIGH" if v > 100 else "MODERATE" if v > 50 else "NORMAL"
            parts.append(f"  - Transaction Velocity : {v}/hr [{sev}]")

        if "amount" in features:
            a = features["amount"]
            sev = "HIGH" if a > 10_000 else "MODERATE" if a > 5_000 else "NORMAL"
            parts.append(f"  - Transaction Amount   : ₹{a:,.2f} [{sev}]")

        if "anomaly_score" in features:
            a = features["anomaly_score"]
            sev = "HIGH" if a > 0.7 else "MODERATE" if a > 0.4 else "NORMAL"
            parts.append(f"  - Anomaly Score        : {a:.3f} [{sev}]")

        if "reputation" in features:
            r = features["reputation"]
            sev = "POOR" if r < 0.3 else "FAIR" if r < 0.6 else "GOOD"
            parts.append(f"  - Entity Reputation    : {r:.1%} [{sev}]")

        if features.get("blacklist_match"):
            parts.append("  ⚠ BLACKLIST MATCH — entity appears on bad-actor registry.")

        if features.get("unusual_pattern"):
            parts.append("  ⚠ UNUSUAL PATTERN — behavioural signature deviates significantly.")

        # ── Market / derivatives context ──────────────────────────────────────
        if "spot_price" in features:
            parts += [
                "",
                "MARKET CONTEXT:",
                f"  - Symbol        : {features.get('symbol', 'N/A')}",
                f"  - Spot Price    : ₹{features.get('spot_price', 0):,.2f}",
                f"  - Price Change  : {features.get('price_change_pct', 0):+.2f}%",
                f"  - Market Session: {features.get('market_session', 'unknown').upper()}",
                f"  - Vol Regime    : {features.get('volatility_regime', 'normal').upper()}",
            ]
            if "implied_vol" in features:
                iv = features["implied_vol"]
                iv_sev = "EXTREME" if iv > 0.5 else "ELEVATED" if iv > 0.3 else "NORMAL"
                parts.append(f"  - Implied Vol   : {iv:.2%} [{iv_sev}]")
            if "delta" in features:
                parts.append(
                    f"  - Greeks        : Δ={features['delta']:.4f}  "
                    f"Γ={features.get('gamma', 0):.6f}  "
                    f"Θ={features.get('theta', 0):.4f}  "
                    f"ν={features.get('vega', 0):.4f}"
                )
            if "bid_ask_spread" in features:
                ba = features["bid_ask_spread"]
                ba_sev = "WIDE" if ba > 0.3 else "NORMAL"
                parts.append(f"  - Bid-Ask Spread: {ba:.2f} [{ba_sev}]")

        # ── Recommendation ────────────────────────────────────────────────────
        rec = {
            "critical": (
                "IMMEDIATE ACTION REQUIRED — block transaction, escalate to senior "
                "risk officer, begin incident investigation within 5 minutes."
            ),
            "high": (
                "MANUAL REVIEW REQUIRED — apply temporary limits, notify risk team, "
                "complete review within 15 minutes before releasing the order."
            ),
            "medium": (
                "ENHANCED MONITORING — add entity to watchlist, include in daily risk "
                "report. Auto-clear if no escalation within 24 hours."
            ),
            "low": (
                "STANDARD PROCESSING — continue routine monitoring. No manual "
                "intervention necessary at this time."
            ),
        }.get(risk_level, "Review as per standard procedures.")

        parts += ["", f"RECOMMENDATION: {rec}", ""]

        if not self.gemini_available:
            parts.append(
                "[Template explanation — set GEMINI_API_KEY in .env to enable "
                "AI-powered analysis via Google Gemini.]"
            )

        return "\n".join(parts)

    # ── Knowledge base management ─────────────────────────────────────────────
    def add_document(self, content: str, metadata: Optional[dict] = None):
        """
        Add a document to the in-process knowledge base.

        In a production deployment this would:
          1. Generate embeddings via Gemini Embedding API.
          2. Upsert into a Pathway vector store / Pinecone / Qdrant.
          3. Enable semantic-similarity retrieval instead of TF-IDF.
        """
        doc: Dict[str, Any] = {
            "id": f"custom_{len(self.knowledge_base)}",
            "title": (metadata or {}).get("title", "Custom Document"),
            "tags": (metadata or {}).get("tags", []),
            "content": content,
        }
        self.knowledge_base.append(doc)
        logger.info("Document added to RAG KB: %d total", len(self.knowledge_base))

    # ── Similar-case retrieval ────────────────────────────────────────────────
    def query_similar_cases(
        self, risk_score: float, features: dict, risk_factors: Optional[List[str]] = None
    ) -> List[dict]:
        """
        Return the top-3 most relevant KB documents as 'similar cases'.

        Uses the same TF-IDF engine as the main retriever so the results
        are actually ranked by relevance, not returned in arbitrary order.
        """
        risk_factors = risk_factors or []
        # Infer risk level from score for query construction
        if risk_score >= 0.9:
            risk_level = "critical"
        elif risk_score >= 0.8:
            risk_level = "high"
        elif risk_score >= 0.5:
            risk_level = "medium"
        else:
            risk_level = "low"

        query_terms = _build_query_terms(risk_score, risk_level, risk_factors, features)

        scored = [
            (doc, _tfidf_score(query_terms, doc, self.knowledge_base))
            for doc in self.knowledge_base
        ]
        scored.sort(key=lambda x: x[1], reverse=True)

        return [
            {
                "id": doc["id"],
                "title": doc["title"],
                "relevance_score": round(score, 4),
                "relevance": "high" if score > 2.0 else "medium" if score > 0.5 else "low",
                "summary": doc["content"][:250].strip() + "…",
            }
            for doc, score in scored[:3]
        ]


# Global singleton
rag_explainability = RAGExplainability()
