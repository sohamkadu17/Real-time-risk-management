"""
Pathway streaming pipeline for real-time risk processing.

Uses the Pathway framework (https://pathway.com) for true reactive streaming:
  - pw.io.python.ConnectorSubject  → ingests simulated market events
  - pw.Schema subclass             → declares table schema
  - pw.apply()                     → real-time risk scoring on each row
  - pw.io.subscribe / pw.io.python.write → outputs results to DB + WebSocket

Falls back to a threading-based loop on platforms where Pathway is unavailable
(Windows dev environment).  The two classes share an identical public interface
so the rest of the app (main.py, websocket, etc.) is completely unchanged.

Pathway data-flow (Linux / Docker):

    LiveMarketSimulator.generate_event()
          │  (feeder thread – one row every `interval` seconds)
          ▼
    _EventSubject.next()           ← ConnectorSubject push API
          │
          ▼  pw.io.python.read(subject, schema=_EventSchema)
    pw.Table[_EventSchema]
          │
          ▼  pw.apply(_score_row, ...)     ← pure function, no I/O
    pw.Table[result: str]                 ← single JSON blob per row
          │
          ▼  pw.io.subscribe / pw.io.python.write  ← sink callback
    _on_risk_output()              ← parse JSON, write DB, WebSocket

Event-loop threading contract
──────────────────────────────
FastAPI runs on the *main* asyncio event loop.  The Pathway engine (and the
feeder thread) run on daemon threads started by app/main.py.  To broadcast
WebSocket messages from those threads we need the *main* loop reference.

WRONG:  asyncio.get_event_loop() inside a daemon thread
        — Python ≥ 3.10 raises DeprecationWarning and can return a different
          loop (or raise RuntimeError) when called outside an async context.

RIGHT:  main.py grabs ``asyncio.get_running_loop()`` during ``lifespan``
        startup (always the correct loop) and passes it to the pipeline via
        ``set_event_loop()``.  The daemon thread then uses that reference.
"""

import logging
import threading
import asyncio
import json
from typing import Dict, Any, Optional
from datetime import datetime

from app.risk.engine import risk_engine
from app.risk.models import Risk
from app.alerts.service import AlertService
from app.audit.router import create_audit_log
from app.streaming.simulator import LiveMarketSimulator
from db.session import SessionLocal

logger = logging.getLogger(__name__)

# ── Detect Pathway availability ──────────────────────────────────────────────
try:
    import pathway as pw
    PATHWAY_AVAILABLE = True
    logger.info("✓ Pathway %s detected — using native streaming engine", pw.__version__)
except (ImportError, Exception) as _pw_err:
    PATHWAY_AVAILABLE = False
    logger.warning(
        "Pathway not available (%s). Using threading fallback streaming engine.", _pw_err
    )


# ── Compatibility shim: pw.io.subscribe (≥0.16) vs pw.io.python.write (≥0.14) ─
def _pathway_subscribe(table, callback) -> None:
    """
    Attach a Python sink callback to a Pathway table.

    Pathway ≥ 0.16 introduced ``pw.io.subscribe`` as the preferred API.
    Older 0.14/0.15 builds use ``pw.io.python.write``.
    Both accept the same ``on_change(key, row, time, is_addition)`` signature.
    """
    if PATHWAY_AVAILABLE:
        if hasattr(pw.io, "subscribe"):
            pw.io.subscribe(table, on_change=callback)          # ≥ 0.16
        else:
            pw.io.python.write(table, callback)                  # 0.14 / 0.15


