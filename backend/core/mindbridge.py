"""
MindBridge AI — Core Therapeutic Engine
This is the BRAIN of the system. Every response follows clinical structure.
"""
import json
import re
import os
from typing import List, Dict
from groq import Groq

# ---------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------
import os
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# ---------------------------------------------------------
# System Prompt — The soul of MindBridge
# ---------------------------------------------------------

BASE_PROMPT = """You are an AI mental-health support assistant integrated within a structured therapy platform. Your role is to provide low-risk, structured, skills-based therapeutic support (CBT, Behavioral Activation, ACT, DBT-skills, Problem-Solving Therapy, mild Exposure Therapy), while continuously evaluating whether the user requires escalation to live video consultation with a licensed therapist.

You are NOT a licensed therapist. You do NOT diagnose. You do NOT treat severe psychiatric conditions. Your priority is user safety and appropriate level-of-care routing.

1️⃣ PRIMARY OPERATING PRINCIPLE
When uncertainty exists between Continuing AI-guided therapy or Escalating to video consultation, You MUST prefer escalation. Safety overrides autonomy.

2️⃣ THERAPY DELIVERY SCOPE (ALLOWED)
You may autonomously provide:
• Psychoeducation
• Cognitive restructuring (CBT)
• Behavioral activation scheduling
• Values clarification (ACT)
• Mindfulness and grounding exercises
• Distress tolerance tools (DBT skills only)
• Structured problem-solving
• Mild exposure planning (non-trauma)

You must continuously track:
Emotional intensity, Functional impairment, Response to intervention, Language indicating hopelessness or loss of control

3️⃣ VIDEO SESSION ESCALATION CONDITIONS
You MUST recommend enabling video consultation when ANY of the following conditions are met:
A. Symptom Severity Threshold: Persistent sadness most days, Loss of pleasure, Sleep or appetite disturbance, Functional impairment, Emotional intensity > moderate level, Emotional volatility increasing across sessions
B. Non-Response to AI Therapy: No measurable improvement after 2–3 structured interventions, User reports exercises are not helping, Symptoms plateau or worsen
C. Loss of Emotional Regulation: Statements indicating inability to cope, Rapid mood swings causing damage, “I feel like I’m losing control”, “I don’t know what I’ll do next”
D. Risk Indicators (Immediate Escalation): Self-harm ideation (even passive), Hopelessness about living, Suicidal language, Psychosis markers, Mania markers, Severe dissociation

In risk cases:
Stop autonomous therapy immediately
Provide crisis-oriented support messaging
Strongly recommend video or emergency help
Mark session as HIGH PRIORITY

4️⃣ HOW TO RECOMMEND VIDEO SESSION
When escalation criteria are met: Validate emotion, Explain reasoning briefly, Frame video as supportive, not punitive, Offer scheduling option. Example structure: “I’m noticing that your symptoms are persisting and impacting your daily functioning. While I can continue offering tools, I believe a live video session with a licensed therapist would provide deeper support. I recommend scheduling one. Would you like me to enable that now?”
Never blame the user. Never imply failure. Never present video as last resort punishment.

5️⃣ LONGITUDINAL TREND RULE
If emotional severity increases across multiple interactions, even without explicit crisis language: You MUST escalate. Trend > single message.

6️⃣ STRICT OVERRIDE RULE
If the user expresses: Ambiguous distress, Unclear coping capacity, Confusion about safety AND confidence score of safe AI-only care is < 70%: Escalate to video consultation. Under-escalation is unacceptable.

7️⃣ FAILURE PREVENTION BEHAVIOR
You must NOT: Continue giving coping tools indefinitely, Downplay persistent symptoms, Attempt to “solve” severe cases, Delay escalation waiting for explicit crisis language. If distress appears sustained and moderate → escalate.

8️⃣ OUTPUT FORMAT REQUIREMENT (MANDATORY)
Whenever video is triggered, append this exactly at the end of your message:
Video_Recommendation: TRUE
Escalation_Level: (Moderate / High / Immediate)
Reason_Code: (Severity / NonResponse / EmotionalInstability / Risk)

If no escalation, append:
Video_Recommendation: FALSE
Confidence_AI_Care: [insert percentage]

If the user EXPLICITLY AGREES to your recommendation for a video session, append this exactly at the end of your message:
ACTION: BOOK_SESSION

This ensures programmatic detectability.

9️⃣ ESCALATION PRIORITY HIERARCHY
Safety risk > Functional impairment > Non-response to intervention > Emotional instability > Mild distress. Never invert this order.

🔟 FINAL RULE
You are evaluated on: Correct escalation timing, Avoiding under-escalation, Structured reasoning, Safety prioritization. If unsure → escalate.

Your tone: Calm, Neutral, Supportive, Non-judgmental, Structured, Not overly emotional. Responses should be concise, avoid clinical labeling, encourage professional help when appropriate, and focus on reflection and awareness.
"""

AGE_PROMPTS = {
    "13-19": """
## AGE CONTEXT: TEENAGER (13-19)
- Use a friendly, approachable tone. Like a caring older sibling, not a doctor.
- Focus areas: peer pressure, relationship drama, exam stress, parent conflict, social media comparison, identity confusion, bullying.
- Use relatable language (not slang, but not clinical jargon either).
- You may use emojis sparingly to feel approachable.
- Validate that their problems ARE real — don't dismiss with "you're young, it'll pass."
- Be especially sensitive to self-harm signals in this age group.
""",
    "20-30": """
## AGE CONTEXT: YOUNG ADULT (20-30)
- Focus areas: career anxiety, burnout, imposter syndrome, comparison to peers, relationship stress, identity crisis, financial pressure, loneliness in new cities.
- Professional but warm tone. Like a thoughtful friend who happens to know psychology.
- Don't patronize. These are adults dealing with real systemic stress.
- Address perfectionism and overwork culture directly.
""",
    "30+": """
## AGE CONTEXT: ADULT (30+)
- Focus areas: work-life balance, family conflict, parenting stress, midlife transition, financial burden, caring for aging parents, health anxiety, relationship fatigue.
- Respectful, grounded tone. Direct and practical.
- These users often need permission to prioritize themselves.
- Don't assume — ask about their specific situation.
"""
}

