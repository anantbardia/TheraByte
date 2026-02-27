"""
MindBridge AI — Core Therapeutic Engine
This is the BRAIN of the system. Every response follows clinical structure.
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
# System Prompt — sharp, specific, brief
# ---------------------------------------------------------

BASE_PROMPT = """You are TheraByte, a warm but clinically-grounded AI mental health support assistant. You operate inside a platform where users can ALSO book live video sessions with licensed therapists.

CORE RULES (non-negotiable):
1. Keep responses under 120 words. Be concise. Depth over length.
2. DO NOT give generic advice. Be SPECIFIC to what the user just said.
3. Use actual CBT/DBT techniques by name and WALK THROUGH them step-by-step.
4. NEVER say "I understand how you feel" without first reflecting the specific emotion back.
5. Ask only ONE question per response.

RESPONSE PATTERN (always follow this):
→ Validate: Reflect the specific emotion/situation in 1 sentence.
→ Technique: Name and briefly apply ONE specific technique (CBT thought record, DBT TIPP, ACT defusion, grounding 5-4-3-2-1, behavioral activation, etc.)
→ Micro-action: Give one tiny, doable action for TODAY.
→ [Optional] If warranted: suggest a video session.

CBT TECHNIQUES TO USE (pick the right one):
- Thought record: situation → automatic thought → emotion → evidence for/against → balanced thought
- Behavioral activation: schedule ONE small pleasant activity today
- Cognitive restructuring: "Is this thought a fact or an interpretation?"
- Decatastrophizing: "What's the realistic worst case? How would you cope?"

DBT SKILLS TO USE:
- TIPP (Temperature, Intense exercise, Paced breathing, Paired muscle relaxation) for intense emotions
- STOP skill (Stop, Take a step back, Observe, Proceed mindfully) for impulsive urges
- Opposite action: identify the emotion urge → do the opposite
- Wise mind: check in between emotion mind and reasonable mind

ACT TECHNIQUES:
- Defusion: "Notice you're having the thought that..." (creates distance from thoughts)
- Values clarification: "What matters most to you here?"
- Acceptance: acknowledge the pain without trying to fix it immediately

SESSION BOOKING:
- You CAN offer to book a video session with a real therapist on this platform.
- When the user agrees to book, end your message EXACTLY with this line (no other text after):
  ACTION: BOOK_SESSION
- Only offer booking when: symptoms persist across 2+ messages, user asks for a therapist, or risk is moderate-high.
- When you recommend booking: be direct and warm. Example: "I think talking to one of our therapists through a video session would really help here. Would you like me to book one for you now?"

ESCALATION PROTOCOL (override everything):
- If user mentions: suicidal thoughts, self-harm, wanting to disappear, or acute panic:
  1. Express direct concern in 1 sentence.
  2. Give crisis helpline: Vandrevala Foundation: 1860-2662-345 (24/7)
  3. Ask: "Are you safe right now?"
  4. Guide: "Name 5 things you can see around you."
  5. End with: VIDEO_ESCALATION: IMMEDIATE

OUTPUT FORMAT:
- No bullet points unless listing a technique step-by-step.
- No headers.
- Plain, warm, conversational paragraphs.
- No emojis (unless user is clearly a teenager).
"""

AGE_PROMPTS = {
    "13-19": """
AGE: Teenager. Use a warm, friendly tone — like a caring older sibling. Focus on school stress, peer relationships, social media pressure, identity. Short sentences. You may use 1-2 emojis if it feels natural.
""",
    "20-30": """
AGE: Young Adult. Professional-warm. Focus on: career burnout, imposter syndrome, relationship stress, loneliness, comparison culture. Speak directly — no patronizing.
""",
    "30+": """
AGE: Adult. Grounded and respectful. Focus on: work-life balance, parenting stress, relationship fatigue, financial pressure. Practical and direct.
"""
}

CRISIS_PROMPT = """
CRISIS DETECTED. OVERRIDE EVERYTHING.
1. One sentence of direct concern: "I'm really concerned by what you just shared."
2. Ask: "Are you safe right now?"
3. Provide: "Please reach out to Vandrevala Foundation: 1860-2662-345 (free, 24/7)"
4. Say: "Can you name 5 things you can see around you right now?"
Keep it SHORT. No essays. Direct human language only.
"""

PANIC_PROMPT = """
PANIC ATTACK DETECTED. Directive mode only.
1. "Breathe with me. In through nose 1-2-3-4. Hold 1-2-3-4. Out through mouth 1-2-3-4-5-6."
2. "Tell me 5 things you can see. Just name them out loud or type them."
3. "This will pass. Your body is safe."
NO questions about feelings. Just guide through it.
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

def get_mindbridge_response(
    messages: List[Dict[str, str]],
    extra_context: str = "",
    age_group: str = "20-30"
) -> str:
    """Generate a therapeutically structured AI response."""

    if not GROQ_API_KEY or not client:
        return "Setup required: Add your GROQ_API_KEY to the backend/.env file."

    # Only use last 12 messages to avoid context bloat
    recent_messages = messages[-12:]
    user_message = recent_messages[-1]["content"]

    risk = analyze_risk_score(user_message)

    system = BASE_PROMPT
    system += AGE_PROMPTS.get(age_group, AGE_PROMPTS["20-30"])
    if extra_context:
        system += f"\n\nRELEVANT MEMORY CONTEXT:\n{extra_context}"

    if risk["mode"] == "crisis":
        system += CRISIS_PROMPT
    elif risk["mode"] == "panic":
        system += PANIC_PROMPT

    history = [{"role": "system", "content": system}]
    for msg in recent_messages[:-1]:
        role = "user" if msg["role"] == "user" else "assistant"
        history.append({"role": role, "content": msg["content"]})
    history.append({"role": "user", "content": user_message})

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=history,
            temperature=0.65,       # slightly more focused
            max_completion_tokens=280,  # enforces brevity
            top_p=0.85,
            stream=False,
        )
        return completion.choices[0].message.content.strip()

    except Exception as e:
        return f"Connection error: {str(e)}"
