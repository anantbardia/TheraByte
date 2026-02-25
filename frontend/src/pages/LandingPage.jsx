import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import './LandingPage.css'

/* ── SVG Icon Components ── */
const IconBrain = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
)
const IconShield = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
)
const IconActivity = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
)
const IconUsers = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
)
const IconMic = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
    </svg>
)
const IconBarChart = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
)
const IconCheck = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
)
const IconArrow = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
)
const IconLock = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
)

const FEATURES = [
    { icon: <IconActivity />, color: 'fc-teal', title: 'Triage Layer', desc: 'Every message is analyzed for emotional tone, cognitive distortions, and crisis signals before the AI formulates a response.' },
    { icon: <IconShield />, color: 'fc-amber', title: 'Crisis Detection', desc: 'Dynamic risk scores from 0–100. At 80+, normal therapy stops and crisis protocol activates with immediate de-escalation.' },
    { icon: <IconUsers />, color: 'fc-slate', title: 'Therapist Copilot', desc: 'AI generates intake summaries, tracks cognitive distortions, and provides real-time patient analysis during sessions.' },
    { icon: <IconBarChart />, color: 'fc-green', title: 'Patient Analytics', desc: 'Therapists see mood timelines, risk trends, session history, and AI-suggested focus areas in a single clinical view.' },
    { icon: <IconMic />, color: 'fc-teal', title: 'Voice Support', desc: 'Speak naturally. AI listens, analyzes emotional tone, and responds with calm, structured voice guidance.' },
    { icon: <IconBrain />, color: 'fc-amber', title: 'Adaptive Profiles', desc: 'Each user builds a psychological profile over time — triggers, distortions, effective interventions — so AI adapts continuously.' },
]

const STEPS = [
    {
        num: 'Step 01',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
        title: 'Start Anonymous',
        desc: 'No email. No account. Start a session instantly — your identity is cryptographically isolated.',
    },
    {
        num: 'Step 02',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
        title: 'AI Analyzes in Real Time',
        desc: 'Every message passes through 3 AI layers — our local model, risk scoring engine, and Gemini LLM — before a response arrives.',
    },
    {
        num: 'Step 03',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
        title: 'Therapist Reviews',
        desc: 'Licensed therapists can monitor sessions, review AI insights, and intervene when flagged by the risk detection engine.',
    },
]

