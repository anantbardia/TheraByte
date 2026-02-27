import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { XCircle } from 'lucide-react'
import './TherapistPatients.css'

// SVG ring showing risk level as a circular progress arc
const RiskRing = ({ score }) => {
    const r = 20
    const circumference = 2 * Math.PI * r
    const offset = circumference - (score / 100) * circumference
    const color = score >= 70 ? 'var(--red-400)' : score >= 40 ? 'var(--amber-400)' : 'var(--green-400)'

    return (
        <svg className="pr-risk-ring" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r={r} stroke="rgba(0,0,0,0.06)" strokeWidth="3" />
            <circle
                cx="24" cy="24" r={r}
                stroke={color}
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 24 24)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
        </svg>
    )
}

const getAvatarColor = (score) => score >= 70
    ? 'linear-gradient(135deg, var(--red-200), var(--red-400))'
    : score >= 40
        ? 'linear-gradient(135deg, var(--amber-200), var(--amber-400))'
        : 'linear-gradient(135deg, var(--green-200), var(--green-400))'

const getRiskLabel = (score) => score >= 75 ? '🚨 CRITICAL' : score >= 50 ? '⚠️ High Risk' : score >= 30 ? 'Moderate' : 'Stable'
const getRiskColor = (score) => score >= 75 ? 'var(--red-600)' : score >= 50 ? 'var(--amber-600)' : 'var(--green-600)'
const getTagStyle = (score) => score >= 75
    ? 'badge-base badge-red tp-pulse'
    : score >= 50 ? 'badge-base badge-amber' : 'badge-base badge-green'

