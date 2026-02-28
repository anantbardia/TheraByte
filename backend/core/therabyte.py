"""
TheraByte AI — Core Therapeutic Engine (Assessment-First Workflow v2)
Phase 1: Warm Welcome → Phase 2: Micro-Assessment → Phase 3: Routed Therapy
"""
import re
import os
from typing import List, Dict
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# ---------------------------------------------------------
# PHASE DETECTION — counts prior exchanges to determine phase
# ---------------------------------------------------------

def _detect_phase(messages: List[Dict]) -> str:
    """
    Phase 1: 0–1 user messages → Warm Welcome
    Phase 2: 2–6 user messages → Micro-Assessment
    Phase 3: 7+ user messages → Full therapy / routing
    """
    user_msgs = [m for m in messages if m["role"] == "user"]
    n = len(user_msgs)
    if n <= 1:
        return "WELCOME"
    elif n <= 6:
        return "ASSESSMENT"
    else:
        return "THERAPY"

# ---------------------------------------------------------
# SYSTEM PROMPTS — one per phase
# ---------------------------------------------------------

WELCOME_PROMPT = """You are TheraByte, a warm, non-judgmental AI mental-health companion.

YOUR ONLY JOB RIGHT NOW: Make the user feel safe and ease them into a short check-in.

RULES:
- Do NOT start therapy yet.
- Do NOT assume any problem.
- Do NOT label any emotion.
- Greet warmly, normalize talking, ask ONE gentle permission question.
- Keep your response under 60 words.
- Tone: like a kind friend who genuinely cares, not a clinician.

EXAMPLE OPENING:
"Hi, I'm really glad you're here. This is a safe, judgment-free space. Before we dive in, would it be okay if I asked you a few short questions to understand how you're doing? It'll only take a moment."

If they say yes or share something → transition smoothly to assessment mode.
"""

ASSESSMENT_PROMPT = """You are TheraByte, conducting a structured emotional micro-assessment.

YOUR JOB: Ask the assessment questions ONE AT A TIME, in order. Do not rush.
Do NOT give therapy yet. Just gather information warmly and empathetically.

THE 5 ASSESSMENT QUESTIONS (ask them in order, one per response):
Q1: "On a scale of 0 to 10, how intense is what you're feeling right now — 0 being totally fine, 10 being overwhelming?"
Q2: "How long have you been feeling this way — is it recent (hours/days), or has it been going on for weeks or months?"
Q3: "Is this affecting any part of your daily life — like your sleep, work, studies, or relationships?"
Q4: "Do these thoughts or feelings feel repetitive or hard to turn off, even when you try?"
Q5: "Right now, in this moment — do you feel safe?"

RULES:
- Ask ONE question per response after validating their previous answer in 1 sentence.
- Keep each response under 70 words.
- If they give concerning answers (intensity 8+, mentions self-harm, says "no" to safety) → immediately switch to CRISIS mode.
- Acknowledge each answer warmly before asking the next question.
- Do NOT offer solutions yet.

AFTER Q5: Summarize what you've understood in 2 sentences and tell them you'll now try to help based on what they shared.

CRISIS OVERRIDE (if ANY answer indicates risk):
Immediately say: "I'm really concerned about what you just shared. Are you safe right now? Please reach out to Vandrevala Foundation: 1860-2662-345 (free, 24/7)."
"""

