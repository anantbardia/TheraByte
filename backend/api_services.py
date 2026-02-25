"""
MindBridge AI — Enhanced API Services
Every interaction is deeply AI-analyzed. AI is the superpower.
"""
import json
import requests
from datetime import datetime
from groq import Groq
from core.mindbridge import GROQ_API_KEY

if GROQ_API_KEY and GROQ_API_KEY != "YOUR_GROQ_API_KEY_HERE":
    client = Groq(api_key=GROQ_API_KEY)
else:
    client = None

# ═══════════════════════════════════════════════════════════
# 1. GEMINI — Deep Sentiment Analysis
# ═══════════════════════════════════════════════════════════

def analyze_sentiment(text: str) -> dict:
    try:
        if not client: raise Exception("Groq client not initialized")
        
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                "role": "system",
                "content": f"""Analyze the emotional sentiment of this text. Return ONLY valid JSON:
{{
  "sentiment": "positive|negative|neutral|mixed",
  "primary_emotion": "the dominant emotion",
  "emotions": ["list of all detected emotions"],
  "intensity": 1-10,
  "tone": "brief description of emotional tone",
  "energy_level": "low|medium|high",
  "underlying_need": "what this person might actually need right now"
}}

Text: "{text}"
"""
            }],
            temperature=0.1,
            max_completion_tokens=300,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content.strip())
    except:
        return {"sentiment": "unknown", "emotions": [], "intensity": 0, "tone": "analysis unavailable", "primary_emotion": "unknown", "energy_level": "unknown", "underlying_need": ""}


# ═══════════════════════════════════════════════════════════
# 2. GEMINI — Cognitive Distortion Detection
# ═══════════════════════════════════════════════════════════

def detect_distortions(text: str) -> dict:
    try:
        if not client: raise Exception("Groq client not initialized")

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                "role": "system",
                "content": f"""Analyze this text for cognitive distortions (CBT framework). Return ONLY valid JSON:
{{
  "distortions_found": ["list of distortion names"],
  "confidence": 0.0-1.0,
  "explanation": "brief explanation of each distortion found",
  "reframe_suggestion": "how to gently reframe the thinking"
}}

Text: "{text}"
"""
            }],
            temperature=0.1,
            max_completion_tokens=400,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content.strip())
    except:
        return {"distortions_found": [], "confidence": 0, "explanation": "", "reframe_suggestion": ""}


# ═══════════════════════════════════════════════════════════
# 3. GEMINI — Session Summary Generator
# ═══════════════════════════════════════════════════════════

def generate_session_summary(messages: list) -> dict:
    try:
        if not client: raise Exception("Groq client not initialized")
        
        conversation = "\n".join([f"{m['role']}: {m['content']}" for m in messages[-20:]])
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                "role": "system",
                "content": f"""You are a clinical intake summarizer. Generate a professional clinical summary. Return ONLY valid JSON:
{{
  "chief_concern": "primary issue",
  "emotional_state": "overall emotional assessment",
  "risk_level": "low|moderate|high|critical",
  "key_themes": ["themes"],
  "distortions_observed": ["distortions"],
  "recommended_focus": "therapy focus area",
  "brief_narrative": "2-3 sentence clinical narrative",
  "suggested_interventions": ["specific therapeutic interventions"]
}}

Session:
{conversation}
"""
            }],
            temperature=0.2,
            max_completion_tokens=600,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content.strip())
    except Exception as e:
        return {"chief_concern": "Unable to generate", "error": str(e)}


# ═══════════════════════════════════════════════════════════
# 4. GEMINI — AI Insights for User Profile
# ═══════════════════════════════════════════════════════════