# ── Pure function: score one event row — defined at module level so Pathway ──
# ── can reliably serialize/pickle it if the Rust runtime ever needs to.     ──
def _score_row(
    entity_id: str,
    entity_type: str,
    features_json: str,
    timestamp: str,
) -> str:
    """
    Pure transformation function passed to ``pw.apply()``.

    Deserialises the feature JSON, calls the risk engine, and re-serialises
    the full result as a JSON string.  No I/O, no side-effects — safe for
    Pathway's reactive graph.
    """
    try:
        features = json.loads(features_json)
        risk_score, risk_level, risk_factors = risk_engine.assess_risk(
            entity_id=entity_id,
            entity_type=entity_type,
            features=features,
        )
        return json.dumps(
            {
                "entity_id": entity_id,
                "entity_type": entity_type,
                "risk_score": risk_score,
                "risk_level": risk_level,
                "risk_factors": risk_factors,
                "features_json": features_json,
                "timestamp": timestamp,
            },
            default=str,
        )
    except Exception as exc:
        return json.dumps({"error": str(exc), "entity_id": entity_id})


# ═══════════════════════════════════════════════════════════════════════════════
# PATHWAY-NATIVE PIPELINE  (Linux / Docker — real reactive streaming)
# ═══════════════════════════════════════════════════════════════════════════════

