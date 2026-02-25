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
                        <h3>🎯 Trigger Themes</h3>
                        {profile.trigger_themes?.length > 0 ? (
                            <div className="tag-list">
                                {profile.trigger_themes.map((t, i) => <span key={i} className="tag">{t}</span>)}
                            </div>
                        ) : <p className="empty">No triggers identified yet. Continue sessions for analysis.</p>}
                    </div>

                    <div className="profile-card glass">
                        <h3>🧠 Cognitive Distortions</h3>
                        {profile.cognitive_distortions?.length > 0 ? (
                            <div className="tag-list">
                                {profile.cognitive_distortions.map((d, i) => <span key={i} className="tag distortion">{d}</span>)}
                            </div>
                        ) : <p className="empty">No distortions detected yet.</p>}
                    </div>

                    <div className="profile-card glass">
                        <h3>✅ Effective Interventions</h3>
                        {profile.effective_interventions?.length > 0 ? (
                            <div className="tag-list">
                                {profile.effective_interventions.map((v, i) => <span key={i} className="tag intervention">{v}</span>)}
                            </div>
                        ) : <p className="empty">Interventions are tracked as sessions progress.</p>}
                    </div>

                    <div className="profile-card glass full-width" style={{ borderLeft: '4px solid var(--primary-accent)' }}>
                        <h3>📈 Session Analytics & Sentiment Shift</h3>
                        <p className="notes-text" style={{ marginBottom: '12px', fontSize: '13px' }}>
                            TheraByte AI calculates quantifiable sentiment shifts across therapy sessions to prove efficacy.
                        </p>
                        <div style={{ display: 'flex', gap: '30px', alignItems: 'center', background: 'var(--stone-100)', padding: '20px', borderRadius: '12px' }}>
                            <div>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: insights?.sentiment_trend === 'Downward' ? 'var(--red)' : 'var(--green)' }}>
                                    {insights?.sentiment_shift || '+0%'}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Avg Mood Improvement per Session</div>
                            </div>
                            <div style={{ flex: 1, height: '60px', borderLeft: '1px solid var(--stone-300)', paddingLeft: '30px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, height: '8px', background: 'var(--stone-200)', borderRadius: '4px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: insights?.sentiment_trend === 'Downward' ? '30%' : '65%', background: insights?.sentiment_trend === 'Downward' ? 'linear-gradient(90deg, var(--red), var(--amber))' : 'linear-gradient(90deg, var(--amber), var(--green))', borderRadius: '4px' }} />
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--slate-600)' }}>Current Trend: {insights?.sentiment_trend || 'Stable'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-card glass">
                        <h3>📊 Risk Trend</h3>
                        {profile.risk_trend?.length > 0 ? (
                            <div className="risk-bars">
                                {profile.risk_trend.map((r, i) => (
                                    <div key={i} className="risk-bar" style={{ height: `${r}%`, background: r > 70 ? 'var(--red)' : r > 30 ? 'var(--amber)' : 'var(--green)' }} title={`Risk: ${r}`} />
                                ))}
                            </div>
                        ) : <p className="empty">Risk data builds over multiple sessions.</p>}
                    </div>

                    {insights && !insights.error && (
                        <>
                            <div className="profile-card glass full-width" style={{ borderLeft: '4px solid var(--primary-accent)' }}>
                                <h3>💡 AI Overall Assessment</h3>
                                <p className="notes-text">{insights.overall_assessment}</p>
                            </div>

                            <div className="profile-card glass">
                                <h3>🔍 Detected Patterns</h3>
                                {insights.patterns_detected?.length > 0 ? (
                                    <div className="tag-list">
                                        {insights.patterns_detected.map((p, i) => <span key={i} className="tag">{p}</span>)}
                                    </div>
                                ) : <p className="empty">None identified.</p>}
                            </div>

                            <div className="profile-card glass">
                                <h3>🛠️ Recommended Approach</h3>
                                <p className="notes-text">{insights.therapeutic_approach}</p>
                            </div>
                        </>
                    )}

                    <div className="profile-card glass full-width">
                        <h3>📝 Notes</h3>
                        <p className="notes-text">{profile.notes || 'No clinical notes yet.'}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PatientProfile
