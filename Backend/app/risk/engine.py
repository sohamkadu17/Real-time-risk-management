"""
Risk engine for scoring and classification.

Supports two scoring modes:
  - Standard mode: velocity + amount + anomaly + reputation (original 4-factor model).
  - Market mode:   all standard factors + implied_volatility + Greeks exposure +
                   liquidity + session risk (activated when market features are present).
"""
import numpy as np
from typing import Dict, List, Tuple, Any
from datetime import datetime
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class RiskEngine:
    """
    Real-time risk scoring engine.

    Combines rule-based and probabilistic methods for risk assessment.
    When market/derivatives features are present (delta, gamma, implied_vol,
    spot_price, etc.) the engine activates an extended market-risk sub-model
    and blends it with the core transaction risk score.
    """

    # ── Core transaction feature weights (must sum to 1.0) ─────────────────
    _TXN_WEIGHTS = {
        "velocity":      0.30,
        "amount":        0.25,
        "anomaly_score": 0.25,
        "reputation":    0.20,
    }

    # ── Market / derivatives feature weights (internal sub-model) ──────────
    # These are combined into a single market_risk_score and then blended
    # with the transaction score.
    _MARKET_WEIGHTS = {
        "implied_vol":      0.30,   # IV level (normalised)
        "gamma_risk":       0.20,   # High gamma near expiry = rapid P&L swings
        "delta_risk":       0.15,   # Large absolute delta = high directional exposure
        "liquidity_risk":   0.15,   # Bid-ask spread / liquidity score
        "session_risk":     0.10,   # Pre-open / closed = elevated gap risk
        "price_change_risk":0.10,   # Intraday price move magnitude
    }

    # Blend ratio: 70% transaction, 30% market (only when market features present)
    _MARKET_BLEND = 0.30

    def __init__(self):
        self.high_threshold   = settings.RISK_HIGH_THRESHOLD
        self.medium_threshold = settings.RISK_MEDIUM_THRESHOLD
        self.low_threshold    = settings.RISK_LOW_THRESHOLD

    # ── Core transaction risk score ─────────────────────────────────────────
    def _transaction_score(self, features: Dict[str, Any]) -> float:
        """
        Calculate the base transaction/behavioural risk score (0→1).
        Uses velocity, amount, anomaly_score, reputation with fixed weights.
        """
        score = 0.0

        # Velocity (transactions per hour)
        velocity = features.get("velocity", 0)
        score += min(velocity / 100.0, 1.0) * self._TXN_WEIGHTS["velocity"]

        # Amount (transaction value in ₹)
        amount = features.get("amount", 0)
        score += min(amount / 10_000.0, 1.0) * self._TXN_WEIGHTS["amount"]

        # Anomaly score (statistical outlier measure, already 0–1)
        anomaly = features.get("anomaly_score", 0.0)
        score += float(anomaly) * self._TXN_WEIGHTS["anomaly_score"]

        # Reputation (0 = unknown/bad, 1 = trusted) → invert
        reputation = features.get("reputation", 1.0)
        score += (1.0 - float(reputation)) * self._TXN_WEIGHTS["reputation"]

        return min(score, 1.0)

    # ── Market / derivatives risk sub-model ─────────────────────────────────
    def _market_score(self, features: Dict[str, Any]) -> float:
        """
        Calculate a market-risk sub-score from derivatives/volatility features.
        Returns 0.0 if no market features are present.

        Sub-factors:
          implied_vol      – IV > 0.3 is elevated; >0.5 is extreme.
          gamma_risk       – High gamma near expiry → rapid MTM swings.
          delta_risk       – |delta| close to 1 → naked directional risk.
          liquidity_risk   – Wide bid-ask spread → adverse-fill / manipulation risk.
          session_risk     – Pre-open / closed hours → gap risk.
          price_change_risk– Large intraday moves → potential circuit-breaker trigger.
        """
        market_keys = {"delta", "gamma", "implied_vol", "spot_price", "bid_ask_spread"}
        if not any(k in features for k in market_keys):
            return 0.0   # no market data — market sub-score is zero

        w = self._MARKET_WEIGHTS
        score = 0.0

        # ── Implied volatility ───────────────────────────────────────────────
        iv = float(features.get("implied_vol", 0.0))
        # Normalise: 0–0.15 is normal (score≈0); 0.50+ is extreme (score≈1)
        iv_score = min(max(iv - 0.10, 0.0) / 0.40, 1.0)
        score += iv_score * w["implied_vol"]

        # ── Gamma risk ────────────────────────────────────────────────────────
        gamma = abs(float(features.get("gamma", 0.0)))
        # gamma > 0.05 is high for near-expiry index options
        gamma_score = min(gamma / 0.05, 1.0)
        score += gamma_score * w["gamma_risk"]

        # ── Delta risk ────────────────────────────────────────────────────────
        delta = abs(float(features.get("delta", 0.0)))
        # |delta| approaching 1.0 = fully directional (deep ITM)
        delta_score = min(delta, 1.0)
        score += delta_score * w["delta_risk"]

        # ── Liquidity risk ────────────────────────────────────────────────────
        # Use either bid_ask_spread (wider=riskier) or liquidity_score (lower=riskier)
        if "bid_ask_spread" in features:
            spread = float(features["bid_ask_spread"])
            # Spread >0.5 = poor liquidity → score=1
            liq_score = min(spread / 0.5, 1.0)
        else:
            liq = float(features.get("liquidity_score", 1.0))
            liq_score = 1.0 - liq   # invert: low liquidity = high risk
        score += liq_score * w["liquidity_risk"]

        # ── Session risk ──────────────────────────────────────────────────────
        session = features.get("market_session", "open")
        session_risk = {"open": 0.0, "pre_open": 0.5, "closed": 1.0}.get(session, 0.2)
        score += session_risk * w["session_risk"]

        # ── Intraday price change risk ─────────────────────────────────────────
        pct_change = abs(float(features.get("price_change_pct", 0.0)))
        # ≥5% move = high risk of circuit-breaker / gap
        price_score = min(pct_change / 5.0, 1.0)
        score += price_score * w["price_change_risk"]

        return min(score, 1.0)

    # ── Public: calculate composite risk score ───────────────────────────────
    def calculate_risk_score(self, features: Dict[str, Any]) -> float:
        """
        Calculate the composite risk score (0.0 → 1.0).

        If market/derivatives features are present the score is blended:
            final = (1 - MARKET_BLEND) × txn_score + MARKET_BLEND × market_score
        Otherwise it is the pure transaction score.

        Hard overrides:
          - blacklist_match → score always ≥ 0.95
          - unusual_pattern → score boosted by +0.15 (capped at 1.0)
        """
        txn   = self._transaction_score(features)
        mkt   = self._market_score(features)

        if mkt > 0.0:
            # Blend: market data enriches the score
            score = (1.0 - self._MARKET_BLEND) * txn + self._MARKET_BLEND * mkt
        else:
            score = txn

        # ── Hard flag overrides ───────────────────────────────────────────────
        if features.get("blacklist_match"):
            score = max(score, 0.95)

        if features.get("unusual_pattern"):
            score = min(score + 0.15, 1.0)

        return round(min(score, 1.0), 6)

    # ── Classify risk level ──────────────────────────────────────────────────
    def classify_risk_level(self, risk_score: float) -> str:
        """Classify risk_score into critical / high / medium / low."""
        if risk_score >= 0.90:
            return "critical"
        elif risk_score >= self.high_threshold:
            return "high"
        elif risk_score >= self.medium_threshold:
            return "medium"
        else:
            return "low"

    # ── Identify risk factors (human-readable explanations) ─────────────────
    def identify_risk_factors(
        self, features: Dict[str, Any], risk_score: float
    ) -> List[str]:
        """
        Return a list of human-readable risk-factor strings explaining the score.
        Covers both transaction and market-specific triggers.
        """
        factors: List[str] = []

        # ── Transaction factors ───────────────────────────────────────────────
        if features.get("velocity", 0) > 50:
            v = features["velocity"]
            factors.append(f"High transaction velocity ({v}/hr — threshold 50/hr)")

        if features.get("amount", 0) > 5_000:
            a = features["amount"]
            factors.append(f"Large transaction amount (₹{a:,.0f})")

        if features.get("anomaly_score", 0) > 0.7:
            a = features["anomaly_score"]
            factors.append(f"Statistical anomaly detected (score={a:.3f}, >0.7 threshold)")

        if features.get("reputation", 1.0) < 0.5:
            r = features["reputation"]
            factors.append(f"Low entity reputation ({r:.1%})")

        if features.get("unusual_pattern"):
            factors.append("Unusual behavioural pattern flagged (+15% score boost)")

        if features.get("blacklist_match"):
            factors.append("BLACKLIST MATCH — entity on bad-actor registry (score ≥ 0.95)")

        # ── Market / derivatives factors ──────────────────────────────────────
        iv = float(features.get("implied_vol", 0.0))
        if iv > 0.30:
            severity = "EXTREME" if iv > 0.50 else "ELEVATED"
            factors.append(
                f"High implied volatility ({iv:.1%} — {severity}; "
                "normal baseline <15%)"
            )

        gamma = abs(float(features.get("gamma", 0.0)))
        if gamma > 0.03:
            factors.append(
                f"High gamma exposure (γ={gamma:.5f} — rapid MTM risk near expiry)"
            )

        delta = abs(float(features.get("delta", 0.0)))
        if delta > 0.75:
            factors.append(
                f"High directional delta exposure (|Δ|={delta:.4f})"
            )

        session = features.get("market_session", "open")
        if session != "open":
            factors.append(
                f"Off-hours trading (session={session.upper()}) — "
                "elevated gap and liquidity risk"
            )

        pct = abs(float(features.get("price_change_pct", 0.0)))
        if pct >= 3.0:
            factors.append(
                f"Large intraday price move ({pct:+.2f}%) — "
                "potential circuit-breaker territory"
            )

        if not factors:
            factors.append(f"Composite model score ({risk_score:.3f}) exceeds threshold")

        return factors

    # ── Full assessment entrypoint ───────────────────────────────────────────
    def assess_risk(
        self,
        entity_id: str,
        entity_type: str,
        features: Dict[str, Any],
    ) -> Tuple[float, str, List[str]]:
        """
        Perform a complete risk assessment.

        Returns:
            (risk_score, risk_level, risk_factors)
        """
        risk_score   = self.calculate_risk_score(features)
        risk_level   = self.classify_risk_level(risk_score)
        risk_factors = self.identify_risk_factors(features, risk_score)

        logger.info(
            "Risk assessed — %s:%s  score=%.4f  level=%s  factors=%d",
            entity_type, entity_id, risk_score, risk_level, len(risk_factors),
        )

        return risk_score, risk_level, risk_factors

    # ── Dynamic threshold update ─────────────────────────────────────────────
    def update_thresholds(
        self,
        high: float = None,
        medium: float = None,
        low: float = None,
    ):
        """Update risk classification thresholds at runtime."""
        if high   is not None: self.high_threshold   = high
        if medium is not None: self.medium_threshold = medium
        if low    is not None: self.low_threshold    = low

        logger.info(
            "Risk thresholds updated — high=%.2f  medium=%.2f  low=%.2f",
            self.high_threshold, self.medium_threshold, self.low_threshold,
        )


# Global singleton
risk_engine = RiskEngine()