if PATHWAY_AVAILABLE:

    # ── Schema: defines the columns of the Pathway input table ────────────────
    class _EventSchema(pw.Schema):
        """
        Typed schema for the market-event input table.

        Pathway uses this to validate and type each ingested row.
        Do NOT put these annotations on the ConnectorSubject class —
        the subject is a data-push handle, not the schema.
        """
        entity_id: str
        entity_type: str
        features_json: str   # JSON-encoded features dict from the simulator
        timestamp: str       # ISO-8601 UTC string

    # ── ConnectorSubject: the push-API bridge between feeder thread & Pathway ─
    class _EventSubject(pw.io.python.ConnectorSubject):
        """
        Pathway ConnectorSubject that receives rows from the feeder thread and
        injects them into the live Pathway dataflow graph.

        Usage:
            subject = _EventSubject()
            table   = pw.io.python.read(subject, schema=_EventSchema)
            # feeder thread calls:
            subject.next(entity_id=..., entity_type=...,
                         features_json=..., timestamp=...)
            # to stop:
            subject.close()
        """

        def __init__(self):
            super().__init__()
            # Event used by stop() to unblock run() cleanly
            self._shutdown = threading.Event()

        def run(self):
            """
            Pathway calls run() on its own internal thread.
            We simply block until close() is called from outside,
            which sets _shutdown and terminates pw.run().
            """
            self._shutdown.wait()

        def close(self):
            """Signal the subject to stop and notify Pathway."""
            self._shutdown.set()
            super().close()

    # ── PathwayPipeline: builds and runs the dataflow graph ───────────────────
    class PathwayPipeline:
        """
        Production streaming pipeline powered by the Pathway reactive engine.

        Public API (identical to the fallback class):
            pipeline.set_event_loop(loop)           # call BEFORE start_simulation()
            pipeline.set_websocket_manager(manager)
            pipeline.start_simulation(interval=3.0) # blocks — run in a daemon thread
            pipeline.stop()
            pipeline.get_stats() -> dict
        """

        def __init__(self):
            self.simulator = LiveMarketSimulator()
            self.is_running = False
            self.events_processed = 0
            self.errors_count = 0
            self.websocket_manager = None
            self._stop_event = threading.Event()
            self._subject: Optional[_EventSubject] = None
            # The FastAPI asyncio event loop — set by main.py *before* the
            # daemon thread starts.  Never captured from inside a worker thread.
            self._main_loop: Optional[asyncio.AbstractEventLoop] = None
            logger.info("PathwayPipeline initialised (native Pathway engine)")

        def set_websocket_manager(self, manager) -> None:
            """Attach the WebSocket broadcast manager."""
            self.websocket_manager = manager

        def set_event_loop(self, loop: asyncio.AbstractEventLoop) -> None:
            """
            Store the FastAPI event loop so the Pathway sink can schedule
            WebSocket coroutines from the worker thread via
            ``asyncio.run_coroutine_threadsafe()``.

            Must be called from the main async context (lifespan startup)
            *before* ``start_simulation()`` is invoked.
            """
            self._main_loop = loop
            logger.debug("Event loop registered with PathwayPipeline (native).")

        # ── Pathway sink callback: one call per output row ───────────────────
        def _on_risk_output(self, key, row: Dict[str, Any], time, is_addition: bool):
            """
            Called by pw.io.python.write() for every processed output row.

            `row` contains a single column: "result" (JSON string).
            We parse it once here (instead of 7 separate pw.apply lambdas),
            persist to DB, fire alerts, and broadcast via WebSocket.
            """
            if not is_addition:
                return  # retraction — ignore (no deletion semantics needed here)

            try:
                # ── Parse the JSON result produced by _score_row ─────────────
                data = json.loads(row["result"])
                entity_id       = data["entity_id"]
                entity_type     = data["entity_type"]
                risk_score      = data["risk_score"]
                risk_level      = data["risk_level"]
                risk_factors    = data["risk_factors"]   # already a list
                features        = json.loads(data["features_json"])

                # ── Persist to database ──────────────────────────────────────
                db = SessionLocal()
                try:
                    risk = Risk(
                        entity_id=entity_id,
                        entity_type=entity_type,
                        risk_score=risk_score,
                        risk_level=risk_level,
                        features=features,
                        risk_factors=risk_factors,
                        source="pathway_stream",
                    )
                    db.add(risk)
                    db.commit()
                    db.refresh(risk)

                    create_audit_log(
                        db=db,
                        user_id=None,
                        action="risk_assessed",
                        entity_type=entity_type,
                        entity_id=entity_id,
                        details={"risk_id": risk.id, "risk_score": risk_score},
                    )

                    # ── Trigger alert for high/critical risk events ──────────
                    if risk_level in ("high", "critical"):
                        alert = AlertService.create_alert_for_risk(db, risk)
                        logger.warning(
                            "Alert %s created for %s risk (entity=%s, score=%.3f)",
                            alert.id, risk_level, entity_id, risk_score,
                        )

                    # ── Broadcast to WebSocket clients ───────────────────────
                    if self.websocket_manager:
                        msg = {
                            "type": "risk_update",
                            "data": {
                                "id": risk.id,
                                "entity_id": entity_id,
                                "entity_type": entity_type,
                                "risk_score": risk_score,
                                "risk_level": risk_level,
                                "confidence": features.get("reputation", 0.85),
                                "features": features,
                                "risk_factors": risk_factors,
                                "source": "pathway_stream",
                                "timestamp": (
                                    risk.created_at.isoformat()
                                    if risk.created_at
                                    else datetime.utcnow().isoformat()
                                ),
                            },
                        }
                        loop = self._main_loop
                        if loop and loop.is_running():
                            asyncio.run_coroutine_threadsafe(
                                self.websocket_manager.broadcast(msg), loop
                            )

                    self.events_processed += 1
                finally:
                    db.close()

            except Exception as exc:
                self.errors_count += 1
                logger.error("Pathway sink error: %s", exc, exc_info=True)

        # ── Build and run the Pathway dataflow graph ─────────────────────────
        def start_simulation(self, interval: float = 3.0):
            """
            Construct the Pathway dataflow graph and execute it.

            Steps:
              1. Create _EventSubject (the push-API ingest handle).
              2. pw.io.python.read() → declares a streaming pw.Table.
              3. pw.apply(_score_row) → scores every incoming row using the
                 module-level pure function (no local redefinition).
              4. _pathway_subscribe() → routes results to our sink callback
                 (compatible with both Pathway ≥0.16 and 0.14/0.15).
              5. Start feeder thread → pushes market events into the subject.
              6. pw.run() → start the Pathway scheduler (blocks here).

            Note: The event loop must be supplied via set_event_loop() *before*
            calling this method.  Do NOT call asyncio.get_event_loop() from
            inside a worker thread — it returns the wrong loop in Python ≥ 3.10.
            """
            self.is_running = True
            self._stop_event.clear()

            if self._main_loop is None:
                logger.warning(
                    "No event loop registered — WebSocket broadcasts will be skipped. "
                    "Call set_event_loop() from the FastAPI lifespan before starting."
                )

            logger.info("Building Pathway dataflow graph (tick=%.1fs)…", interval)

            # ── Step 1: Create the ConnectorSubject ──────────────────────────
            self._subject = _EventSubject()

            # ── Step 2: Declare the input table from the subject ─────────────
            input_table = pw.io.python.read(
                self._subject,
                schema=_EventSchema,
            )

            # ── Step 3: Score each row via module-level _score_row ───────────
            # Using pw.apply() with the module-level function (not a closure)
            # ensures Pathway can always locate and serialise the function.
            scored_table = input_table.select(
                result=pw.apply(
                    _score_row,
                    input_table.entity_id,
                    input_table.entity_type,
                    input_table.features_json,
                    input_table.timestamp,
                )
            )

            # ── Step 4: Attach the sink (version-safe shim) ──────────────────
            _pathway_subscribe(scored_table, self._on_risk_output)

            # ── Step 5: Feeder thread ─────────────────────────────────────────
            def _feed():
                logger.info("Pathway feeder thread started (interval=%.1fs)", interval)
                while not self._stop_event.is_set():
                    try:
                        event = self.simulator.generate_event()
                        self._subject.next(
                            entity_id=event["entity_id"],
                            entity_type=event["entity_type"],
                            features_json=json.dumps(event["features"], default=str),
                            timestamp=event["timestamp"],
                        )
                    except Exception as exc:
                        logger.error("Feeder error: %s", exc)
                    self._stop_event.wait(interval)

                # Feeder done — close the subject so pw.run() can finish
                logger.info("Pathway feeder thread stopping; closing subject…")
                self._subject.close()

            feeder = threading.Thread(target=_feed, daemon=True, name="pw-feeder")
            feeder.start()

            # ── Step 6: Run the Pathway scheduler (blocks until subject closed) ─
            logger.info("▶ Pathway engine running — reactive streaming active")
            try:
                pw.run()
            except Exception as exc:
                logger.error("Pathway engine error: %s", exc, exc_info=True)
            finally:
                self.is_running = False
                logger.info(
                    "Pathway engine stopped. events_processed=%d errors=%d",
                    self.events_processed,
                    self.errors_count,
                )

        def stop(self):
            """Signal the feeder thread to stop (which will then close the subject)."""
            self._stop_event.set()
            self.is_running = False
            logger.info(
                "stop() called. events_processed=%d errors=%d",
                self.events_processed,
                self.errors_count,
            )

        def get_stats(self) -> Dict[str, Any]:
            return {
                "is_running": self.is_running,
                "events_processed": self.events_processed,
                "errors_count": self.errors_count,
                "error_rate": self.errors_count / max(self.events_processed, 1),
                "engine": "pathway_native",
                "pathway_version": pw.__version__,
            }