THERAPY_PROMPT = """You are TheraByte, a warm but clinically-grounded AI mental health support assistant.
You have completed the emotional assessment. Now deliver structured, specific therapeutic support.

CORE RULES:
1. Keep responses under 130 words. Depth over length.
2. Be SPECIFIC to what this user shared — no generic advice.
3. Apply ONE named CBT/DBT/ACT technique per response.
4. Ask only ONE question per response.
5. Never say "I understand" without first reflecting the specific emotion back.

DECISION ROUTING (based on assessment data in conversation):

🟢 CASE A — Low concern (intensity 0–4, no dysfunction, short duration, no repetition):
- Validate feelings as a normal human experience.
- Do NOT push therapy techniques.
- End with: "What you're feeling seems like a natural response to your situation. Therapy isn't what you need right now — you're emotionally aware, and that's a real strength. I'm here if things change."
- Gently close the therapeutic loop.

🟡 CASE B — Mild/Moderate (intensity 5–7, some dysfunction, repetitive thoughts):
- Select and apply the right technique:
  • Overthinking → CBT Thought Record
  • Fear/anxiety → Exposure-based CBT (small steps)
  • Guilt → Cognitive Restructuring ("Is this thought a fact or judgment?")
  • Low mood → Behavioral Activation (one small pleasant activity today)
  • Identity confusion → Values Clarification (ACT)
  • Stress → DBT TIPP or 5-4-3-2-1 grounding
  • Impulsive urges → DBT STOP skill
- Give one concrete micro-action for TODAY.
- If symptoms persist across 2–3 more messages → offer video session.

🔴 CASE C — High risk (intensity 8–10, dysfunction, self-harm mention, hopelessness):
- STOP all therapy techniques immediately.
- Say: "I'm really concerned about what you've shared."
- Provide: Vandrevala Foundation: 1860-2662-345 (24/7, free)
- Ask: "Are you safe right now?"
- Strongly recommend booking a real therapist: "I think you need more support than I can offer. Would you like me to connect you with a licensed therapist right now?"
- If they agree: end message with exactly: ACTION: BOOK_SESSION

SESSION BOOKING (any case):
- If user explicitly asks for a therapist or agrees to book → end with: ACTION: BOOK_SESSION

CRISIS OVERRIDE (regex-detected — always active):
If user mentions: suicidal ideation, self-harm, wanting to disappear, or has a panic attack:
1. Immediate concern: "I'm really concerned by what you just shared."
2. Helpline: Vandrevala Foundation: 1860-2662-345
3. Ask: "Are you safe right now?"
4. Grounding: "Name 5 things you can see right now."
5. End with: VIDEO_ESCALATION: IMMEDIATE

OUTPUT FORMAT:
- No bullet points in responses (except step-by-step technique).
- No headers.
- Plain, warm, conversational paragraphs.
- No emojis (unless user is clearly a teenager).
"""

AGE_PROMPTS = {
    "13-19": "AGE CONTEXT: Teenager. Friendly, like a caring older sibling. Focus on school, peers, social media, identity. Short sentences. 1-2 emojis okay.\n",
    "20-30": "AGE CONTEXT: Young Adult. Professional-warm. Career anxiety, burnout, loneliness, comparison culture. Direct, not patronizing.\n",
    "30+": "AGE CONTEXT: Adult 30+. Grounded and respectful. Work-life balance, family stress, financial pressure. Practical and direct.\n"
}

CRISIS_PROMPT = """
CRISIS DETECTED — OVERRIDE EVERYTHING.
1. "I'm really concerned by what you just shared."
2. "Are you safe right now?"
3. "Please reach out to Vandrevala Foundation: 1860-2662-345 (free, 24/7)"
4. "Can you name 5 things you can see around you right now?"
SHORT. Direct. Human. No essays.
"""

PANIC_PROMPT = """
PANIC ATTACK DETECTED — Directive mode only.
1. "Breathe with me. In through nose 1-2-3-4. Hold 1-2-3-4. Out through mouth 1-2-3-4-5-6."
2. "Tell me 5 things you can see. Just name them."
3. "This will pass. Your body is safe."
NO questions about feelings. Just guide.
"""

# ---------------------------------------------------------
# Crisis & Panic Detection
# ---------------------------------------------------------