def generate_ai_insights(profile: dict, mood_history: list, risk_history: list) -> dict:
    """Generate personalized AI insights based on user's psychological profile and data."""
    try:
        # Calculate real mood shift
        mood_values = {'Sad': -2, 'Anxious': -1, 'Neutral': 0, 'Calm': 1, 'Joyful': 2}
        avg_shift = 0
        trend = "Stable"
        
        recent_moods = [m for m in mood_history if m.get('label') in mood_values]
        if len(recent_moods) >= 2:
            # Sort chronologically to compare oldest to newest in the window
            recent_moods.sort(key=lambda x: x.get('time', ''))
            old_mood = mood_values[recent_moods[0]['label']]
            new_mood = mood_values[recent_moods[-1]['label']]
            
            # Simple percentage calculation based on a -2 to +2 scale (range of 4)
            shift_val = new_mood - old_mood
            avg_shift = int((shift_val / 4.0) * 100)
            
            if avg_shift > 0:
                trend = "Upward"
            elif avg_shift < 0:
                trend = "Downward"

        if not client: raise Exception("Groq client not initialized")
        
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                "role": "system",
                "content": f"""You are a clinical AI analyzing a patient's psychological profile data. Generate personalized insights. Return ONLY valid JSON:
{{
  "overall_assessment": "2-3 sentence overall mental health assessment",
  "patterns_detected": ["list of behavioral/emotional patterns noticed"],
  "strengths_observed": ["positive coping mechanisms or strengths"],
  "areas_of_concern": ["areas that need attention"],
  "personalized_recommendations": ["3-5 specific actionable recommendations"],
  "therapeutic_approach": "recommended therapeutic approach (CBT/DBT/ACT/etc)",
  "progress_note": "brief note on progress trajectory"
}}

Profile Data:
- Trigger themes: {profile.get('trigger_themes', [])}
- Cognitive distortions: {profile.get('cognitive_distortions', [])}
- Effective interventions: {profile.get('effective_interventions', [])}
- Recent moods: {[m.get('label', '') for m in mood_history[-10:]]}
- Recent risk scores: {[r.get('score', 0) for r in risk_history[-10:]]}
"""
            }],
            temperature=0.3,
            max_completion_tokens=600,
            response_format={"type": "json_object"}
        )
        data = json.loads(completion.choices[0].message.content.strip())
        data["sentiment_shift"] = f"{'+' if avg_shift > 0 else ''}{avg_shift}%"
        data["sentiment_trend"] = trend
        return data
    except:
        return {
            "overall_assessment": "Insufficient data for full assessment.", 
            "patterns_detected": [], 
            "personalized_recommendations": ["Continue sessions to build profile"],
            "sentiment_shift": "+0%",
            "sentiment_trend": "Stable"
        }


# ═══════════════════════════════════════════════════════════
# 5. GEMINI — Clinical Treatment Plan Generator (Co-Pilot)
# ═══════════════════════════════════════════════════════════

def generate_treatment_plan(profile: dict, recent_messages: list) -> dict:
    """Auto-generates a formal SOAP note / clinical treatment plan for human therapists."""
    try:
        if not client: raise Exception("Groq client not initialized")
        
        convo = "\n".join([f"{m['role']}: {m['content']}" for m in recent_messages[-30:]])
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                "role": "system",
                "content": f"""You are an expert Clinical Psychiatric AI Co-Pilot. Generate a formal SOAP Note and Treatment Plan based on the patient's profile and recent session. Return ONLY valid JSON:
{{
  "subjective": "Patient's reported experience, quotes, chief complaints",
  "objective": "AI-observed behaviors, tone, pacing, quantifiable risk trends",
  "assessment": "Clinical synthesis, primary cognitive distortions matching the data",
  "plan": {{
    "short_term_goals": ["1-3 immediate goals"],
    "long_term_goals": ["1-3 overriding goals"],
    "recommended_interventions": ["Specific modalities (e.g., CBT thought records, DBT distress tolerance)"]
  }},
  "risk_flag": "NO_ACUTE_RISK|MONITOR|ELEVATED_RISK"
}}

Profile Background:
- Triggers: {profile.get('trigger_themes', [])}
- Distortions: {profile.get('cognitive_distortions', [])}
- Risk Trend: {profile.get('risk_trend', [])}

Recent Session Snapshot:
{convo}
"""
            }],
            temperature=0.1,
            max_completion_tokens=800,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content.strip())
    except Exception as e:
        return {"subjective": "Error generating plan", "objective": str(e), "assessment": "", "plan": {"short_term_goals": [], "long_term_goals": [], "recommended_interventions": []}, "risk_flag": "ERROR"}

# ═══════════════════════════════════════════════════════════
# 6. GEMINI — AI Tool Recommendations
# ═══════════════════════════════════════════════════════════

