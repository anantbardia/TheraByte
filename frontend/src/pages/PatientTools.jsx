import { useState } from 'react'
import BreathingModal from '../components/BreathingModal'
import GroundingModal from '../components/GroundingModal'
import ThoughtJournalModal from '../components/ThoughtJournalModal'
import PMRModal from '../components/PMRModal'
import SoundscapeModal from '../components/SoundscapeModal'
import DBTOppositeActionModal from '../components/DBTOppositeActionModal'
import './PatientTools.css'

const tools = [
    {
        color: 'tc-teal',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>,
        title: 'Box Breathing',
        desc: 'Guided 4-2-6-2 breathing cycle to calm your nervous system and reduce stress response.',
        tag: 'Anxiety · Panic',
        action: 'breathing',
    },
    {
        color: 'tc-slate',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>,
        title: 'Grounding (5-4-3-2-1)',
        desc: 'Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.',
        tag: 'Dissociation · Panic',
        action: 'grounding',
    },
    {
        color: 'tc-amber',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
        title: 'Thought Journal',
        desc: 'Write automatic thoughts, identify cognitive distortions, and reframe them with evidence.',
        tag: 'CBT · Distortions',
        action: 'thought',
    },
    {
        color: 'tc-green',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
        title: 'Progressive Muscle Relaxation',
        desc: 'Tense and release each muscle group systematically. Reduces physical stress tension.',
        tag: 'Stress · Insomnia',
        action: 'pmr',
    },
    {
        color: 'tc-teal',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>,
        title: 'Calming Soundscape',
        desc: 'Ambient nature sounds, rain, ocean waves — choose what helps you regulate.',
        tag: 'Relaxation · Sleep',
        action: 'soundscape',
    },
    {
        color: 'tc-amber',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
        title: 'Opposite Action (DBT)',
        desc: 'When emotions urge unhelpful behavior, do the opposite. Fear says avoid → approach gently.',
        tag: 'DBT · Emotional Regulation',
        action: 'dbt',
    },
]

const PatientTools = ({ auth }) => {
    const [activeTool, setActiveTool] = useState(null);

    // Simulate checking backend for assigned therapy, or pull from auth context
    const assignedModuleId = auth?.assigned_therapy || 'cbt_journal';
    const hasAssigned = !!auth?.assigned_therapy; // Just to toggle UI state

    return (
        <div className="tools-page">
            {activeTool === 'breathing' && <BreathingModal onClose={() => setActiveTool(null)} />}
            {activeTool === 'grounding' && <GroundingModal onClose={() => setActiveTool(null)} />}
            {activeTool === 'thought' && <ThoughtJournalModal onClose={() => setActiveTool(null)} />}
            {activeTool === 'pmr' && <PMRModal onClose={() => setActiveTool(null)} />}
            {activeTool === 'soundscape' && <SoundscapeModal onClose={() => setActiveTool(null)} />}
            {activeTool === 'dbt' && <DBTOppositeActionModal onClose={() => setActiveTool(null)} />}

            <div className="tools-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1>Wellness Tools</h1>
                    <p className="tools-desc">Evidence-based exercises to help manage anxiety, stress, and emotional regulation.</p>
                </div>
            </div>

            {hasAssigned && (
                <div className="prescribed-container">
                    <h3 style={{ color: 'var(--teal-800)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, fontSize: '18px', fontWeight: 500 }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        Prescribed by your Therapist
                    </h3>
                    <div className="tool-card prescribed-card">
                        <div className="tool-icon tc-amber"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg></div>
                        <h3 style={{ fontSize: '18px' }}>CBT Thought Journal</h3>
                        <p style={{ fontSize: '15px' }}>Your therapist recommended this based on your recent session. Write automatic thoughts and reframe them.</p>
                        <button className="btn-primary" style={{ marginTop: 20, width: '100%' }}>Start Exercise</button>
                    </div>
                </div>
            )}

            <div className="assessment-banner">
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: 12 }}>AI Mental Health Assessment</h2>
                    <p style={{ opacity: 0.85, fontSize: '15px', lineHeight: 1.6, margin: 0, fontWeight: 400 }}>Take a quick 2-minute clinical questionnaire. Our AI will analyze your responses to provide a personalized severity score, clinical impression, and action plan.</p>
                </div>
                <button
                    className="btn-primary"
                    style={{ background: 'white', color: 'var(--teal-800)', border: 'none', padding: '16px 36px', fontSize: '16px', fontWeight: 500, boxShadow: '0 4px 14px rgba(46, 43, 42, 0.08)' }}
                    onClick={() => window.location.href = '/app/assessment'}
                >
                    Start Assessment
                </button>
            </div>

            <div className="tools-grid">
                {tools.map((t, i) => (
                    <div
                        key={i}
                        className="tool-card"
                        onClick={() => setActiveTool(t.action)}
                    >
                        <div className={`tool-icon ${t.color}`}>{t.icon}</div>
                        <h3>{t.title}</h3>
                        <p>{t.desc}</p>
                        <span className="tool-tag">{t.tag}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default PatientTools