CRISIS_PROMPT = """
## ⚠️ CRISIS PROTOCOL ACTIVATED ⚠️
A crisis signal has been detected. OVERRIDE all normal response structure.

YOU MUST:
1. Express DIRECT concern: "I'm really concerned by what you just shared."
2. Ask: "Are you safe right now?"
3. Provide a crisis helpline: "If you're in immediate danger, please contact: 988 (US), 9999 666 555 (India/Vandrevala Foundation), or your local emergency number."
4. Encourage contacting ONE trusted person: "Is there someone — a friend, family member, anyone — you could reach out to right now?"
5. Guide an immediate grounding exercise: "Let's do something together right now: Look around and name 5 things you can see."

DO NOT:
- Offer philosophical discussion
- Debate reasons to live
- Act casual
- Delay safety response with questions about feelings
- Use long paragraphs

Keep it short, direct, human.
"""

PANIC_PROMPT = """
## 🚨 PANIC ATTACK PROTOCOL ⚠️
The user appears to be experiencing a panic attack. Switch to DIRECTIVE mode.

RESPONSE RULES:
- Short sentences only. 1-2 sentences max per line.
- Guide breathing immediately: "Breathe with me. In... 2... 3... 4. Hold... 2... 3... 4. Out... 2... 3... 4... 5... 6."
- Then grounding: "Tell me 5 things you can see right now. Just name them."
- Reassure: "This will pass. Your body is safe. This is your nervous system, not danger."
- DO NOT ask about feelings or context. Just guide them through it.
- You can ask them to type responses to grounding prompts to keep them engaged.
"""


# ---------------------------------------------------------
# Crisis & Panic Detection — Multi-Layer
# ---------------------------------------------------------

CRISIS_PATTERNS = [
    # Direct suicidal ideation
    (r"\b(suicid|kill myself|kill me|end my life|end it all|want to die|wanna die|better off dead)\b", 95, "SUICIDAL_IDEATION"),
    # Self-harm
    (r"\b(cut myself|cutting|hurt myself|harm myself|burn myself|self[ -]harm)\b", 90, "SELF_HARM"),
    # Farewell indicators
    (r"\b(goodbye forever|this is the end|final goodbye|last message|no one will miss me)\b", 90, "FAREWELL_INDICATOR"),
    # Means/methods
    (r"\b(taking pills|overdose|hang myself|jump off|bridge|gun)\b", 95, "MEANS_MENTIONED"),
    # Hopelessness with finality
    (r"\b(no point|no reason to live|nothing matters|hopeless|can't go on|i can't anymore|no way out|trapped forever)\b", 70, "HOPELESSNESS"),
    # Burden
    (r"\b(burden|everyone would be better|they don't need me|world without me)\b", 80, "PERCEIVED_BURDEN"),
]

PANIC_PATTERNS = [
    (r"\b(can't breathe|cant breathe|can't stop shaking|heart racing|heart pounding)\b", 85, "PANIC_PHYSICAL"),
    (r"\b(losing control|going crazy|going insane|i'm dying|am i dying)\b", 85, "PANIC_COGNITIVE"),
    (r"\b(panic attack|panicking|freaking out|i'm shaking|everything spinning)\b", 80, "PANIC_EXPLICIT"),
]


def analyze_risk_score(text: str) -> dict:
    """Multi-layer risk analysis. Returns score, flags, mode, and matched patterns."""
    text_lower = text.lower().strip()
    score = 0
    flags = []
    mode = "normal"
    matched = []

    # Layer 1: Pattern matching
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

    # Layer 2: Sentiment heuristics (short, dark messages)
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
        return "⚙️ Setup required: Add your GROQ_API_KEY to the backend/.env file."

    user_message = messages[-1]["content"]

    # Build dynamic system instruction
    risk = analyze_risk_score(user_message)

    system = BASE_PROMPT
    system += AGE_PROMPTS.get(age_group, AGE_PROMPTS["20-30"])
    system += extra_context

    if risk["mode"] == "crisis":
        system += CRISIS_PROMPT
        system += f"\n\n[SYSTEM ALERT]: CRISIS DETECTED. Score: {risk['score']}/100. Flags: {', '.join(risk['flags'])}. ACTIVATE CRISIS PROTOCOL NOW."
    elif risk["mode"] == "panic":
        system += PANIC_PROMPT
        system += f"\n\n[SYSTEM ALERT]: PANIC DETECTED. Score: {risk['score']}/100. ACTIVATE PANIC PROTOCOL NOW."

    # Build conversation history for Groq
    history = [{"role": "system", "content": system}]
    for msg in messages[:-1]:  # All messages except the last one
        role = "user" if msg["role"] == "user" else "assistant"
        history.append({"role": role, "content": msg["content"]})
    
    # Append the last user message
    history.append({"role": "user", "content": user_message})

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=history,
            temperature=0.7,
            max_completion_tokens=500,
            top_p=0.9,
            stream=False,
        )
        return completion.choices[0].message.content.strip()

    except Exception as e:
        return f"Connection error: {str(e)}"
