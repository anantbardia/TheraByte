"""
TheraByte AI — LangGraph Pipeline
====================================
Replaces the linear chat pipeline in main.py with a stateful directed graph.
Each node has a single responsibility. The conditional risk_router decides which
therapeutic branch to take, keeping crisis/panic/normal logic cleanly separated.

Graph topology:
  ml_analysis → risk_scoring → [risk_router]
                                ├─ crisis ──→ build_context → generate_response → logging
                                ├─ panic  ──→ build_context → generate_response → logging
                                └─ normal ──→ sentiment_enrichment → build_context → generate_response → logging

All nodes receive the full TheraByteState and return a (partial) update dict.
LangGraph merges these updates automatically.
"""

import sys
import os
import logging

# Ensure the backend root is importable regardless of how the module is loaded
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from typing import Literal
from langgraph.graph import StateGraph, END

from core.graph_state import TheraByteState
from core.therabyte import analyze_risk_score, get_therabyte_response
import ml_inference
import database
import api_services
from core import memory

logger = logging.getLogger("therabyte.graph")


# ══════════════════════════════════════════════════════════════
# NODE 1 — ML Analysis (Layer 1: Custom local models)
# Runs all 3 sklearn models instantly — no API required.
# ══════════════════════════════════════════════════════════════

def ml_analysis_node(state: TheraByteState) -> dict:
    """Run all 3 custom ML models on the user's message."""
    logger.info("[graph] ml_analysis_node running")
    analysis = ml_inference.analyze_message(state["user_text"])
    return {
        "ml_crisis":     analysis["crisis"],
        "ml_emotion":    analysis["emotion"],
        "ml_distortions": analysis["distortions"],
    }


# ══════════════════════════════════════════════════════════════
# NODE 2 — Risk Scoring (Layer 2: Regex safety net)
# Combines ML probability scores with regex pattern matching.
# Always takes the HIGHER risk score from either source.
# ══════════════════════════════════════════════════════════════

def risk_scoring_node(state: TheraByteState) -> dict:
    """Merge ML and regex risk scores. Determine final mode + flags."""
    logger.info("[graph] risk_scoring_node running")
    regex_risk = analyze_risk_score(state["user_text"])
    ml_crisis   = state["ml_crisis"]

    # Use max risk from either source (safety-first)
    combined_score = max(ml_crisis.get("risk_score", 0), regex_risk["score"])

    # Mode priority: crisis > panic > normal
    if combined_score >= 80 or ml_crisis.get("is_crisis", False):
        mode = "crisis"
    elif regex_risk["mode"] == "panic":
        mode = "panic"
    else:
        mode = "normal"

    # Merge flags from both sources
    ml_flags    = ["ML_CRISIS_DETECTED"] if ml_crisis.get("is_crisis", False) else []
    flags       = list(set(regex_risk["flags"] + ml_flags))

    logger.info(f"[graph] Risk → score={combined_score}, mode={mode}, flags={flags}")

    return {
        "regex_risk":          regex_risk,
        "combined_risk_score": combined_score,
        "combined_mode":       mode,
        "combined_flags":      flags,
    }


# ══════════════════════════════════════════════════════════════
# CONDITIONAL EDGE — Risk Router
# Directs the graph flow based on the detected risk level.
# ══════════════════════════════════════════════════════════════

def risk_router(state: TheraByteState) -> Literal["crisis", "panic", "normal"]:
    """Return which branch to take based on combined_mode."""
    return state["combined_mode"]  # type: ignore[return-value]


# ══════════════════════════════════════════════════════════════
# NODE 3 — Sentiment Enrichment (normal path only)
# Calls the Gemini sentiment API only when it adds value —
# i.e., when the ML model detects a notable non-hope emotion.
# Skipped entirely for crisis/panic (speed + simplicity).
# ══════════════════════════════════════════════════════════════

