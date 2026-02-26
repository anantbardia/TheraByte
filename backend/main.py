import logging
import os
from datetime import datetime, timedelta

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import hashlib

import api_services
import database
import group_socket
import video_socket

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("app.log")
    ]
)
logger = logging.getLogger("mindbridge-backend")


_graph_singleton = None


def get_mindbridge_graph():
    """Lazily import and initialize the heavy LangGraph pipeline only when /chat is used."""
    global _graph_singleton
    if _graph_singleton is None:
        from core.mindbridge_graph import mindbridge_graph
        _graph_singleton = mindbridge_graph
    return _graph_singleton


app = FastAPI(title="TheraByte AI Backend")

_allowed_origins = os.getenv("ALLOWED_ORIGINS")
if _allowed_origins:
    allow_origins = [o.strip() for o in _allowed_origins.split(",") if o.strip()]
else:
    allow_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(group_socket.router)
app.include_router(video_socket.router)


# -- Global Exception Handler --
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "An internal server error occurred.", "detail": str(exc)},
    )


# -- Models --
class RegisterUserRequest(BaseModel):
    nickname: Optional[str] = None
    identity_mode: str = "anonymous"
    age_group: str = "20-30"


class RegisterTherapistRequest(BaseModel):
    name: str
    email: str
    password: str
    specialization: str = "General"


class LoginTherapistRequest(BaseModel):
    email: str
    password: str


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    user_id: str
    session_id: int


class MoodRequest(BaseModel):
    mood: str
    user_id: str
    session_id: int


class SummaryRequest(BaseModel):
    messages: List[ChatMessage]


class SessionAnalysisRequest(BaseModel):
    messages: List[ChatMessage]


class ToolRecommendRequest(BaseModel):
    emotions: List[str]
    distortions: List[str]


# -- Feedback & Assessment --
class FeedbackRequest(BaseModel):
    user_id: str
    session_id: str = "general"
    session_type: str = "chat"
    rating: int
    comments: str = ""


class AssessmentRequest(BaseModel):
    answers: dict


# -- Appointments --
class BookAppointmentRequest(BaseModel):
    user_id: str
    therapist_id: str
    scheduled_time: str
    request_type: str = "User-Initiated"


class UpdateAppointmentStatusRequest(BaseModel):
    status: str


# -- Health --
@app.get("/")
def health():
    return {
        "status": "online",
        "service": "MindBridge AI",
        "ai_layers": {
            "pipeline": "LangGraph (6-node stateful graph)",
            "custom_models": [
                "mindbridge-crisis-v1",
                "mindbridge-emotion-v1",
                "mindbridge-distortion-v1",
            ],
            "llm": "Gemini 1.5 Flash",
            "apis": ["Open-Meteo", "ZenQuotes", "Web Speech", "Geolocation"],
        },
    }


# -- Auth --
@app.post("/auth/register")
def register_user(req: RegisterUserRequest):
    uid = database.create_user(
        nickname=req.nickname,
        identity_mode=req.identity_mode,
        age_group=req.age_group,
    )
    sid = database.create_session(uid)
    return {"user_id": uid, "session_id": sid}


@app.post("/auth/therapist/register")
def register_therapist(req: RegisterTherapistRequest):
    pw = hashlib.sha256(req.password.encode()).hexdigest()
    try:
        return {
            "therapist_id": database.create_therapist(
                req.name, req.email, pw, req.specialization
            )
        }
    except Exception as e:
        raise HTTPException(400, str(e))


@app.post("/auth/therapist/login")
def login_therapist(req: LoginTherapistRequest):
    t = database.get_therapist_by_email(req.email)
    if not t or t["password_hash"] != hashlib.sha256(req.password.encode()).hexdigest():
        raise HTTPException(401, "Invalid credentials")
    return {"therapist_id": t["id"], "name": t["name"]}


@app.get("/api/therapists")
def get_therapists():
    return database.get_therapists()


# ==============================================================
# Appointments (Phase 2 Video Consultations)
# ==============================================================

@app.post("/api/appointments/book")
def book_appointment(req: BookAppointmentRequest):
    app_id = database.create_appointment(
        req.user_id, req.therapist_id, req.scheduled_time, req.request_type
    )
    return {
        "appointment_id": app_id,
        "status": "Pending Confirmation",
        "request_type": req.request_type,
    }


@app.get("/api/appointments/patient/{user_id}")
def get_patient_appointments(user_id: str):
    return database.get_patient_appointments(user_id)


@app.get("/api/appointments/therapist/{therapist_id}")
def get_therapist_appointments(therapist_id: str):
    return database.get_therapist_appointments(therapist_id)


@app.put("/api/appointments/{appointment_id}/status")
def update_appointment_status(appointment_id: str, req: UpdateAppointmentStatusRequest):
    database.update_appointment_status(appointment_id, req.status)
    return {"status": "ok", "new_status": req.status}


# ==============================================================
# CORE: Chat Endpoint - LangGraph Stateful Pipeline
# ==============================================================

