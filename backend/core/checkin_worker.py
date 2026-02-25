import time
import os
import sys

# Ensure backend root is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database
import google.generativeai as genai
from core.mindbridge import GEMINI_API_KEY
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("checkin_worker")

if GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE":
    genai.configure(api_key=GEMINI_API_KEY)

def generate_checkin_message(user_info) -> str:
    """Uses Gemini to generate a personalized proactive check-in message."""
    nickname = user_info['nickname']
    age_group = user_info['age_group']
    profile = database.get_profile(user_info['id'])
    
    context = ""
    if profile:
        if profile.get('trigger_themes'):
            context += f" Known triggers: {profile['trigger_themes']}."
        if profile.get('effective_interventions'):
            context += f" Known effective tools: {profile['effective_interventions']}."

    prompt = f"""You are MindBridge AI. You are proactively checking in on a user who hasn't had a session in a while but exhibited high risk recently.

User Info:
- Name/Alias: {nickname}
- Age Group: {age_group}
{context}

RULES for the message:
1. MAX 3 sentences.
2. Be warm, non-intrusive, and validate their experience.
3. Reference one of their known triggers or effective tools if available, but naturally.
4. End with an open-ended, low-pressure question (e.g., "How is your chest feeling today?" or "Did you end up trying that grounding trick?").
5. Do NOT say "I am an AI" or offer 24/7 platitudes.

Draft the message:"""

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(
            prompt,
            generation_config={"temperature": 0.5, "max_output_tokens": 150}
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Error generating check-in: {e}")
        return f"Hi {nickname}, just checking in to see how you're feeling today. Whenever you're ready, this space is here for you."

def run_checkin_scan():
    """Finds users who need check-ins and generates messages for them."""
    logger.info("Starting proactive check-in scan...")
    
    # In a real app, this might run daily (e.g., days_since_last=1). 
    # For testing, we might want to check for anyone who hasn't been active in 1 hour.
    # The database query currently uses days.
    users_needing_checkin = database.get_users_needing_checkin(days_since_last=1, min_risk_score=50)
    
    if not users_needing_checkin:
        logger.info("No users currently require proactive check-ins.")
        return

    logger.info(f"Found {len(users_needing_checkin)} users needing check-ins.")

    for user in users_needing_checkin:
        # Prevent spamming: only send if they don't already have a pending checkin
        pending = database.get_pending_checkins(user['id'])
        if pending:
            logger.info(f"Skipping user {user['id']} - already has pending check-ins.")
            continue
            
        logger.info(f"Generating check-in for user {user['id']} ({user['nickname']})...")
        message = generate_checkin_message(user)
        
        database.create_checkin(user['id'], message)
        logger.info(f"Check-in created successfully for user {user['id']}.")

if __name__ == "__main__":
    logger.info("MindBridge Proactive Care Worker Initialized.")
    # For demonstration, run once. In production, wrap in a schedule or cron job.
    run_checkin_scan()
