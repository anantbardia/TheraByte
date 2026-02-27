import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { SoftBlob, RotatingStar, FloatingRing } from '../components/Decorations'
import './LandingPage.css'

/* ── Minimal, Thin SVG Icons ── */
const IconBrain = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
)
const IconShield = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
)
const IconHeart = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
)
const IconSun = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="4.22" x2="19.78" y2="5.64" />
    </svg>
)
const IconArrow = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
)

const FEATURES = [
    { icon: <IconHeart />, title: 'A safe space to reflect', desc: 'No judgement, no rush. Take your time to unpack your thoughts with an AI that listens deeply.' },
    { icon: <IconSun />, title: 'Gentle emotional framing', desc: 'Identify cognitive distortions and reframe anxious thoughts using validated therapeutic techniques.' },
    { icon: <IconBrain />, title: 'Grows with you', desc: 'The companion remembers what helps you most, creating a personalized psychological safety net over time.' },
    { icon: <IconShield />, title: 'Human support when needed', desc: 'If things get overwhelming, we gently guide you toward licensed human therapists ready to step in.' },
]

const STEPS = [
    {
        num: '01',
        title: 'Enter a quiet space',
        desc: 'No complicated forms. Just a single tap to start a private, anonymous session whenever you need to talk.',
    },
    {
        num: '02',
        title: 'Share at your own pace',
        desc: 'Write or speak your thoughts. The AI responds with warmth, helping you untangle complex emotions step by step.',
    },
    {
        num: '03',
        title: 'Find clarity',
        desc: 'Walk away from each session feeling more grounded, with practical coping strategies tailored to your mind.',
    },
]

const TESTIMONIALS = [
    { quote: "It feels like sitting in a sunlit room with someone who just gets it.", author: "Anonymous User" },
    { quote: "There's no pressure to 'fix' myself immediately. Just space to breathe.", author: "Anonymous User" }
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
            { threshold: 0.15 }
        )
        document.querySelectorAll('.reveal').forEach(el => {
            el.style.opacity = '0'
            el.style.transform = 'translateY(30px)' /* softer reveal */
            el.style.transition = 'opacity 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)'
            observer.observe(el)
        })
        return () => observer.disconnect()
    }, [])

    return (
        <div className="landing">
            {/* ── Soft Nav ── */}
            <nav className="landing-nav">
                <div className="nav-brand">
                    <img src="/images/therabyte-icon.png" alt="TheraByte" className="nav-logo-img" />
                    <span>TheraByte</span>
                </div>
                <div className="nav-links">
                    <a className="nav-link" href="#space">The Space</a>
                    <a className="nav-link" href="#journey">The Journey</a>
                </div>
                <Link to="/login" className="nav-cta">Begin session</Link>
            </nav>

            {/* ── Breathable Hero ── */}
            <section className="hero-section">
                <div className="hero-content reveal">
                    <div className="hero-pill">Not a clinic. A sanctuary.</div>
                    <h1 className="hero-headline">
                        A quiet place for your mind.
                    </h1>
                    <p className="hero-desc">
                        An emotionally intelligent companion designed to help you reflect, regulate, and find calm. No pressure, just presence.
                    </p>
                    <div className="hero-actions">
                        <Link to="/login" className="btn-primary-soft">
                            Enter the room <IconArrow />
                        </Link>
                        <div className="hero-trust-note">Anonymous • Free to start • Confidential</div>
                    </div>
                </div>

                {/* ── Additional Gentle Static/Floating Elements ── */}
                <SoftBlob color="var(--primary-mint-dim)" size={240} style={{ top: '15%', right: '-5%' }} />
                <RotatingStar color="var(--amber-100)" size={40} style={{ top: '25%', left: '15%' }} />
                <FloatingRing color="var(--teal-200)" size={80} thickness={1} style={{ bottom: '20%', left: '10%' }} />

                {/* ── Additional Gentle Static/Floating Elements ── */}
                <SoftBlob color="var(--primary-mint-dim)" size={240} style={{ top: '15%', right: '-5%' }} />
                <RotatingStar color="var(--amber-100)" size={40} style={{ top: '25%', left: '15%' }} />
                <FloatingRing color="var(--teal-200)" size={80} thickness={1} style={{ bottom: '20%', left: '10%' }} />

                {/* ── Moving Soft Visuals (CSS Only) ── */}
                <div className="hero-abstract-art reveal">
                    <div className="art-circle c1"></div>
                    <div className="art-circle c2"></div>
                    <div className="art-circle c3"></div>
                    <div className="art-circle c4"></div>
                </div>
            </section>

            {/* ── Features (The Space) ── */}
            <section className="features-section" id="space" style={{ position: 'relative' }}>
                <SoftBlob color="var(--amber-50)" size={400} style={{ top: '-10%', left: '-10%' }} className="delay-2" />
                <FloatingRing color="var(--slate-200)" size={150} thickness={2} style={{ bottom: '-5%', right: '-5%' }} />

                <div className="section-header reveal">
                    <h2 className="section-title">Designed for emotional safety</h2>
                    <p className="section-desc">Every interaction is built to lower your heart rate and provide cognitive ease.</p>
                </div>
                <div className="feature-grid">
                    {FEATURES.map((f, i) => (
                        <div key={i} className="feature-card reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                            <div className="fc-icon">{f.icon}</div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Testimonials (Minimal, subtle) ── */}
            <section className="testimonial-section reveal">
                <div className="test-flex">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className="test-card">
                            <p className="test-quote">"{t.quote}"</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── How it works (The Journey) ── */}
            <section className="how-section" id="journey" style={{ position: 'relative' }}>
                <RotatingStar color="var(--primary-mint-light)" size={60} style={{ top: '40%', right: '5%' }} />
                <SoftBlob color="rgba(126, 191, 181, 0.05)" size={500} style={{ bottom: '-15%', left: '-20%' }} />
                <div className="how-inner">
                    <div className="section-header reveal">
                        <h2 className="section-title">A gentle journey</h2>
                    </div>
                    <div className="steps-flow">
                        {STEPS.map((s, i) => (
                            <div key={i} className="step-item reveal" style={{ transitionDelay: `${i * 0.15}s` }}>
                                <div className="step-num">{s.num}</div>
                                <div className="step-text">
                                    <h3>{s.title}</h3>
                                    <p>{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Soft CTA Bottom ── */}
            <div className="cta-banner reveal">
                <h2>Whenever you're ready.</h2>
                <p>Take a deep breath. We are here when you need us.</p>
                <Link to="/login" className="btn-primary-soft">
                    Start your session
                </Link>
            </div>

            {/* ── Footer ── */}
            <footer className="landing-footer">
                <div className="footer-brand">
                    <img src="/images/therabyte-icon.png" alt="TheraByte" className="footer-logo-img" />
                    <span>TheraByte</span>
                </div>
                <div className="footer-links">
                    <a href="#">Privacy</a>
                    <Link to="/terms">Terms</Link>
                    <Link to="/login">Therapist Login</Link>
                </div>
            </footer>
        </div>
    )
}

export default LandingPage