const TherapistPatients = ({ auth }) => {
    const [stats, setStats] = useState(null)
    const [appointments, setAppointments] = useState([])

    const fetchApps = () => {
        if (auth?.therapist_id) {
            fetch(`${import.meta.env.VITE_API_URL}/api/appointments/therapist/${auth.therapist_id}`)
                .then(r => r.json())
                .then(setAppointments)
                .catch(() => { });
        }
    };

    useEffect(() => {
        // Fetch dashboard stats
        fetch(`${import.meta.env.VITE_API_URL}/dashboard/stats`).then(r => r.json()).then(setStats).catch(() => { })

        // Fetch appointments and poll every 5s for lobby status changes
        fetchApps();
        const interval = setInterval(fetchApps, 5000);
        return () => clearInterval(interval);
    }, [auth])

    const handleClearAlerts = async (userId) => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/therapist/clear-alerts/${userId}`, { method: 'POST' });
            // Refresh stats to reflect the change
            fetch(`${import.meta.env.VITE_API_URL}/dashboard/stats`).then(r => r.json()).then(setStats).catch(() => { });
        } catch (e) { console.error("Failed to clear alerts", e); }
    };

    return (
        <div className="tp-page">
            <div className="tp-header-row">
                <div>
                    <h1>Patient Overview</h1>
                    <p className="tp-desc">AI-powered patient monitoring and real-time risk analysis</p>
                </div>
            </div>

            {!stats ? (
                <div className="tp-loading">
                    {[1, 2, 3, 4].map(i => <div key={i} className="tp-skeleton" />)}
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="tp-kpis">
                        <div className="tp-kpi">
                            <span className="k-label">Total Sessions</span>
                            <span className="k-value">{stats.total_sessions}</span>
                        </div>
                        <div className="tp-kpi">
                            <span className="k-label">Active Users</span>
                            <span className="k-value">{stats.total_users}</span>
                        </div>
                        <div className="tp-kpi danger">
                            <span className="k-label">High Risk Events</span>
                            <span className="k-value">{stats.high_risk_events}</span>
                        </div>
                        <div className="tp-kpi success">
                            <span className="k-label">Mood Entries</span>
                            <span className="k-value">{stats.mood_history?.length || 0}</span>
                        </div>
                    </div>

                    <div className="tp-sections">
                        {/* Daily Schedule (Video Consultations) */}
                        <div className="tp-section">
                            <h2>
                                Today's Schedule
                                {appointments.length > 0 && <span className="tp-section-badge">{appointments.length}</span>}
                            </h2>
                            <div className="tp-patient-list">
                                {appointments.length === 0 ? (
                                    <p className="tp-empty">No appointments scheduled.</p>
                                ) : (
                                    appointments.map((appt) => {
                                        const isWaiting = appt.status === 'Waiting';
                                        const t = new Date(appt.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        return (
                                            <div key={appt.id} className="patient-row" style={{ borderLeft: isWaiting ? '4px solid var(--orange-500)' : '4px solid var(--border-soft)' }}>
                                                <div className="pr-info">
                                                    <Link to={`/therapist/patient/${appt.user_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                        <span className="pr-name" style={{ cursor: 'pointer', fontWeight: 600 }}>{appt.patient_name || 'Patient'}</span>
                                                    </Link>
                                                    <div className="pr-meta" style={{ marginTop: 4 }}>
                                                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Time: {t}</span>
                                                        <span className="badge-base" style={{ background: isWaiting ? 'var(--amber-50)' : 'var(--bg-base)', color: isWaiting ? 'var(--amber-700)' : 'var(--text-secondary)', marginLeft: 8, padding: '4px 10px', borderRadius: 'var(--r-full)', fontSize: '12px', fontWeight: 500 }}>
                                                            {appt.status}
                                                        </span>
                                                        {appt.request_type === 'AI-Initiated' && (
                                                            <span className="badge-base" style={{ background: 'var(--teal-50)', color: 'var(--teal-700)', marginLeft: 8, padding: '4px 10px', borderRadius: 'var(--r-full)', fontSize: '12px', fontWeight: 500 }}>
                                                                🤖 AI-Initiated
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="pr-risk">
                                                    {isWaiting || appt.status === 'Confirmed' || appt.status === 'In-Progress' ? (
                                                        <Link
                                                            to={`/therapist/video/${appt.id}`}
                                                            className="btn-primary"
                                                            style={{
                                                                padding: '8px 18px',
                                                                borderRadius: 20,
                                                                fontSize: '0.9rem',
                                                                fontWeight: 600,
                                                                color: '#ffffff',
                                                                background: appt.status === 'In-Progress' ? 'var(--teal-600)' : isWaiting ? 'var(--teal-500)' : 'var(--primary-mint)',
                                                                animation: isWaiting ? 'tp-pulse-animation 2s infinite' : 'none',
                                                                textDecoration: 'none',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 6,
                                                                boxShadow: '0 4px 14px rgba(94, 156, 118, 0.4)',
                                                            }}
                                                        >
                                                            {isWaiting ? '🔴 Patient Waiting — Start' : appt.status === 'In-Progress' ? 'Resume Session' : 'Join Video Session'}
                                                        </Link>
                                                    ) : appt.status === 'Pending Confirmation' || appt.status === 'Scheduled' ? (
                                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                            <button
                                                                className="btn-primary"
                                                                style={{ padding: '6px 12px', borderRadius: 20, fontSize: '0.85rem', background: 'var(--green)' }}
                                                                onClick={async () => {
                                                                    await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appt.id}/status`, {
                                                                        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Confirmed' })
                                                                    });
                                                                    fetchApps();
                                                                }}>Confirm</button>
                                                            <button
                                                                className="btn-secondary"
                                                                style={{ padding: '6px 12px', borderRadius: 20, fontSize: '0.85rem' }}
                                                                onClick={async () => {
                                                                    await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appt.id}/status`, {
                                                                        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Reschedule Proposed' })
                                                                    });
                                                                    fetchApps();
                                                                }}>Reschedule</button>
                                                            <button
                                                                className="btn-secondary"
                                                                style={{ padding: '6px 12px', borderRadius: 20, fontSize: '0.85rem', color: 'var(--red)', borderColor: 'var(--red)' }}
                                                                onClick={async () => {
                                                                    await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appt.id}/status`, {
                                                                        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Rejected' })
                                                                    });
                                                                    fetchApps();
                                                                }}>Reject</button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{appt.status}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        {/* At-risk patients */}
                        <div className="tp-section">
                            <h2>
                                At-Risk Patients
                                {stats.at_risk_users?.length > 0 && (
                                    <span className={`tp-section-badge ${stats.at_risk_users.some(u => u.max_score >= 70) ? 'red' : ''}`}>
                                        {stats.at_risk_users.length}
                                    </span>
                                )}
                            </h2>
                            {stats.at_risk_users?.length > 0 ? (
                                <div className="tp-patient-list tp-scrollable-list">
                                    {[...stats.at_risk_users].sort((a, b) => b.max_score - a.max_score).map((u, i) => (
                                        <Link
                                            to={`/therapist/patient/${u.user_id}`}
                                            key={i}
                                            className={`patient-row ${u.max_score >= 70 ? 'high-risk' : ''}`}
                                        >
                                            <div className="pr-avatar-wrap">
                                                <div className="pr-avatar" style={{ background: getAvatarColor(u.max_score) }}>
                                                    {(u.nickname || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <RiskRing score={u.max_score} />
                                            </div>
                                            <div className="pr-info">
                                                <span className="pr-name">{u.nickname || `Patient ${u.user_id?.slice(0, 6)}`}</span>
                                                <div className="pr-meta">
                                                    <span className="pr-id">ID: {u.user_id?.slice(0, 8)}…</span>
                                                    <span className={getTagStyle(u.max_score)}>{getRiskLabel(u.max_score)}</span>
                                                </div>
                                            </div>
                                            <div className="pr-risk">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span className="pr-risk-score" style={{ color: getRiskColor(u.max_score) }}>
                                                            {u.max_score}
                                                        </span>
                                                        <span className="pr-risk-label" style={{ color: getRiskColor(u.max_score), display: 'block' }}>/ 100</span>
                                                    </div>
                                                    <button
                                                        className="btn-secondary"
                                                        style={{ padding: '6px', minWidth: 'auto', borderRadius: '50%', color: 'var(--text-muted)' }}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleClearAlerts(u.user_id);
                                                        }}
                                                        title="Clear Alert"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="tp-empty">✅ No at-risk patients right now.<br />Users with risk scores above 50 will appear here.</p>
                            )}
                        </div>

                        {/* Risk heatmap */}
                        <div className="tp-section">
                            <h2>Risk Heatmap</h2>
                            <div className="tp-heatmap">
                                {stats.risk_history?.length > 0 ? (
                                    stats.risk_history.map((r, i) => (
                                        <div
                                            key={i}
                                            className="hm-cell"
                                            style={{
                                                background: r.score > 70 ? '#ef4444' : r.score > 30 ? '#f59e0b' : '#10b981',
                                                opacity: Math.max(0.25, r.score / 100)
                                            }}
                                            title={`Risk score: ${r.score}`}
                                        />
                                    ))
                                ) : (
                                    <p className="tp-empty">Risk data populates as users interact.</p>
                                )}
                            </div>
                        </div>

                        {/* Mood timeline */}
                        <div className="tp-section">
                            <h2>Recent Mood Logs</h2>
                            <div className="tp-moods">
                                {stats.mood_history?.length > 0 ? (
                                    stats.mood_history.slice(-10).reverse().map((m, i) => (
                                        <div key={i} className="mood-row">
                                            <span className="mr-time">
                                                {new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="mr-dot" />
                                            <span className="mr-label">{m.label}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="tp-empty">No mood entries yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

const styles = `
.tp-pulse {
    animation: tp-pulse-animation 2s infinite;
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
}
@keyframes tp-pulse-animation {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
`;

export default TherapistPatients