def sentiment_enrichment_node(state: TheraByteState) -> dict:
    """Conditionally enrich with Gemini sentiment (normal path only)."""
    logger.info("[graph] sentiment_enrichment_node running")
    ml_emotion = state["ml_emotion"]
    sentiment  = {}

    # Only worth calling if model detected a strong, actionable emotion
    if (
        ml_emotion.get("emotion") != "hope"
        and ml_emotion.get("confidence", 0) > 0.3
        and ml_emotion.get("model") != "unavailable"
    ):
        try:
            sentiment = api_services.analyze_sentiment(state["user_text"])
            logger.info(f"[graph] Gemini sentiment: {sentiment.get('primary_emotion')}")
        except Exception as e:
            logger.warning(f"[graph] Sentiment enrichment failed (non-fatal): {e}")

    return {"gemini_sentiment": sentiment}


# ══════════════════════════════════════════════════════════════
# NODE 4 — Context Builder
# Assembles the extra_context string injected into the LLM prompt.
# Pulls from: user profile (DB), ML analysis, Gemini sentiment.
# Also pre-loads the user profile to avoid a duplicate DB call later.
# ══════════════════════════════════════════════════════════════

def build_context_node(state: TheraByteState) -> dict:
    """Assemble the extra_context string and load user profile."""
    logger.info("[graph] build_context_node running")
    profile = database.get_profile(state["user_id"])
    extra   = ""

    # ── User psychological profile ──
    if profile and any([profile.get("trigger_themes"), profile.get("cognitive_distortions")]):
        extra += (
            f"\n[USER PROFILE]: Known triggers: {profile.get('trigger_themes', [])}. "
            f"Known distortions: {profile.get('cognitive_distortions', [])}. "
            f"Effective interventions: {profile.get('effective_interventions', [])}."
        )

    # ── ML model insights ──
    ml_emotion     = state["ml_emotion"]
    ml_distortions = state["ml_distortions"]
    if ml_emotion.get("model") != "unavailable":
        extra += (
            f"\n[ML ANALYSIS]: Detected emotion: {ml_emotion['emotion']} "
            f"(confidence: {ml_emotion['confidence']:.0%})."
        )

    if ml_distortions.get("distortions"):
        extra += f" Cognitive distortions: {ml_distortions['distortions']}."

    # ── Crisis/Panic severity hint ──
    if state["combined_mode"] != "normal":
        extra += (
            f"\n[RISK ALERT]: Mode={state['combined_mode'].upper()}, "
            f"Score={state['combined_risk_score']}/100, "
            f"Flags={state['combined_flags']}."
        )

    # ── Gemini sentiment enrichment (normal path only) ──
    sentiment = state.get("gemini_sentiment") or {}
    if sentiment.get("underlying_need"):
        extra += f" Underlying need: {sentiment['underlying_need']}."
    if sentiment.get("primary_emotion"):
        extra += (
            f" Gemini sentiment: {sentiment['primary_emotion']} "
            f"(intensity {sentiment.get('intensity', 0)}/10)."
        )

    # ── ChromaDB Conversational Memory ──
    past_memories = memory.retrieve_relevant_memories(state["user_id"], state["user_text"])
    if past_memories:
        extra += f"\n\n[PAST RELEVANT CONTEXT from User]:\n{past_memories}\nUse this context ONLY if relevant to the current conversation."

    return {
        "extra_context": extra,
        "user_profile":  profile,
        "routing_path":  state["combined_mode"],
    }


# ══════════════════════════════════════════════════════════════
# NODE 5 — Therapeutic Response Generation (Layer 3: Gemini LLM)
# The core LLM call. Receives the fully-enriched context and
# generates a clinically-structured therapeutic response.
# ══════════════════════════════════════════════════════════════