# ═══════════════════════════════════════════════════════════════════════════════
# THREADING FALLBACK PIPELINE  (Windows / any environment without Pathway)
# ═══════════════════════════════════════════════════════════════════════════════

else:

    class PathwayPipeline:  # type: ignore[no-redef]
        """
        Fallback streaming pipeline for environments where Pathway is unavailable
        (Windows, CI, dev machines without Linux).

        Mimics Pathway's data-flow semantics:
          generate_event() → assess_risk() → persist DB → broadcast WebSocket

        Same public interface as the Pathway version — the rest of the codebase
        is completely unaware of which backend is active.
        """

        def __init__(self):
            self.simulator = LiveMarketSimulator()
            self.is_running = False
            self.events_processed = 0
            self.errors_count = 0
            self.websocket_manager = None
            self._stop_event = threading.Event()
            self._main_loop: Optional[asyncio.AbstractEventLoop] = None
            logger.info(
                "PathwayPipeline initialised (threading fallback — "
                "install Pathway on Linux for native streaming)"
            )

        def set_websocket_manager(self, manager) -> None:
            """Attach the WebSocket broadcast manager."""
            self.websocket_manager = manager

        def set_event_loop(self, loop: asyncio.AbstractEventLoop) -> None:
            """
            Store the FastAPI event loop for WebSocket broadcasting from threads.

            Must be called from the main async context (lifespan startup)
            *before* ``start_simulation()`` is invoked.  Never call
            ``asyncio.get_event_loop()`` from inside a worker thread.
            """
            self._main_loop = loop
            logger.debug("Event loop registered with PathwayPipeline (fallback).")

        def _process_event(self, event: Dict[str, Any]):
            """Score one market event, persist to DB, and broadcast."""
            try:
                entity_id   = event["entity_id"]
                entity_type = event["entity_type"]
                features    = event["features"]

                risk_score, risk_level, risk_factors = risk_engine.assess_risk(
                    entity_id=entity_id,
                    entity_type=entity_type,
                    features=features,
                )

                db = SessionLocal()
                try:
                    risk = Risk(
                        entity_id=entity_id,
                        entity_type=entity_type,
                        risk_score=risk_score,
                        risk_level=risk_level,
                        features=features,
                        risk_factors=risk_factors,
                        source="fallback_stream",
                    )
                    db.add(risk)
                    db.commit()
                    db.refresh(risk)

                    create_audit_log(
                        db=db,
                        user_id=None,
                        action="risk_assessed",
                        entity_type=entity_type,
                        entity_id=entity_id,
                        details={"risk_id": risk.id, "risk_score": risk_score},
                    )

                    if risk_level in ("high", "critical"):
                        AlertService.create_alert_for_risk(db, risk)

                    if self.websocket_manager:
                        msg = {
                            "type": "risk_update",
                            "data": {
                                "id": risk.id,
                                "entity_id": entity_id,
                                "entity_type": entity_type,
                                "risk_score": risk_score,
                                "risk_level": risk_level,
                                "confidence": features.get("reputation", 0.85),
                                "features": features,
                                "risk_factors": risk_factors,
                                "source": "fallback_stream",
                                "timestamp": (
                                    risk.created_at.isoformat()
                                    if risk.created_at
                                    else datetime.utcnow().isoformat()
                                ),
                            },
                        }
                        loop = self._main_loop
                        if loop and loop.is_running():
                            asyncio.run_coroutine_threadsafe(
                                self.websocket_manager.broadcast(msg), loop
                            )

                    self.events_processed += 1
                finally:
                    db.close()

            except Exception as exc:
                self.errors_count += 1
                logger.error("Fallback pipeline error: %s", exc, exc_info=True)

        def start_simulation(self, interval: float = 3.0):
            """
            Blocking event-generation loop.

            Runs in a daemon thread (started by app/main.py).
            Calls generate_event() → _process_event() every `interval` seconds,
            using threading.Event.wait() so stop() can interrupt it immediately.
            """
            self.is_running = True
            self._stop_event.clear()

            if self._main_loop is None:
                logger.warning(
                    "No event loop registered — WebSocket broadcasts will be skipped. "
                    "Call set_event_loop() from the FastAPI lifespan before starting."
                )

            logger.info("▶ Fallback streaming engine active (tick=%.1fs)", interval)

            while not self._stop_event.is_set():
                try:
                    event = self.simulator.generate_event()
                    self._process_event(event)
                except Exception as exc:
                    self.errors_count += 1
                    logger.error("Event generation error: %s", exc)

                self._stop_event.wait(interval)

            self.is_running = False
            logger.info(
                "Fallback pipeline stopped. events=%d errors=%d",
                self.events_processed,
                self.errors_count,
            )

        def stop(self):
            self._stop_event.set()
            self.is_running = False

        def get_stats(self) -> Dict[str, Any]:
            return {
                "is_running": self.is_running,
                "events_processed": self.events_processed,
                "errors_count": self.errors_count,
                "error_rate": self.errors_count / max(self.events_processed, 1),
                "engine": "threading_fallback",
                "pathway_version": None,
            }


# ── Global singleton ─────────────────────────────────────────────────────────
pathway_pipeline = PathwayPipeline()