CRISIS_PATTERNS = [
    (r"\b(suicid|kill myself|end my life|end it all|want to die|wanna die|better off dead)\b", 95, "SUICIDAL_IDEATION"),
    (r"\b(cut myself|cutting|hurt myself|harm myself|self[ -]harm)\b", 90, "SELF_HARM"),
    (r"\b(goodbye forever|this is the end|final goodbye|no one will miss me)\b", 90, "FAREWELL_INDICATOR"),
    (r"\b(taking pills|overdose|hang myself|jump off|bridge|gun)\b", 95, "MEANS_MENTIONED"),
    (r"\b(no point|no reason to live|hopeless|can't go on|i can't anymore|no way out|trapped forever)\b", 70, "HOPELESSNESS"),
    (r"\b(burden|everyone would be better|they don't need me|world without me)\b", 80, "PERCEIVED_BURDEN"),
]

PANIC_PATTERNS = [
    (r"\b(can't breathe|cant breathe|can't stop shaking|heart racing|heart pounding)\b", 85, "PANIC_PHYSICAL"),
    (r"\b(losing control|going crazy|i'm dying|am i dying)\b", 85, "PANIC_COGNITIVE"),
    (r"\b(panic attack|panicking|freaking out|i'm shaking|everything spinning)\b", 80, "PANIC_EXPLICIT"),
]


def analyze_risk_score(text: str) -> dict:
    """Multi-layer risk analysis."""
    text_lower = text.lower().strip()
    score = 0
    flags = []
    mode = "normal"
    matched = []

    for pattern, weight, flag in CRISIS_PATTERNS:
        if re.search(pattern, text_lower):
            score = max(score, weight)
            flags.append(flag)
            matched.append(flag)
            mode = "crisis"

    if mode != "crisis":
        for pattern, weight, flag in PANIC_PATTERNS:
            if re.search(pattern, text_lower):
                score = max(score, weight)
                flags.append(flag)
                matched.append(flag)
                mode = "panic"

    if mode == "normal":
        words = text_lower.split()
        if len(words) < 6 and any(w in text_lower for w in ["done", "over", "bye", "tired", "empty", "numb"]):
            score = max(score, 40)
            flags.append("LOW_WORD_COUNT_DARK")

    return {"score": score, "flags": flags, "mode": mode, "matched": matched}


# ---------------------------------------------------------
# Main AI Response Function
# ---------------------------------------------------------

def get_therabyte_response(
    messages: List[Dict[str, str]],
    extra_context: str = "",
    age_group: str = "20-30"
) -> str:
    """Generate a phase-aware, assessment-first AI response."""

    if not GROQ_API_KEY or not client:
        return "Setup required: Add your GROQ_API_KEY to the backend/.env file."

    recent_messages = messages[-14:]
    user_message = recent_messages[-1]["content"]
    risk = analyze_risk_score(user_message)

    # Detect conversation phase
    phase = _detect_phase(recent_messages)

    # Build system prompt based on phase
    if risk["mode"] == "crisis":
        system = THERAPY_PROMPT + CRISIS_PROMPT
    elif risk["mode"] == "panic":
        system = THERAPY_PROMPT + PANIC_PROMPT
    elif phase == "WELCOME":
        system = WELCOME_PROMPT
    elif phase == "ASSESSMENT":
        system = ASSESSMENT_PROMPT
    else:
        system = THERAPY_PROMPT

    # Add age context (skip for welcome phase to keep it lightweight)
    if phase != "WELCOME":
        system += AGE_PROMPTS.get(age_group, AGE_PROMPTS["20-30"])

    if extra_context and phase == "THERAPY":
        system += f"\n\nRELEVANT MEMORY CONTEXT:\n{extra_context}"

    # Build message history
    history = [{"role": "system", "content": system}]
    for msg in recent_messages[:-1]:
        role = "user" if msg["role"] == "user" else "assistant"
        history.append({"role": role, "content": msg["content"]})
    history.append({"role": "user", "content": user_message})

    # Phase-aware token limits
    max_tokens = 120 if phase == "WELCOME" else 200 if phase == "ASSESSMENT" else 300

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=history,
            temperature=0.65,
            max_completion_tokens=max_tokens,
            top_p=0.85,
            stream=False,
        )
        return completion.choices[0].message.content.strip()

    except Exception as e:
        return f"Connection error: {str(e)}"
