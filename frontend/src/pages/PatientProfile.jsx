import { useEffect, useState } from 'react'
import './PatientProfile.css'

const PatientProfile = ({ auth }) => {
    const [profile, setProfile] = useState(null)
    const [insights, setInsights] = useState(null)

    useEffect(() => {
        Promise.all([
            fetch(`${import.meta.env.VITE_API_URL}/profile/${auth.user_id}`).then(r => r.json()),
            fetch(`${import.meta.env.VITE_API_URL}/api/ai-insights/${auth.user_id}`).then(r => r.json())
        ]).then(([pData, iData]) => {
            setProfile(pData)
            setInsights(iData)
        }).catch(() => { })
    }, [auth.user_id])

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="profile-avatar-lg">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" /></svg>
                </div>
                <div>
                    <h1>Psychological Profile</h1>
                    <p>User ID: {auth.user_id} · Session: #{auth.session_id}</p>
                </div>
            </div>

            {!profile ? (
                <p className="profile-loading">Loading your profile...</p>
            ) : (
                <div className="profile-grid">
                    <div className="profile-card glass">
                        <h3>Trigger Themes</h3>
                        {profile.trigger_themes?.length > 0 ? (
                            <div className="tag-list">
                                {profile.trigger_themes.map((t, i) => <span key={i} className="tag tag-soft">{t}</span>)}
                            </div>
                        ) : <p className="empty">No triggers identified yet. Continue sessions for analysis.</p>}
                    </div>

                    <div className="profile-card glass">
                        <h3>Cognitive Distortions</h3>
                        {profile.cognitive_distortions?.length > 0 ? (
                            <div className="tag-list">
                                {profile.cognitive_distortions.map((d, i) => <span key={i} className="tag tag-warn">{d}</span>)}
                            </div>
                        ) : <p className="empty">No distortions detected yet.</p>}
                    </div>

                    <div className="profile-card glass">
                        <h3>Effective Interventions</h3>
                        {profile.effective_interventions?.length > 0 ? (
                            <div className="tag-list">
                                {profile.effective_interventions.map((v, i) => <span key={i} className="tag tag-success">{v}</span>)}
                            </div>
                        ) : <p className="empty">Interventions are tracked as sessions progress.</p>}
                    </div>

                    <div className="profile-card glass full-width profile-card-highlight">
                        <h3>Session Analytics & Sentiment Shift</h3>
                        <p className="notes-text" style={{ marginBottom: '16px', fontSize: '14px' }}>
                            TheraByte AI calculates quantifiable sentiment shifts across therapy sessions to monitor progress.
                        </p>
                        <div className="sentiment-bar-container">
                            <div className="sentiment-stat">
                                <div className={`stat-large ${insights?.sentiment_trend === 'Downward' ? 'text-red' : 'text-green'}`}>
                                    {insights?.sentiment_shift || '+0%'}
                                </div>
                                <div className="stat-label">Avg Mood Improvement per Session</div>
                            </div>
                            <div className="sentiment-track-wrap">
                                <div className="sentiment-track">
                                    <div
                                        className="sentiment-fill"
                                        style={{
                                            width: insights?.sentiment_trend === 'Downward' ? '30%' : '65%',
                                            background: insights?.sentiment_trend === 'Downward' ? 'linear-gradient(90deg, var(--red-400), var(--amber-400))' : 'linear-gradient(90deg, var(--amber-400), var(--green-400))'
                                        }}
                                    />
                                </div>
                                <span className="trend-label">Current Trend: {insights?.sentiment_trend || 'Stable'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-card glass">
                        <h3>Risk Trend</h3>
                        {profile.risk_trend?.length > 0 ? (
                            <div className="risk-bars">
                                {profile.risk_trend.map((r, i) => (
                                    <div key={i} className={`risk-bar ${r > 70 ? 'bg-red' : r > 30 ? 'bg-amber' : 'bg-green'}`} style={{ height: `${r}%` }} title={`Risk: ${r}`} />
                                ))}
                            </div>
                        ) : <p className="empty">Risk data builds over multiple sessions.</p>}
                    </div>

                    {insights && !insights.error && (
                        <>
                            <div className="profile-card glass full-width profile-card-highlight">
                                <h3>AI Overall Assessment</h3>
                                <p className="notes-text">{insights.overall_assessment}</p>
                            </div>

                            <div className="profile-card glass">
                                <h3>Detected Patterns</h3>
                                {insights.patterns_detected?.length > 0 ? (
                                    <div className="tag-list">
                                        {insights.patterns_detected.map((p, i) => <span key={i} className="tag tag-soft">{p}</span>)}
                                    </div>
                                ) : <p className="empty">None identified.</p>}
                            </div>

                            <div className="profile-card glass">
                                <h3>Recommended Approach</h3>
                                <p className="notes-text">{insights.therapeutic_approach}</p>
                            </div>
                        </>
                    )}

                    <div className="profile-card glass full-width">
                        <h3>Notes</h3>
                        <p className="notes-text">{profile.notes || 'No clinical notes yet.'}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PatientProfile
