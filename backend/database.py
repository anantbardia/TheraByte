import sqlite3
import os
import json
import uuid
from datetime import datetime

# Use an absolute path for the database, prioritizing persistent mount points on Render
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if os.path.exists("/data"):
    # Industry standard mount point
    DB_NAME = "/data/therabyte.db"
elif os.path.exists(os.path.join(BASE_DIR, "data")):
    # Subdirectory mount point
    DB_NAME = os.path.join(BASE_DIR, "data", "therabyte.db")
else:
    DB_NAME = os.path.join(BASE_DIR, "therabyte.db")

def get_conn():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_conn()
    c = conn.cursor()

    # ── Users ──
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nickname TEXT,
        identity_mode TEXT DEFAULT 'anonymous',
        age_group TEXT DEFAULT '20-30',
        recovery_email TEXT,
        created_at TEXT
    )''')

    # ── Therapists ──
    c.execute('''CREATE TABLE IF NOT EXISTS therapists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        specialization TEXT,
        created_at TEXT
    )''')

    # ── Sessions ──
    c.execute('''CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        therapist_id TEXT,
        start_time TEXT,
        last_activity TEXT,
        status TEXT DEFAULT 'active',
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(therapist_id) REFERENCES therapists(id)
    )''')

    # ── Messages ──
    c.execute('''CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        role TEXT,
        content TEXT,
        timestamp TEXT,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
    )''')

    # ── Risk Scores ──
    c.execute('''CREATE TABLE IF NOT EXISTS risk_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        session_id INTEGER,
        score INTEGER,
        flags TEXT,
        timestamp TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(session_id) REFERENCES sessions(id)
    )''')

    # ── Psychological Profiles ──
    c.execute('''CREATE TABLE IF NOT EXISTS psychological_profiles (
        user_id TEXT PRIMARY KEY,
        trigger_themes TEXT DEFAULT '[]',
        cognitive_distortions TEXT DEFAULT '[]',
        effective_interventions TEXT DEFAULT '[]',
        risk_trend TEXT DEFAULT '[]',
        notes TEXT DEFAULT '',
        alerts_cleared_at TEXT DEFAULT '1970-01-01T00:00:00',
        updated_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')

    # ── Mood Logs ──
    c.execute('''CREATE TABLE IF NOT EXISTS mood_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        session_id INTEGER,
        mood_label TEXT,
        timestamp TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')

    # ── Emergency Contacts ──
    c.execute('''CREATE TABLE IF NOT EXISTS emergency_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        contact_name TEXT,
        contact_phone TEXT,
        relationship TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')

    # ── AI Check-ins (Proactive Care) ──
    c.execute('''CREATE TABLE IF NOT EXISTS ai_checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        message TEXT,
        status TEXT DEFAULT 'pending', 
        created_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')

    # ── Peer Support Groups ──
    c.execute('''CREATE TABLE IF NOT EXISTS support_groups (
        id TEXT PRIMARY KEY,
        name TEXT,
        topic TEXT,
        created_at TEXT
    )''')

    # Seed some default groups if none exist
    conn.commit()
    count = c.execute("SELECT COUNT(*) FROM support_groups").fetchone()[0]
    if count == 0:
        now = datetime.now().isoformat()
        c.execute("INSERT INTO support_groups (id, name, topic, created_at) VALUES (?, ?, ?, ?)", ('g_anxiety', 'Anxiety & Overthinking', 'General anxiety support', now))
        c.execute("INSERT INTO support_groups (id, name, topic, created_at) VALUES (?, ?, ?, ?)", ('g_burnout', 'Career & Burnout', 'Work life and exhaustion', now))
        c.execute("INSERT INTO support_groups (id, name, topic, created_at) VALUES (?, ?, ?, ?)", ('g_lonely', 'Loneliness & Connection', 'Navigating isolation', now))

    # ── Group Messages ──
    c.execute('''CREATE TABLE IF NOT EXISTS group_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id TEXT,
        user_id TEXT,
        content TEXT,
        timestamp TEXT,
        FOREIGN KEY(group_id) REFERENCES support_groups(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')

    # Ensure exactly one authorized therapist exists
    import hashlib
    pw = hashlib.sha256(b"password123").hexdigest()
    now = datetime.now().isoformat()
    auth_email = 'dr.smith@therabyte.com'
    auth_name = 'Dr. Sarah Smith'
    
    # We DO NOT delete from therapists because it triggers a Foreign Key Constraint
    # if there are existing sessions tied to them due to `PRAGMA foreign_keys = ON`.
    # Instead, we just ensure our primary therapist exists.
    c.execute(
        "INSERT OR IGNORE INTO therapists (id, name, email, password_hash, specialization, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        ('t_dr_smith', auth_name, auth_email, pw, 'Clinical Psychologist', now)
    )
    conn.commit()
    # ── Appointments (Phase 2 Video Consultations) ──
    c.execute('''CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        therapist_id TEXT,
        scheduled_time TEXT,
        status TEXT DEFAULT 'Pending Confirmation',
        request_type TEXT DEFAULT 'User-Initiated',
        created_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(therapist_id) REFERENCES therapists(id)
    )''')

    # ── Feedback ──
    c.execute('''CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        session_id TEXT,
        session_type TEXT,
        rating INTEGER,
        comments TEXT,
        created_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')

    conn.commit()
    conn.close()

# ═══════════════════════════════════════════════════════════
# User Operations
# ═══════════════════════════════════════════════════════════

def create_user(nickname=None, identity_mode='anonymous', age_group='20-30', recovery_email=None):
    conn = get_conn()
    user_id = str(uuid.uuid4())[:8]
    now = datetime.now().isoformat()
    conn.execute(
        "INSERT INTO users (id, nickname, identity_mode, age_group, recovery_email, created_at) VALUES (?,?,?,?,?,?)",
        (user_id, nickname or f"anon-{user_id[:4]}", identity_mode, age_group, recovery_email, now)
    )
    # Create empty psychological profile
    conn.execute(
        "INSERT INTO psychological_profiles (user_id, updated_at) VALUES (?,?)",
        (user_id, now)
    )
    conn.commit()
    conn.close()
    return user_id

# ═══════════════════════════════════════════════════════════
# Appointments (Video Consultations)
# ═══════════════════════════════════════════════════════════

def create_appointment(user_id, therapist_id, scheduled_time, request_type="User-Initiated"):
    app_id = f"app_{str(uuid.uuid4())[:8]}"
    now = datetime.now().isoformat()
    conn = get_conn()
    conn.execute(
        "INSERT INTO appointments (id, user_id, therapist_id, scheduled_time, status, request_type, created_at) VALUES (?,?,?,?,?,?,?)",
        (app_id, user_id, therapist_id, scheduled_time, 'Pending Confirmation', request_type, now)
    )
    conn.commit()
    conn.close()
    return app_id

def get_patient_appointments(user_id):
    conn = get_conn()
    cursor = conn.execute(
        "SELECT a.*, t.name as therapist_name FROM appointments a JOIN therapists t ON a.therapist_id = t.id WHERE a.user_id = ? ORDER BY a.scheduled_time ASC",
        (user_id,)
    )
    apps = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return apps

def get_therapist_appointments(therapist_id):
    conn = get_conn()
    import datetime
    today_str = datetime.datetime.now().strftime("%Y-%m-%d")
    cursor = conn.execute(
        "SELECT a.*, u.nickname as patient_name FROM appointments a JOIN users u ON a.user_id = u.id WHERE a.therapist_id = ? AND date(a.scheduled_time) = ? ORDER BY a.scheduled_time ASC",
        (therapist_id, today_str)
    )
    apps = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return apps

def update_appointment_status(appointment_id, new_status):
    conn = get_conn()
    conn.execute(
        "UPDATE appointments SET status = ? WHERE id = ?",
        (new_status, appointment_id)
    )
    conn.commit()
    conn.close()
    return True

def get_user(user_id):
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

# ═══════════════════════════════════════════════════════════
# Therapist Operations
# ═══════════════════════════════════════════════════════════

def create_therapist(name, email, password_hash, specialization='General'):
    conn = get_conn()
    tid = str(uuid.uuid4())[:8]
    now = datetime.now().isoformat()
    conn.execute(
        "INSERT INTO therapists (id, name, email, password_hash, specialization, created_at) VALUES (?,?,?,?,?,?)",
        (tid, name, email, password_hash, specialization, now)
    )
    conn.commit()
    conn.close()
    return tid

def get_therapist_by_email(email):
    conn = get_conn()
    row = conn.execute("SELECT * FROM therapists WHERE email = ?", (email,)).fetchone()
    conn.close()
    return dict(row) if row else None

def get_therapists():
    conn = get_conn()
    rows = conn.execute("SELECT id, name, specialization FROM therapists").fetchall()
    conn.close()
    return [dict(row) for row in rows]

# ═══════════════════════════════════════════════════════════
# Session Operations
# ═══════════════════════════════════════════════════════════

def create_session(user_id):
    conn = get_conn()
    now = datetime.now().isoformat()
    c = conn.execute(
        "INSERT INTO sessions (user_id, start_time, last_activity) VALUES (?,?,?)",
        (user_id, now, now)
    )
    session_id = c.lastrowid
    conn.commit()
    conn.close()
    return session_id

def get_sessions_for_user(user_id):
    conn = get_conn()
    rows = conn.execute("SELECT * FROM sessions WHERE user_id = ? ORDER BY start_time DESC", (user_id,)).fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_messages_for_session(session_id):
    conn = get_conn()
    rows = conn.execute("SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC", (session_id,)).fetchall()
    conn.close()
    return [dict(row) for row in rows]

# ═══════════════════════════════════════════════════════════
# Logging Operations
# ═══════════════════════════════════════════════════════════

def log_message(session_id, role, content):
    conn = get_conn()
    conn.execute(
        "INSERT INTO messages (session_id, role, content, timestamp) VALUES (?,?,?,?)",
        (session_id, role, content, datetime.now().isoformat())
    )
    conn.execute("UPDATE sessions SET last_activity = ? WHERE id = ?", (datetime.now().isoformat(), session_id))
    conn.commit()
    conn.close()

def log_risk(user_id, session_id, score, flags):
    conn = get_conn()
    conn.execute(
        "INSERT INTO risk_scores (user_id, session_id, score, flags, timestamp) VALUES (?,?,?,?,?)",
        (user_id, session_id, score, json.dumps(flags), datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

def log_mood(user_id, session_id, mood_label):
    conn = get_conn()
    conn.execute(
        "INSERT INTO mood_logs (user_id, session_id, mood_label, timestamp) VALUES (?,?,?,?)",
        (user_id, session_id, mood_label, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

# ═══════════════════════════════════════════════════════════
# Profile Operations
# ═══════════════════════════════════════════════════════════

def get_profile(user_id):
    conn = get_conn()
    row = conn.execute("SELECT * FROM psychological_profiles WHERE user_id = ?", (user_id,)).fetchone()
    conn.close()
    if row:
        d = dict(row)
        d['trigger_themes'] = json.loads(d['trigger_themes'])
        d['cognitive_distortions'] = json.loads(d['cognitive_distortions'])
        d['effective_interventions'] = json.loads(d['effective_interventions'])
        d['risk_trend'] = json.loads(d['risk_trend'])
        return d
    return None

def update_profile(user_id, **kwargs):
    conn = get_conn()
    for key, value in kwargs.items():
        if isinstance(value, (list, dict)):
            value = json.dumps(value)
        conn.execute(f"UPDATE psychological_profiles SET {key} = ?, updated_at = ? WHERE user_id = ?",
                     (value, datetime.now().isoformat(), user_id))
    conn.commit()
    conn.close()

def clear_user_alerts(user_id):
    conn = get_conn()
    now = datetime.now().isoformat()
    conn.execute(
        "UPDATE psychological_profiles SET alerts_cleared_at = ?, updated_at = ? WHERE user_id = ?",
        (now, now, user_id)
    )
    conn.commit()
    conn.close()
    return True

# ═══════════════════════════════════════════════════════════
# Dashboard Analytics
# ═══════════════════════════════════════════════════════════

def get_dashboard_stats():
    conn = get_conn()
    c = conn.cursor()
    
    total_sessions = c.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
    total_users = c.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    high_risk = c.execute("SELECT COUNT(*) FROM risk_scores WHERE score > 60").fetchone()[0]
    
    recent_risks = [
        {"score": r[0], "time": r[1]}
        for r in c.execute("SELECT score, timestamp FROM risk_scores ORDER BY timestamp DESC LIMIT 30").fetchall()
    ]
    
    recent_moods = [
        {"label": r[0], "time": r[1]}
        for r in c.execute("SELECT mood_label, timestamp FROM mood_logs ORDER BY timestamp DESC LIMIT 30").fetchall()
    ]

    # Users with high risk for therapist view
    at_risk_users = [
        {"user_id": r[0], "max_score": r[1], "nickname": r[2] or f"anon-{r[0][:4]}"}
        for r in c.execute("""
            SELECT u.id, MAX(rs.score), u.nickname 
            FROM users u 
            JOIN risk_scores rs ON u.id = rs.user_id 
            JOIN psychological_profiles pp ON u.id = pp.user_id
            WHERE rs.timestamp > pp.alerts_cleared_at
            GROUP BY u.id 
            HAVING MAX(rs.score) > 50 
            ORDER BY MAX(rs.score) DESC 
            LIMIT 20
        """).fetchall()
    ]

    conn.close()
    return {
        "total_sessions": total_sessions,
        "total_users": total_users,
        "high_risk_events": high_risk,
        "risk_history": recent_risks,
        "mood_history": recent_moods,
        "at_risk_users": at_risk_users,
    }

# ═══════════════════════════════════════════════════════════
# Proactive Care Operations
# ═══════════════════════════════════════════════════════════

def create_checkin(user_id, message):
    conn = get_conn()
    conn.execute(
        "INSERT INTO ai_checkins (user_id, message, created_at) VALUES (?,?,?)",
        (user_id, message, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

def get_pending_checkins(user_id):
    conn = get_conn()
    rows = conn.execute("SELECT * FROM ai_checkins WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC", (user_id,)).fetchall()
    conn.close()
    return [dict(row) for row in rows]

def mark_checkin_read(checkin_id):
    conn = get_conn()
    conn.execute("UPDATE ai_checkins SET status = 'read' WHERE id = ?", (checkin_id,))
    conn.commit()
    conn.close()

def get_users_needing_checkin(days_since_last=1, min_risk_score=50):
    """Finds users who haven't had a session recently but have previously high risk."""
    conn = get_conn()
    # Find users whose last session was > days_since_last days ago, 
    # but their most recent risk score was >= min_risk_score.
    query = """
    SELECT u.id, u.nickname, u.age_group, 
           MAX(s.start_time) as last_session,
           (SELECT score FROM risk_scores rs WHERE rs.user_id = u.id ORDER BY timestamp DESC LIMIT 1) as latest_risk
    FROM users u
    JOIN sessions s ON u.id = s.user_id
    GROUP BY u.id
    HAVING julianday('now') - julianday(last_session) >= ? AND latest_risk >= ?
    """
    rows = conn.execute(query, (days_since_last, min_risk_score)).fetchall()
    conn.close()
    return [dict(row) for row in rows]

# ═══════════════════════════════════════════════════════════
# Peer Support Group Operations
# ═══════════════════════════════════════════════════════════

def get_groups():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM support_groups").fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_group_messages(group_id, limit=50):
    conn = get_conn()
    query = """
    SELECT gm.*, u.nickname as author_name 
    FROM group_messages gm 
    JOIN users u ON gm.user_id = u.id 
    WHERE gm.group_id = ? 
    ORDER BY gm.timestamp ASC LIMIT ?
    """
    rows = conn.execute(query, (group_id, limit)).fetchall()
    conn.close()
    return [dict(row) for row in rows]

def add_group_message(group_id, user_id, content):
    conn = get_conn()
    now = datetime.now().isoformat()
    conn.execute(
        "INSERT INTO group_messages (group_id, user_id, content, timestamp) VALUES (?,?,?,?)",
        (group_id, user_id, content, now)
    )
    conn.commit()
    conn.close()

# ═══════════════════════════════════════════════════════════
# Feedback Operations
# ═══════════════════════════════════════════════════════════

def submit_feedback(user_id, session_id, session_type, rating, comments):
    conn = get_conn()
    conn.execute(
        "INSERT INTO feedback (user_id, session_id, session_type, rating, comments, created_at) VALUES (?,?,?,?,?,?)",
        (user_id, session_id, session_type, rating, comments, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
    return True

# Initialize
init_db()
