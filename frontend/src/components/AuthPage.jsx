import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './AuthPage.css'

const IconArrowRight = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
)

const AuthPage = ({ onLogin }) => {
    const [view, setView] = useState('welcome') // welcome, userMode, userName, userAge, therapistLogin, therapistRegister

    // User state
    const [mode, setMode] = useState('anonymous')
    const [nickname, setNickname] = useState('')
    const [ageGroup, setAgeGroup] = useState('')

    // Therapist state
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [tName, setTName] = useState('')

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // User Flow API
    const handleUserRegister = async (finalMode, finalNickname, finalAge) => {
        setLoading(true); setError('')
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nickname: finalMode === 'pseudonymous' ? finalNickname : null,
                    identity_mode: finalMode,
                    age_group: finalAge || '20-30' // default bypass if skipped
                })
            })
            if (!res.ok) throw new Error('Failed to connect')
            onLogin({ type: 'user', ...(await res.json()) })
        } catch {
            setError('Could not reach the sanctuary. Please try again.')
            setLoading(false)
        }
    }

    // Therapist flows
    const handleTherapistLogin = async () => {
        setLoading(true); setError('')
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/therapist/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            if (!res.ok) { setError((await res.json()).detail || 'Invalid credentials'); setLoading(false); return }
            onLogin({ type: 'therapist', ...(await res.json()) })
        } catch { setError('Connection error.'); setLoading(false) }
    }

    const handleTherapistRegister = async () => {
        setLoading(true); setError('')
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/therapist/register`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: tName, email, password })
            })
            if (!res.ok) { setError('Email may already exist.'); setLoading(false); return }
            await handleTherapistLogin()
        } catch { setError('Connection error.'); setLoading(false) }
    }

    return (
        <div className="auth-page">
            <div className="auth-abstract-art">
                <div className="auth-circle ac1"></div>
                <div className="auth-circle ac2"></div>
                <div className="auth-circle ac3"></div>
            </div>

            <Link to="/" className="auth-back-logo">
                <img src="/images/therabyte-icon.png" alt="home" style={{ width: 28, height: 28, opacity: 0.5 }} />
            </Link>

            <div className="auth-central-card">
                {error && <div className="auth-soft-error">{error}</div>}

                {/* --- 1. WELCOME --- */}
                {view === 'welcome' && (
                    <div className="auth-fade-in auth-step">
                        <h2>Welcome.</h2>
                        <p className="auth-sub">How would you like to enter the space today?</p>
                        <div className="auth-options">
                            <button className="auth-btn-large" onClick={() => setView('userMode')}>
                                I need to talk to someone
                                <span className="auth-btn-desc">Anonymous, AI-guided reflection</span>
                            </button>
                            <button className="auth-btn-large outline" onClick={() => setView('therapistLogin')}>
                                I am a Therapist
                                <span className="auth-btn-desc">Access your clinical dashboard</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* --- 2. USER MODE --- */}
                {view === 'userMode' && (
                    <div className="auth-fade-in auth-step">
                        <button className="back-link" onClick={() => setView('welcome')}>← Back</button>
                        <h2>Your identity is yours.</h2>
                        <p className="auth-sub">Choose how you'd like to be addressed in the room.</p>
                        <div className="auth-options">
                            <button className="auth-btn-large" onClick={() => { setMode('anonymous'); setView('userAge'); }}>
                                Remain completely anonymous
                            </button>
                            <button className="auth-btn-large outline" onClick={() => { setMode('pseudonymous'); setView('userName'); }}>
                                Use a nickname
                            </button>
                        </div>
                    </div>
                )}

                {/* --- 3. USER NICKNAME --- */}
                {view === 'userName' && (
                    <div className="auth-fade-in auth-step">
                        <button className="back-link" onClick={() => setView('userMode')}>← Back</button>
                        <h2>What should we call you?</h2>
                        <input
                            className="auth-soft-input"
                            autoFocus
                            placeholder="Type a nickname..."
                            value={nickname}
                            onChange={e => setNickname(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && nickname && setView('userAge')}
                        />
                        <button
                            className="auth-nav-next"
                            disabled={!nickname}
                            onClick={() => setView('userAge')}
                        >
                            Continue <IconArrowRight />
                        </button>
                    </div>
                )}

                {/* --- 4. USER AGE --- */}
                {view === 'userAge' && (
                    <div className="auth-fade-in auth-step">
                        <button className="back-link" onClick={() => mode === 'anonymous' ? setView('userMode') : setView('userName')}>← Back</button>
                        <h2>One last thing.</h2>
                        <p className="auth-sub">This helps the AI safely tailor its emotional responses.</p>
                        <div className="auth-options-row">
                            {['13-19', '20-30', '30+'].map(age => (
                                <button
                                    key={age}
                                    className={`auth-btn-pill ${ageGroup === age ? 'active' : ''}`}
                                    onClick={() => setAgeGroup(age)}
                                >
                                    {age} years
                                </button>
                            ))}
                        </div>
                        <button
                            className="auth-nav-next primary-action"
                            disabled={!ageGroup || loading}
                            onClick={() => handleUserRegister(mode, nickname, ageGroup)}
                        >
                            {loading ? 'Entering...' : 'Enter the room'} <IconArrowRight />
                        </button>
                    </div>
                )}

                {/* --- THERAPIST LOGIN --- */}
                {view === 'therapistLogin' && (
                    <div className="auth-fade-in auth-step">
                        <button className="back-link" onClick={() => setView('welcome')}>← Back</button>
                        <h2>Therapist Portal</h2>
                        <div className="auth-form-fields">
                            <input className="auth-soft-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                            <input className="auth-soft-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                        <button className="auth-nav-next primary-action" disabled={loading} onClick={handleTherapistLogin}>
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                        <button className="auth-text-btn" onClick={() => setView('therapistRegister')}>Create a new clinical account</button>
                    </div>
                )}

                {/* --- THERAPIST REGISTER --- */}
                {view === 'therapistRegister' && (
                    <div className="auth-fade-in auth-step">
                        <button className="back-link" onClick={() => setView('therapistLogin')}>← Back</button>
                        <h2>New Clinical Account</h2>
                        <div className="auth-form-fields">
                            <input className="auth-soft-input" placeholder="Dr. Full Name" value={tName} onChange={e => setTName(e.target.value)} />
                            <input className="auth-soft-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                            <input className="auth-soft-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                        <button className="auth-nav-next primary-action" disabled={loading} onClick={handleTherapistRegister}>
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AuthPage
