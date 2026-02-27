"""
TheraByte AI — LangGraph Shared State Definition
This TypedDict flows through every node in the graph,
carrying all data from input to final response.
"""
from typing import TypedDict, List, Dict, Any, Optional


class TheraByteState(TypedDict):
    # ── Input ──────────────────────────────────────────────
    messages: List[Dict[str, str]]    # Full conversation history
    user_id: str
    session_id: int
    age_group: str
    user_text: str                    # Shortcut to messages[-1]["content"]

    # ── Layer 1: Custom ML Model Outputs ───────────────────
    ml_crisis: Dict[str, Any]         # {is_crisis, confidence, risk_score, model}
    ml_emotion: Dict[str, Any]        # {emotion, confidence, all_probabilities, model}
    ml_distortions: Dict[str, Any]    # {distortions: [], model}

    # ── Layer 2: Risk Scoring ──────────────────────────────
    regex_risk: Dict[str, Any]        # {score, flags, mode, matched}
    combined_risk_score: int          # max(ml_crisis.risk_score, regex_risk.score)
    combined_mode: str                # "normal" | "crisis" | "panic"
    combined_flags: List[str]         # merged flags from both sources

    # ── Layer 3: Enrichment ────────────────────────────────
    gemini_sentiment: Dict[str, Any]  # {primary_emotion, intensity, underlying_need, ...}
    user_profile: Optional[Dict[str, Any]]  # DB profile (triggers, distortions, etc.)
    extra_context: str                # Assembled context string injected into LLM prompt

    # ── Output ─────────────────────────────────────────────
    response_content: str             # Final therapeutic response from Gemini
    routing_path: str                 # Audit trail: which branch was taken