def response_node(state: TheraByteState) -> dict:
    """Generate the final therapeutic response using Gemini."""
    logger.info(f"[graph] response_node running (path={state.get('combined_mode')})")
    content = get_therabyte_response(
        messages=state["messages"],
        extra_context=state["extra_context"],
        age_group=state.get("age_group", "20-30"),
    )
    logger.info("[graph] response_node done")
    return {"response_content": content}


# ══════════════════════════════════════════════════════════════
# NODE 6 — Logging & Profile Update
# Persists risk log, assistant message, and updated psych profile.
# Runs as the last node on ALL branches — single source of truth
# for persistence regardless of which path was taken.
# ══════════════════════════════════════════════════════════════

def logging_node(state: TheraByteState) -> dict:
    """Persist risk log, response, and updated cognitive distortion profile."""
    logger.info("[graph] logging_node running")

    # Log risk score + flags
    try:
        database.log_risk(
            state["user_id"],
            state["session_id"],
            state["combined_risk_score"],
            state["combined_flags"],
        )
    except Exception as e:
        logger.warning(f"[graph] log_risk failed (non-fatal): {e}")

    # Log assistant response
    try:
        database.log_message(state["session_id"], "assistant", state["response_content"])
    except Exception as e:
        logger.warning(f"[graph] log_message failed (non-fatal): {e}")

    # Auto-update psychological distortion profile
    try:
        profile     = state.get("user_profile")
        distortions = state["ml_distortions"].get("distortions", [])
        if distortions and profile is not None:
            existing = profile.get("cognitive_distortions", []) or []
            merged   = list(set(existing + distortions))[:10]  # cap at 10
            database.update_profile(state["user_id"], cognitive_distortions=merged)
            logger.info(f"[graph] Distortion profile updated: {merged}")
    except Exception as e:
        logger.warning(f"[graph] profile update failed (non-fatal): {e}")

    # Store memory into VectorDB
    try:
        memory.store_memory(state["user_id"], "user", state["user_text"])
        memory.store_memory(state["user_id"], "assistant", state["response_content"])
        logger.info("[graph] Saved conversation turn to ChromaDB memory")
    except Exception as e:
        logger.warning(f"[graph] memory storage failed (non-fatal): {e}")

    return {}


# ══════════════════════════════════════════════════════════════
# GRAPH ASSEMBLY
# ══════════════════════════════════════════════════════════════

def _build_graph() -> StateGraph:
    """
    Construct and compile the TheraByte LangGraph.

    Topology:
        ml_analysis
            ↓
        risk_scoring
            ↓
        [risk_router] ── crisis ──→ build_context
                      ── panic  ──→ build_context
                      ── normal ──→ sentiment_enrichment → build_context
                                                              ↓
                                                          generate_response
                                                              ↓
                                                           logging → END
    """
    g = StateGraph(TheraByteState)

    # Register all nodes
    g.add_node("ml_analysis",           ml_analysis_node)
    g.add_node("risk_scoring",          risk_scoring_node)
    g.add_node("sentiment_enrichment",  sentiment_enrichment_node)
    g.add_node("build_context",         build_context_node)
    g.add_node("generate_response",     response_node)
    g.add_node("logging",               logging_node)

    # Entry point
    g.set_entry_point("ml_analysis")

    # Linear edges
    g.add_edge("ml_analysis", "risk_scoring")

    # Conditional branching based on risk level
    g.add_conditional_edges(
        "risk_scoring",
        risk_router,
        {
            "crisis": "build_context",           # Skip sentiment — speed matters in crisis
            "panic":  "build_context",           # Skip sentiment — directive mode only
            "normal": "sentiment_enrichment",    # Enrich before building context
        },
    )

    # Normal path: after sentiment enrichment, build context
    g.add_edge("sentiment_enrichment", "build_context")

    # All paths converge here
    g.add_edge("build_context",     "generate_response")
    g.add_edge("generate_response", "logging")
    g.add_edge("logging",           END)

    return g.compile()


# ── Compiled singleton — imported by main.py ──
therabyte_graph = _build_graph()