def recommend_tools(current_emotions: list, distortions: list) -> dict:
    """AI recommends specific therapeutic tools based on current state."""
    try:
        if not client: raise Exception("Groq client not initialized")
        
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                "role": "system",
                "content": f"""Based on the user's current emotional state and detected cognitive distortions, recommend specific therapeutic tools. Return ONLY valid JSON:
{{
  "top_recommendation": {{
    "tool": "specific tool name",
    "why": "why this tool is recommended right now",
    "urgency": "low|medium|high"
  }},
  "other_tools": [
    {{"tool": "tool name", "why": "brief reason"}}
  ],
  "grounding_needed": true/false,
  "breathing_needed": true/false,
  "journaling_helpful": true/false
}}

Current emotions: {current_emotions}
Detected distortions: {distortions}
"""
            }],
            temperature=0.2,
            max_completion_tokens=400,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content.strip())
    except:
        return {"top_recommendation": {"tool": "4-7-8 Breathing", "why": "General calming technique", "urgency": "low"}, "other_tools": [], "grounding_needed": False, "breathing_needed": False, "journaling_helpful": False}


# ═══════════════════════════════════════════════════════════
# 7. GEMINI — Real-time Session Analysis
# ═══════════════════════════════════════════════════════════

def analyze_full_session(messages: list) -> dict:
    """Real-time full session analysis — the visible AI superpower."""
    try:
        if not client: raise Exception("Groq client not initialized")
        
        conversation = "\n".join([f"{m['role']}: {m['content']}" for m in messages[-15:]])
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                "role": "system",
                "content": f"""Analyze this therapy session in real-time. Return ONLY valid JSON:
{{
  "session_sentiment_arc": "how emotions evolved during the session",
  "sentiment_shift_score": "a quantifiable percentage shift from start to end, e.g. '+15%' or '-10%'",
  "dominant_themes": ["top 3 themes discussed"],
  "emotional_trajectory": "improving|stable|declining|volatile",
  "rapport_level": "low|moderate|good|strong",
  "risk_assessment": {{
    "current_risk": 0-100,
    "trend": "increasing|stable|decreasing",
    "immediate_concerns": ["any immediate safety concerns"]
  }},
  "ai_observations": ["3-5 clinical observations a therapist would want to know"],
  "suggested_next_questions": ["2-3 therapeutic questions the AI or therapist should ask next"],
  "therapeutic_progress": "what progress has been made in this session"
}}

Session:
{conversation}
"""
            }],
            temperature=0.2,
            max_completion_tokens=700,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content.strip())
    except:
        return {"dominant_themes": [], "emotional_trajectory": "unknown", "risk_assessment": {"current_risk": 0}, "ai_observations": []}


# ═══════════════════════════════════════════════════════════
# 8. Open-Meteo Weather API (Free)
# ═══════════════════════════════════════════════════════════

