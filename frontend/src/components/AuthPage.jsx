import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './AuthPage.css'

const IconEye = ({ open }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        {open
            ? <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>
            : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
        }
    </svg>
)
const IconCheck = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
)
const IconLock = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
)
const IconShield = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
)
const IconUser = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" /></svg>
)
const IconAnon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M9 10a3 3 0 0 1 6 0c0 2.5-3 3.5-3 3.5" /><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2" strokeLinecap="round" /></svg>
)
const IconAlert = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" /></svg>
)

const AuthPage = ({ onLogin }) => {
    const [tab, setTab] = useState('user')
    const [mode, setMode] = useState('anonymous')
    const [nickname, setNickname] = useState('')
    const [ageGroup, setAgeGroup] = useState('20-30')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [tName, setTName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleUserRegister = async () => {
        setLoading(true); setError('')
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: mode === 'pseudonymous' ? nickname : null, identity_mode: mode, age_group: ageGroup })
            })
            onLogin({ type: 'user', ...(await res.json()) })
        } catch { setError('Cannot connect to server. Is the backend running?') }
        setLoading(false)
    }

    const handleTherapistLogin = async () => {
        setLoading(true); setError('')
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/therapist/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            if (!res.ok) { setError((await res.json()).detail || 'Invalid credentials'); setLoading(false); return }
            onLogin({ type: 'therapist', ...(await res.json()) })
        } catch { setError('Cannot connect to server.') }
        setLoading(false)
    }

    const handleTherapistRegister = async () => {
        setLoading(true); setError('')
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/therapist/register`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: tName, email, password })
            })
            if (!res.ok) { setError('Registration failed. Email may already exist.'); setLoading(false); return }
            await handleTherapistLogin()
        } catch { setError('Cannot connect to server.') }
        setLoading(false)
    }

    return (
        <div className="auth-page">
            <div className="auth-mesh" />
            <div className="auth-container">
                {/* Left hero */}
                <div className="auth-hero">
                    <img src="/images/auth-bg.png" alt="" className="auth-hero-img" />
                    <div className="auth-hero-content">
                        <div className="auth-hero-badge">Mental Health AI</div>
                        <h2>Find clarity.<br /><em>Reclaim calm.</em></h2>
                        <p>AI-guided support with clinical-grade triage.<br />Private, structured, and always available.</p>
                        <ul className="auth-features-list">
                            {['No account or email required', 'Crisis detection with immediate response', 'CBT · DBT · ACT therapy frameworks', 'Therapist oversight available'].map((f, i) => (
                                <li key={i}>
                                    <span className="auth-check-icon"><IconCheck /></span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Right form */}
                <div className="auth-card">
                    <div className="auth-logo-row">
                        <img src="/images/therabyte-icon.png" alt="TheraByte" style={{ height: '44px', width: '44px', objectFit: 'contain' }} />
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>TheraByte</span>
                    </div>

                    <div className="auth-tabs">
                        <button className={tab === 'user' ? 'active' : ''} onClick={() => { setTab('user'); setError('') }}>Get Support</button>
                        <button className={tab === 'therapist' ? 'active' : ''} onClick={() => { setTab('therapist'); setError('') }}>Therapist</button>
                    </div>

                    {error && <div className="auth-err"><IconAlert />{error}</div>}

                    {tab === 'user' ? (
                        <div className="auth-body">
                            <div className="auth-modes">
                                <button className={`auth-mode-btn ${mode === 'anonymous' ? 'active' : ''}`} onClick={() => setMode('anonymous')}>
                                    <IconAnon />Anonymous
                                </button>
                                <button className={`auth-mode-btn ${mode === 'pseudonymous' ? 'active' : ''}`} onClick={() => setMode('pseudonymous')}>
                                    <IconUser />Nickname
                                </button>
                            </div>
                            {mode === 'pseudonymous' && (
                                <div className="auth-field-group">
                                    <label>Choose a nickname</label>
                                    <input className="auth-input" placeholder="e.g. blue_sky_22" value={nickname} onChange={e => setNickname(e.target.value)} />
                                </div>
                            )}
                            <div className="auth-field-group">
                                <label>Age Group</label>
                                <select className="auth-input" value={ageGroup} onChange={e => setAgeGroup(e.target.value)}>
                                    <option value="13-19">13 – 19 years</option>
                                    <option value="20-30">20 – 30 years</option>
                                    <option value="30+">30+ years</option>
                                </select>
                            </div>
                            <button className="auth-cta" onClick={handleUserRegister} disabled={loading}>
                                {loading ? <><span className="auth-spinner" />Connecting...</> : 'Start Session'}
                            </button>
                            <div className="auth-trust-badges">
                                <span className="trust-badge"><IconLock />Anonymous</span>
                                <span className="trust-badge"><IconCheck />No email</span>
                                <span className="trust-badge"><IconShield />Encrypted</span>
                            </div>
                        </div>
                    ) : (
                        <div className="auth-body">
                            <div className="auth-field-group">
                                <label>Full Name</label>
                                <input className="auth-input" placeholder="Dr. Jane Smith" value={tName} onChange={e => setTName(e.target.value)} />
                            </div>
                            <div className="auth-field-group">
                                <label>Email Address</label>
                                <input className="auth-input" placeholder="therapist@clinic.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="auth-field-group">
                                <label>Password</label>
                                <div className="pw-wrapper">
                                    <input className="auth-input" placeholder="••••••••" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} />
                                    <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}><IconEye open={showPw} /></button>
                                </div>
                            </div>
                            <div className="auth-actions">
                                <button className="auth-cta" onClick={handleTherapistLogin} disabled={loading}>
                                    {loading ? <><span className="auth-spinner" />Signing in...</> : 'Sign In'}
                                </button>
                                <button className="auth-cta secondary" onClick={handleTherapistRegister} disabled={loading}>
                                    {loading ? '...' : 'Create Account'}
                                </button>
                            </div>
                        </div>
                    )}
                    <p className="auth-note">By continuing you agree to the <Link to="/terms" style={{ color: 'var(--primary-mint)' }}>Terms and Conditions</Link> and acknowledge this platform does not replace professional clinical care.</p>
                </div>
            </div>
        </div>
    )
}

export default AuthPage
