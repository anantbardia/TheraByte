import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './PatientSessions.css'

const formatDuration = (start, end) => {
    try {
        const s = new Date(start)
        const e = new Date(end)
        const diff = Math.max(0, Math.floor((e - s) / 1000))
        return `${Math.floor(diff / 60)}m ${diff % 60}s`
    } catch { return 'Unknown' }
}

const PatientSessions = ({ auth }) => {
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${auth.user_id}`)
            .then(r => r.json())
            .then(sessData => {
                setSessions(sessData)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [auth.user_id])

    // Appointment booking moved to VideoSession.jsx

    return (
        <div className="sessions-page">
            <h1>Session History</h1>
            <p className="sessions-desc">Your past support sessions and mood data over time.</p>
            <div className="session-list">
                {loading ? (
                    <p>Loading sessions...</p>
                ) : sessions.length === 0 ? (
                    <div className="sessions-empty">
                        <p>Previous sessions will appear here as you use the platform. Each session builds your psychological profile over time.</p>
                    </div>
                ) : (
                    sessions.map((session, i) => {
                        const isActive = session.status === 'active'
                        const date = new Date(session.start_time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                        return (
                            <div key={session.id} className="session-item glass">
                                <div className="si-left">
                                    <span className="si-id">Session #{session.id}</span>
                                    <span className={`si-status ${isActive ? 'active' : ''}`}>{isActive ? 'Active' : 'Completed'}</span>
                                </div>
                                <div className="si-right">
                                    <span className="si-date">{isActive ? 'Current' : date}</span>
                                    {!isActive && <span className="si-duration">{formatDuration(session.start_time, session.last_activity)}</span>}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

        </div>
    )
}

export default PatientSessions