@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    try:
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        user_text = messages[-1]["content"]

        # Log the user message before the pipeline runs
        database.log_message(request.session_id, "user", user_text)

        # Resolve user profile for age group
        user = database.get_user(request.user_id)
        age_group = user.get("age_group", "20-30") if user else "20-30"

        # Lazy graph init: avoids heavy startup memory footprint on small Render plans.
        graph = get_mindbridge_graph()
        result = graph.invoke(
            {
                "messages": messages,
                "user_id": request.user_id,
                "session_id": request.session_id,
                "age_group": age_group,
                "user_text": user_text,
                "ml_crisis": {},
                "ml_emotion": {},
                "ml_distortions": {},
                "regex_risk": {},
                "combined_risk_score": 0,
                "combined_mode": "normal",
                "combined_flags": [],
                "gemini_sentiment": {},
                "user_profile": None,
                "extra_context": "",
                "response_content": "",
                "routing_path": "normal",
            }
        )
        response_text = result["response_content"]

        # Strip out programmatic AI metadata from user-facing response.
        display_text = response_text
        if "Video_Recommendation:" in display_text:
            display_text = display_text.split("Video_Recommendation:")[0].strip()

        if "ACTION: BOOK_SESSION" in display_text:
            display_text = display_text.replace("ACTION: BOOK_SESSION", "").strip()
            scheduled_time = (datetime.now() + timedelta(hours=2)).isoformat()
            database.create_appointment(
                request.user_id,
                "t_dr_smith",
                scheduled_time,
                "AI-Initiated",
            )
            display_text += "\n\n*(System Note: I have securely routed a video consultation request to Dr. Smith on your behalf. You can view the status in your Video Session tab.)*"

        return {
            "role": "assistant",
            "content": display_text,
        }
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/api/analyze-session")
def analyze_session(req: SessionAnalysisRequest):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    return api_services.analyze_full_session(messages)


@app.get("/api/ai-insights/{user_id}")
def get_ai_insights(user_id: str):
    profile = database.get_profile(user_id)
    if not profile:
        raise HTTPException(404, "Profile not found")
    stats = database.get_dashboard_stats()
    return api_services.generate_ai_insights(
        profile, stats.get("mood_history", []), stats.get("risk_history", [])
    )


@app.post("/api/therapist/generate-plan/{user_id}")
def auto_generate_treatment_plan(user_id: str):
    profile = database.get_profile(user_id)
    if not profile:
        raise HTTPException(404, "Profile not found")

    sessions = database.get_sessions_for_user(user_id)
    all_msgs = []
    for s in sessions[:3]:
        msgs = database.get_messages_for_session(s["id"])
        all_msgs.extend(msgs)

    all_msgs.sort(key=lambda x: x["timestamp"])
    plan = api_services.generate_treatment_plan(profile, all_msgs)
    return plan


@app.post("/api/therapist/clear-alerts/{user_id}")
def clear_patient_alerts(user_id: str):
    database.clear_user_alerts(user_id)
    return {"status": "ok"}


@app.get("/api/sessions/{user_id}")
def get_user_sessions(user_id: str):
    return database.get_sessions_for_user(user_id)


@app.get("/api/sessions/{session_id}/messages")
def get_session_messages(session_id: int):
    return database.get_messages_for_session(session_id)


@app.get("/api/pending-checkins/{user_id}")
def get_pending_checkins(user_id: str):
    return database.get_pending_checkins(user_id)


@app.post("/api/checkins/{checkin_id}/read")
def mark_checkin_read(checkin_id: int):
    database.mark_checkin_read(checkin_id)
    return {"status": "ok"}


@app.post("/api/recommend-tools")
def recommend_tools(req: ToolRecommendRequest):
    return api_services.recommend_tools(req.emotions, req.distortions)


@app.post("/mood")
def log_mood(req: MoodRequest):
    database.log_mood(req.user_id, req.session_id, req.mood)
    return {"status": "ok"}


@app.get("/api/weather")
def get_weather(lat: float = 28.6139, lon: float = 77.2090):
    return api_services.get_weather(lat, lon)


@app.get("/api/quote")
def get_quote():
    return api_services.get_calming_quote()


@app.get("/api/helpline/{country_code}")
def get_helpline(country_code: str = "DEFAULT"):
    return api_services.get_helpline(country_code)


@app.post("/api/session-summary")
def session_summary(req: SummaryRequest):
    return api_services.generate_session_summary(
        [{"role": m.role, "content": m.content} for m in req.messages]
    )


@app.get("/profile/{user_id}")
def get_profile(user_id: str):
    p = database.get_profile(user_id)
    if not p:
        raise HTTPException(404, "Profile not found")
    return p


@app.post("/api/feedback")
def submit_feedback(req: FeedbackRequest):
    database.submit_feedback(
        req.user_id, req.session_id, req.session_type, req.rating, req.comments
    )
    return {"status": "ok"}


@app.post("/api/assessment/analyze")
def analyze_assessment(req: AssessmentRequest):
    return api_services.analyze_mental_health_assessment(req.answers)


@app.get("/dashboard/stats")
def get_stats():
    return database.get_dashboard_stats()