def get_weather(lat=28.6139, lon=77.2090):
    try:
        res = requests.get(f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weathercode,windspeed_10m&timezone=auto", timeout=5)
        data = res.json()
        current = data.get("current", {})
        code = current.get("weathercode", 0)
        weather_map = {0:"Clear sky ☀️",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Foggy",61:"Light rain 🌧",63:"Rain",65:"Heavy rain",71:"Snow ❄️",80:"Showers",95:"Thunderstorm ⛈"}
        mood_notes = {0:"Sunshine boosts serotonin.",3:"Overcast can feel calming.",61:"Rain can affect mood — be gentle with yourself.",95:"Storms may increase anxiety. Try grounding."}
        return {"temperature": current.get("temperature_2m"), "description": weather_map.get(code, "—"), "mood_note": mood_notes.get(code, "")}
    except:
        return {"temperature": None, "description": "Unavailable"}


# ═══════════════════════════════════════════════════════════
# 9. ZenQuotes (Free)
# ═══════════════════════════════════════════════════════════

def get_calming_quote():
    try:
        res = requests.get("https://zenquotes.io/api/random", timeout=5)
        d = res.json()
        if d: return {"quote": d[0]["q"], "author": d[0]["a"]}
    except: pass
    return {"quote": "You are not alone. Every step forward matters.", "author": "MindBridge AI"}


# ═══════════════════════════════════════════════════════════
# 10. Helplines
# ═══════════════════════════════════════════════════════════

HELPLINES = {
    "IN": {"name": "iCall / Vandrevala Foundation", "number": "1860-2662-345 / 9999 666 555", "country": "India"},
    "US": {"name": "988 Suicide & Crisis Lifeline", "number": "988", "country": "United States"},
    "GB": {"name": "Samaritans", "number": "116 123", "country": "United Kingdom"},
    "CA": {"name": "Crisis Services Canada", "number": "1-833-456-4566", "country": "Canada"},
    "AU": {"name": "Lifeline Australia", "number": "13 11 14", "country": "Australia"},
    "DEFAULT": {"name": "IASP Crisis Centres", "number": "iasp.info/resources/Crisis_Centres", "country": "International"},
}

def get_helpline(country_code="DEFAULT"):
    return HELPLINES.get(country_code.upper(), HELPLINES["DEFAULT"])

# =====================================================================
# 11. VIDEO CONSULTATION: AI CO-PILOT AND ANALYSIS
# =====================================================================

def generate_live_copilot_insights(transcript_segment: str) -> dict:
    """Generates quick, real-time insights for the therapist during a live video session."""
    
    prompt = f"""
    You are an AI Co-Pilot assisting a human therapist during a live therapy session.
    Analyze the following recent transcript segment from the session and provide 1-2 quick, 
    actionable insights or suggested responses/questions for the therapist.
    Focus on spotting underlying emotions, cognitive distortions, or therapeutic opportunities.
    
    Transcript Segment:
    "{transcript_segment}"
    
    Respond in valid JSON matching this schema:
    {{
      "insights": [
        {{
          "observation": "string (Brief analysis of what the patient is expressing)",
          "suggestion": "string (A specific question or pivot the therapist could use)"
        }}
      ],
      "risk_flag": "boolean (true ONLY if there is immediate risk of harm expressed)",
      "detected_emotion": "string (The primary emotion detected)"
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192", # Using a faster model for real-time
            messages=[
                {"role": "system", "content": "You are a clinical AI Co-Pilot providing real-time session assistance in JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_completion_tokens=300
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error generating live insight: {e}")
        return {"error": str(e)}

def analyze_consultation(transcript: str) -> dict:
    """Generates a comprehensive clinical report (including SOAP note) after a session ends."""
    
    prompt = f"""
    You are an expert clinical AI. Analyze the full transcript of a therapy session and generate a comprehensive clinical report.
    Include a standard SOAP note, a mood analysis, identified cognitive distortions, and suggested next steps/therapy modules for assignment.
    
    Full Transcript:
    "{transcript}"
    
    Respond in valid JSON matching this schema:
    {{
      "soap_note": {{
        "subjective": "string",
        "objective": "string",
        "assessment": "string",
        "plan": "string"
      }},
      "clinical_insights": {{
        "primary_mood": "string",
        "identified_distortions": ["string"],
        "key_themes": ["string"]
      }},
      "suggested_therapy_modules": [
        {{
          "module_id": "string (e.g., 'cbt_basics', 'mindfulness', 'dbt_distress_tolerance')",
          "module_name": "string",
          "reason": "string"
        }}
      ]
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert clinical psychologist generating comprehensive session reports in JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_completion_tokens=1000
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error analyzing consultation: {e}")
        return {"error": str(e)}

# =====================================================================
# 12. MENTAL HEALTH ASSESSMENT QUESTIONNAIRE
# =====================================================================

def analyze_mental_health_assessment(answers: dict) -> dict:
    """Analyze a patient questionnaire using Gemini/Groq to provide a mental health condition analysis."""
    try:
        if not client: raise Exception("Groq client not initialized")
        
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                "role": "system",
                "content": f"""Analyze this mental health questionnaire response. Return ONLY valid JSON:
{{
  "severity_level": "none|mild|moderate|moderately severe|severe",
  "primary_concerns": ["list of main issues"],
  "clinical_impression": "2-3 sentence clinical impression",
  "recommended_actions": ["3-5 actionable steps the user should take"],
  "risk_flag": "NO_RISK|ELEVATED_RISK"
}}

Patient Answers:
{json.dumps(answers, indent=2)}
"""
            }],
            temperature=0.1,
            max_completion_tokens=500,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content.strip())
    except Exception as e:
        return {"severity_level": "unknown", "primary_concerns": ["Error analyzing assessment"], "clinical_impression": f"Error: {str(e)}", "recommended_actions": [], "risk_flag": "ERROR"}

