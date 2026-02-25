import React, { useEffect, useState } from 'react'
import './Dashboard.css'

const Dashboard = ({ onClose, therapistName }) => {
    const [stats, setStats] = useState(null)

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/dashboard/stats`)
            .then(r => r.json())
            .then(setStats)
            .catch(() => setStats({ total_sessions: 0, total_users: 0, high_risk_events: 0, risk_history: [], mood_history: [], at_risk_users: [] }))
    }, [])

    const isTherapistView = !!therapistName

    return (
        <div className={isTherapistView ? "dash-fullscreen" : "dash-overlay"} onClick={isTherapistView ? undefined : onClose}>
            <div className={isTherapistView ? "dash-panel-full" : "dash-panel"} onClick={e => e.stopPropagation()}>
                <div className="dash-top">
                    <div>
                        <h2>{isTherapistView ? `Welcome, Dr. ${therapistName}` : 'Analytics'}</h2>
                        <p className="dash-sub">{isTherapistView ? 'Patient risk monitoring and session insights' : 'Your session history and mood data'}</p>
                    </div>
                    <button className="dash-close-btn" onClick={onClose}>
                        {isTherapistView ? 'Logout' : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        )}
                    </button>
                </div>

                {!stats ? (
                    <div className="dash-loading">Loading analytics...</div>
                ) : (
                    <>
                        <div className="kpi-row">
                            <div className="kpi-card">
                                <span className="kpi-label">Total Sessions</span>
                                <span className="kpi-value">{stats.total_sessions}</span>
                            </div>
                            {isTherapistView && (
                                <div className="kpi-card">
                                    <span className="kpi-label">Active Users</span>
                                    <span className="kpi-value">{stats.total_users}</span>
                                </div>
                            )}
                            <div className="kpi-card danger">
                                <span className="kpi-label">High Risk Events</span>
                                <span className="kpi-value">{stats.high_risk_events}</span>
                            </div>
                            <div className="kpi-card">
                                <span className="kpi-label">Mood Entries</span>
                                <span className="kpi-value">{stats.mood_history.length}</span>
                            </div>
                        </div>

                        <div className="dash-grid">
                            <div className="dash-card">
                                <h3>Risk Heatmap</h3>
                                <div className="heatmap">
                                    {stats.risk_history.length === 0 ? (
                                        <p className="empty-state">No risk data recorded yet.</p>
                                    ) : (
                                        stats.risk_history.map((r, i) => (
                                            <div
                                                key={i}
                                                className="heat-cell"
                                                style={{
                                                    background: r.score > 70 ? 'var(--danger)' : r.score > 30 ? 'var(--warning)' : 'var(--success)',
                                                    opacity: Math.max(0.3, r.score / 100)
                                                }}
                                                title={`Risk: ${r.score}`}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>

                            {isTherapistView && stats.at_risk_users && stats.at_risk_users.length > 0 ? (
                                <div className="dash-card">
                                    <h3>At-Risk Patients</h3>
                                    <div className="mood-timeline">
                                        {stats.at_risk_users.map((u, i) => (
                                            <div key={i} className="timeline-row">
                                                <span className="tl-dot" style={{ background: u.max_score > 70 ? 'var(--danger)' : 'var(--warning)' }} />
                                                <span className="tl-label">{u.nickname}</span>
                                                <span className="tl-time">Risk: {u.max_score}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="dash-card">
                                    <h3>Mood Timeline</h3>
                                    <div className="mood-timeline">
                                        {stats.mood_history.length === 0 ? (
                                            <p className="empty-state">No mood data logged yet.</p>
                                        ) : (
                                            stats.mood_history.map((m, i) => (
                                                <div key={i} className="timeline-row">
                                                    <span className="tl-time">{new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span className="tl-dot" />
                                                    <span className="tl-label">{m.label}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Dashboard