const LandingPage = () => {
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.style.opacity = '1'
                    e.target.style.transform = 'translateY(0)'
                }
            }),
            { threshold: 0.10 }
        )
        document.querySelectorAll('.reveal').forEach(el => {
            el.style.opacity = '0'
            el.style.transform = 'translateY(22px)'
            el.style.transition = 'opacity 0.55s ease, transform 0.55s ease'
            observer.observe(el)
        })
        return () => observer.disconnect()
    }, [])

    return (
        <div className="landing">
            {/* ── Nav ── */}
            <nav className="landing-nav">
                <div className="nav-brand">
                    <img src="/images/therabyte-icon.png" alt="TheraByte icon" style={{ height: '32px', width: '32px', objectFit: 'contain' }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '17px', color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>TheraByte</span>
                </div>
                <div className="nav-links">
                    <a className="nav-link" href="#features">Features</a>
                    <a className="nav-link" href="#how">How it works</a>
                </div>
                <Link to="/login" className="nav-cta">Get Started</Link>
            </nav>

            {/* ── Hero ── */}
            <section className="hero-section" id="hero">
                <div className="hero-content">
                    <div className="hero-eyebrow">
                        <span className="eyebrow-dot" />
                        AI-Powered Mental Health Infrastructure
                    </div>
                    <h1 className="hero-headline">
                        Structured support<br />
                        for every mind.
                    </h1>
                    <p className="hero-desc">
                        TheraByte AI is a clinical-grade triage layer and therapist copilot.
                        We detect crises in real time, provide evidence-based therapeutic guidance,
                        and connect patients to their care team — all in one platform.
                    </p>
                    <div className="hero-actions">
                        <Link to="/login" className="btn-primary">
                            Start Free Session <IconArrow />
                        </Link>
                        <Link to="/login" className="btn-secondary">
                            Therapist Portal
                        </Link>
                    </div>
                    <div className="hero-trust">
                        <div className="hero-trust-item">
                            <IconLock />
                            <span>Anonymous sessions</span>
                        </div>
                        <div className="hero-trust-item">
                            <IconCheck />
                            <span>No account required</span>
                        </div>
                        <div className="hero-trust-item">
                            <IconShield />
                            <span>AI-guided support</span>
                        </div>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="hero-img-frame">
                        <div className="hero-ring" />
                        <div className="hero-ring-2" />
                        <img src="/images/hero-ai.png" alt="TheraByte AI Neural Interface" className="hero-img" />

                        <div className="hero-float-card hfc-top">
                            <div className="hfc-icon" style={{ background: 'rgba(121, 193, 176, 0.12)', color: '#2a8a78' }}>
                                <IconActivity />
                            </div>
                            <div>
                                <div className="hfc-label">Crisis Response</div>
                                <div className="hfc-value">Under 200ms</div>
                            </div>
                        </div>

                        <div className="hero-float-card hfc-bottom">
                            <div className="hfc-label">Risk Score</div>
                            <div className="hfc-value" style={{ color: 'var(--green-600)' }}>Safe</div>
                            <div className="hfc-sub">Monitoring active</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stats bar ── */}
            <div className="stats-bar reveal">
                <div className="stat-item">
                    <span className="stat-value">3</span>
                    <span className="stat-label">AI Layers</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">&lt;200ms</span>
                    <span className="stat-label">Crisis Detection</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">100%</span>
                    <span className="stat-label">Anonymous</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">CBT+DBT+ACT</span>
                    <span className="stat-label">Frameworks</span>
                </div>
            </div>

            {/* ── Features ── */}
            <section className="features-section" id="features">
                <div className="section-header reveal">
                    <div className="section-label">Capabilities</div>
                    <h2 className="section-title">Built for clinical-grade mental health delivery</h2>
                    <p className="section-desc">Every component is designed around evidence-based therapeutic practice and real-time crisis triage.</p>
                </div>
                <div className="feature-grid">
                    {FEATURES.map((f, i) => (
                        <div key={i} className="feature-card reveal">
                            <div className={`fc-icon ${f.color}`}>{f.icon}</div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="how-section" id="how">
                <div className="how-inner">
                    <div className="section-header reveal">
                        <div className="section-label">Process</div>
                        <h2 className="section-title">How TheraByte works</h2>
                        <p className="section-desc">A three-step pipeline that goes from anonymous connection to clinical insight — in seconds.</p>
                    </div>
                    <div className="steps-grid">
                        {STEPS.map((s, i) => (
                            <div key={i} className="step-card reveal" style={{ animationDelay: `${i * 0.12}s` }}>
                                <div className="step-icon">{s.icon}</div>
                                <div className="step-num">{s.num}</div>
                                <h3>{s.title}</h3>
                                <p>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <div className="cta-banner reveal">
                <h2>Ready to transform mental health delivery?</h2>
                <p>Start an anonymous session in seconds, or set up your therapist portal today.</p>
                <Link to="/login" className="btn-cta-white">
                    Get Started <IconArrow />
                </Link>
            </div>

            {/* ── Footer ── */}
            <footer className="landing-footer">
                <div className="footer-brand">
                    <img src="/images/therabyte-icon.png" alt="TheraByte" style={{ height: '24px', width: '24px', objectFit: 'contain' }} />
                    <span>TheraByte</span>
                </div>
                <p className="footer-note">
                    TheraByte does not replace licensed mental health professionals. It is a clinical support and AI-guided triage tool.
                </p>
                <div className="footer-links">
                    <a href="#">Privacy</a>
                    <Link to="/terms">Terms</Link>
                </div>
            </footer>
        </div>
    )
}

export default LandingPage
