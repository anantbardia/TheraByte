import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './TherapistPatientView.css'

const TherapistPatientView = () => {
    const { userId } = useParams()
    const navigate = useNavigate()
    const [profile, setProfile] = useState(null)
    const [summary, setSummary] = useState(null)
    const [plan, setPlan] = useState(null)
    const [insights, setInsights] = useState(null)
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetch(`${import.meta.env.VITE_API_URL}/profile/${userId}`).then(r => r.json()),
            fetch(`${import.meta.env.VITE_API_URL}/api/ai-insights/${userId}`).then(r => r.json()),
            fetch(`${import.meta.env.VITE_API_URL}/api/appointments/patient/${userId}`).then(r => r.json())
        ]).then(([p, ins, apps]) => {
            setProfile(p)
            setInsights(ins)
            setAppointments(apps || [])
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [userId])

    const generateSummary = async () => {
        setSummary({ generating: true })
        try {
            // 1. Get the user's latest session
            const sessRes = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${userId}`)
            const sessions = await sessRes.json()
            if (!sessions || sessions.length === 0) {
                setSummary({ error: 'No sessions found for this patient to summarize.' })
                return
            }
            const latestSessionId = sessions[0].id

            // 2. Get the messages for that session
            const msgRes = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${latestSessionId}/messages`)
            const messages = await msgRes.json()
            if (!messages || messages.length === 0) {
                setSummary({ error: 'Session is empty, no messages to summarize.' })
                return
            }

            // 3. Generate summary
            const formatted = messages.map(m => ({ role: m.role, content: m.content }))
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/session-summary`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: formatted })
            })
            const data = await res.json()
            setSummary(data)
        } catch { setSummary({ error: 'Failed to generate summary' }) }
    }

    const generatePlan = async () => {
        setPlan({ generating: true })
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/therapist/generate-plan/${userId}`, { method: 'POST' })
            const data = await res.json()
            setPlan(data)
        } catch { setPlan({ error: 'Failed to generate treatment plan' }) }
    }

    if (loading) return <div className="tpv-page"><p>Loading patient data...</p></div>

    return (
        <div className="tpv-page">
            <div className="tpv-header">
                <div className="tpv-avatar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" /></svg>
                </div>
                <div>
                    <h1>Patient: {userId}</h1>
                    <p>AI-Generated Patient Profile & Clinical Insights</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button className="tpv-summary-btn" onClick={generateSummary}>
                        {summary?.generating ? '⏳ Generating...' : '🧠 Generate Intake Summary'}
                    </button>
                    <button className="tpv-summary-btn" style={{ background: 'var(--stone-600)' }} onClick={generatePlan}>
                        {plan?.generating ? '⏳ Generating...' : '📋 Generate Treatment Plan'}
                    </button>
                    <button
                        className="btn-primary"
                        style={{ padding: '12px 24px', fontSize: '15px', display: 'inline-flex', alignItems: 'center', boxShadow: '0 4px 14px var(--primary-mint-dim)' }}
                        onClick={() => {
                            const activeApp = appointments.find(a => ['Confirmed', 'In-Progress', 'Waiting', 'Scheduled'].includes(a.status));
                            const room = activeApp ? activeApp.id : `room-${userId}`;
                            navigate(`/therapist/video/${room}`);
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}><path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" ry="2" /></svg>
                        Join Video Call
                    </button>
                </div>
            </div>

            {summary && !summary.generating && !summary.error && (
                <div className="tpv-summary glass">
                    <h2>AI-Generated Clinical Summary</h2>
                    <div className="tpv-s-grid">
                        <div><span className="tpv-sl">Chief Concern</span><p>{summary.chief_concern}</p></div>
                        <div><span className="tpv-sl">Emotional State</span><p>{summary.emotional_state}</p></div>
                        <div><span className="tpv-sl">Risk Level</span><p className={`tpv-risk tpv-${summary.risk_level}`}>{summary.risk_level?.toUpperCase()}</p></div>
                        <div><span className="tpv-sl">Recommended Focus</span><p>{summary.recommended_focus}</p></div>
                    </div>
                    {summary.key_themes?.length > 0 && (
                        <div className="tpv-themes">
                            <span className="tpv-sl">Key Themes</span>
                            <div className="tpv-tags">{summary.key_themes.map((t, i) => <span key={i} className="tpv-tag">{t}</span>)}</div>
                        </div>
                    )}
                    {summary.brief_narrative && <p className="tpv-narrative">{summary.brief_narrative}</p>}
                </div>
            )}

            {plan && !plan.generating && !plan.error && (
                <div className="tpv-summary glass" style={{ borderColor: 'rgba(46, 43, 42, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Clinical SOAP Note & Treatment Plan</h2>
                        <span className={`tpv-tag tpv-${plan.risk_flag?.toLowerCase()}`} style={{ fontWeight: 600 }}>Risk: {plan.risk_flag}</span>
                    </div>
                    <div className="tpv-s-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
                        <div><span className="tpv-sl">Subjective</span><p>{plan.subjective}</p></div>
                        <div><span className="tpv-sl">Objective</span><p>{plan.objective}</p></div>
                        <div><span className="tpv-sl">Assessment</span><p>{plan.assessment}</p></div>
                        <div>
                            <span className="tpv-sl">Plan</span>
                            <div style={{ marginLeft: '12px', marginTop: '8px' }}>
                                <strong>Short-term goals:</strong>
                                <ul style={{ fontSize: '14px', color: 'var(--slate-600)', margin: '4px 0 12px 0' }}>
                                    {plan.plan?.short_term_goals?.map((g, i) => <li key={i}>{g}</li>)}
                                </ul>
                                <strong>Recommended Interventions:</strong>
                                <ul style={{ fontSize: '14px', color: 'var(--slate-600)', margin: '4px 0 0 0' }}>
                                    {plan.plan?.recommended_interventions?.map((g, i) => <li key={i}>{g}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {insights && (
                <div className="tpv-summary glass" style={{ marginBottom: 24, borderColor: 'var(--teal-200)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Real-Time AI Assessment</h2>
                        <span className="tpv-tag tpVar-medium" style={{ fontWeight: 600 }}>Trend: {insights.sentiment_trend}</span>
                    </div>
                    <p style={{ lineHeight: 1.6, color: '#334155', marginBottom: 20 }}>{insights.overall_assessment || insights.assessment}</p>
                    <div className="tpv-s-grid">
                        <div><span className="tpv-sl">Sentiment Trend</span><p style={{ color: insights.sentiment_trend === 'Downward' ? 'var(--red)' : 'var(--green)', fontWeight: 'bold' }}>{insights.sentiment_trend}</p></div>
                        <div><span className="tpv-sl">Sentiment Shift</span><p style={{ fontWeight: 'bold' }}>{insights.sentiment_shift}</p></div>
                        <div><span className="tpv-sl">Therapeutic Approach</span><p>{insights.therapeutic_approach}</p></div>
                        <div><span className="tpv-sl">Progress Note</span><p>{insights.progress_note}</p></div>
                    </div>
                </div>
            )}

            {profile && (
                <div className="tpv-grid">
                    <div className="tpv-card glass">
                        <h3>Trigger Themes</h3>
                        {profile.trigger_themes?.length > 0 ? <div className="tpv-tags">{profile.trigger_themes.map((t, i) => <span key={i} className="tpv-tag">{t}</span>)}</div> : <p className="tpv-empty">None identified</p>}
                    </div>
                    <div className="tpv-card glass">
                        <h3>Cognitive Distortions</h3>
                        {profile.cognitive_distortions?.length > 0 ? <div className="tpv-tags">{profile.cognitive_distortions.map((d, i) => <span key={i} className="tpv-tag distortion">{d}</span>)}</div> : <p className="tpv-empty">None detected</p>}
                    </div>
                    <div className="tpv-card glass">
                        <h3>Effective Interventions</h3>
                        {profile.effective_interventions?.length > 0 ? <div className="tpv-tags">{profile.effective_interventions.map((v, i) => <span key={i} className="tpv-tag green">{v}</span>)}</div> : <p className="tpv-empty">None recorded</p>}
                    </div>
                    <div className="tpv-card glass">
                        <h3>Clinical Notes</h3>
                        <p className="tpv-notes">{profile.notes || 'No notes yet. Add notes after reviewing the AI summary.'}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TherapistPatientView
