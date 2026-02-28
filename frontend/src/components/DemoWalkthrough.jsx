import { useState, useEffect, useRef } from 'react'
import './DemoWalkthrough.css'

/* ── SVG Icons (matching landing page stroke style) ── */
const IconVideo = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="14" height="14" rx="2" /><path d="m16 10 6-3v10l-6-3" />
    </svg>
)
const IconCalendar = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
)
const IconArrow = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
)
const IconClose = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
)

/* ── Pre-scripted Demo Scenes ─────────────────────────────── */
const SCENES = [
    {
        id: 'welcome',
        label: 'Warm Welcome',
        step: '01',
        description: 'TheraByte greets the user and asks for consent before any therapy begins',
        chat: [
            { role: 'assistant', text: "Hi, I'm really glad you're here. This is a completely private, judgment-free space.\n\nBefore we dive in, would it be okay if I asked you a few short questions to understand how you're doing? It will only take a moment.", delay: 0 },
            { role: 'user', text: "Yes, that's fine. I've just been feeling a bit off lately.", delay: 2000 },
            { role: 'assistant', text: "Thank you for sharing that — it takes courage to even say that out loud. I appreciate you being here.", delay: 3800 },
        ]
    },
    {
        id: 'assessment',
        label: 'Emotional Check-in',
        step: '02',
        description: 'A structured 5-point assessment — no advice given until the full picture is understood',
        chat: [
            { role: 'assistant', text: "On a scale of 0 to 10, how intense is what you're feeling right now — 0 being completely fine, 10 being overwhelmed?", delay: 0 },
            { role: 'user', text: "Maybe a 6. It's been affecting my sleep and I can't stop overthinking.", delay: 1800 },
            { role: 'assistant', text: "A 6 with sleep disruption and repetitive thoughts — that's meaningful and worth taking seriously.\n\nHow long have you been feeling this way?", delay: 3600 },
            { role: 'user', text: "About two weeks. Ever since my workload doubled.", delay: 5200 },
            { role: 'assistant', text: "Two weeks of sustained overwhelm with a clear external trigger. That context matters a lot.\n\nRight now, in this moment — do you feel safe?", delay: 7000 },
            { role: 'user', text: "Yes, I feel safe. Just really exhausted.", delay: 8600 },
        ]
    },
    {
        id: 'therapy',
        label: 'Guided Therapy',
        step: '03',
        description: 'AI selects the right technique based on symptoms — CBT Thought Record for overthinking patterns',
        chat: [
            { role: 'assistant', text: "Based on what you've shared — intensity 6, two weeks duration, sleep impact, and racing thoughts — let's work through something concrete together.", delay: 0 },
            { role: 'user', text: "What can I actually do about it?", delay: 1800 },
            { role: 'assistant', text: "Let's use a CBT Thought Record — one of the most effective tools for exactly your pattern.\n\n**Step 1:** Name the situation causing the overthinking.\n**Step 2:** Write the automatic thought (e.g. \"I'm going to fail at this\").\n**Step 3:** Ask — is this a fact, or an interpretation?\n\nWhat's the specific thought that keeps looping?", delay: 3400 },
            { role: 'user', text: "That if I don't do everything perfectly, my manager will think I'm incompetent.", delay: 5000 },
            { role: 'assistant', text: "That's a known cognitive distortion called all-or-nothing thinking.\n\nFact check: Has your manager ever given you feedback that actually supports this fear — or is this thought built entirely on anticipation?", delay: 6800 },
        ]
    },
    {
        id: 'booking',
        label: 'Therapist Connect',
        step: '04',
        description: 'When the user is ready, a seamless bridge to a real licensed therapist — one tap away',
        chat: [
            { role: 'user', text: "This is helpful but I think I need more than this. Can I talk to someone?", delay: 0 },
            { role: 'assistant', text: "Absolutely — and I think that's a very wise decision given what you've been carrying for two weeks.\n\nI can connect you with a licensed therapist on this platform for a private video session. Would you like me to set that up?", delay: 1800 },
            { role: 'user', text: "Yes, please.", delay: 3400 },
            { role: 'booking', delay: 4800 },
        ]
    },
]

/* ── DemoWalkthrough Component ───────────────────────────── */
const DemoWalkthrough = ({ onClose }) => {
    const [sceneIndex, setSceneIndex] = useState(0)
    const [visibleMessages, setVisibleMessages] = useState([])
    const [isTyping, setIsTyping] = useState(false)
    const [sceneComplete, setSceneComplete] = useState(false)
    const chatEndRef = useRef(null)
    const timersRef = useRef([])

    const scene = SCENES[sceneIndex]

    const clearTimers = () => {
        timersRef.current.forEach(clearTimeout)
        timersRef.current = []
    }

    useEffect(() => {
        setVisibleMessages([])
        setIsTyping(false)
        setSceneComplete(false)
        clearTimers()

        const msgs = scene.chat

        msgs.forEach((msg, i) => {
            if (msg.role === 'assistant' || msg.role === 'booking') {
                const typingTimer = setTimeout(() => setIsTyping(true), msg.delay)
                timersRef.current.push(typingTimer)
            }

            const showDelay = msg.delay + (msg.role === 'assistant' || msg.role === 'booking' ? 1000 : 0)
            const t = setTimeout(() => {
                setIsTyping(false)
                setVisibleMessages(prev => [...prev, msg])
                if (i === msgs.length - 1) {
                    setTimeout(() => setSceneComplete(true), 500)
                }
            }, showDelay)
            timersRef.current.push(t)
        })

        return clearTimers
    }, [sceneIndex])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [visibleMessages, isTyping])

    const goNext = () => {
        if (sceneIndex < SCENES.length - 1) setSceneIndex(s => s + 1)
        else onClose()
    }
    const goPrev = () => { if (sceneIndex > 0) setSceneIndex(s => s - 1) }

    const renderText = (text) =>
        text.split('\n').map((line, j, arr) => (
            <span key={j}>
                {line.split(/(\*\*[^*]+\*\*)/).map((part, k) =>
                    part.startsWith('**') ? <strong key={k}>{part.slice(2, -2)}</strong> : part
                )}
                {j < arr.length - 1 && <br />}
            </span>
        ))

    return (
        <div className="demo-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="demo-modal">

                {/* Header */}
                <div className="demo-header">
                    <div className="demo-header-left">
                        <div className="demo-eyebrow">Interactive Demo</div>
                        <div className="demo-title">{scene.label}</div>
                    </div>
                    <button className="demo-close" onClick={onClose} aria-label="Close demo">
                        <IconClose />
                    </button>
                </div>

                {/* Step Progress */}
                <div className="demo-steps">
                    {SCENES.map((s, i) => (
                        <button
                            key={s.id}
                            className={`demo-step ${i === sceneIndex ? 'active' : ''} ${i < sceneIndex ? 'done' : ''}`}
                            onClick={() => setSceneIndex(i)}
                        >
                            <span className="demo-step-num">{s.step}</span>
                            <span className="demo-step-label">{s.label}</span>
                        </button>
                    ))}
                </div>

                {/* Scene description */}
                <div className="demo-desc">{scene.description}</div>

                {/* Mock Chat Window */}
                <div className="demo-chat">
                    <div className="demo-chat-header">
                        <div className="demo-chat-avatar">
                            <img src="/images/therabyte-icon.png" alt="TheraByte" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <div>
                            <div className="demo-chat-name">TheraByte AI</div>
                            <div className="demo-chat-status">
                                <span className="demo-status-dot" />
                                Assessment Mode
                            </div>
                        </div>
                        <div className="demo-label-chip">Demo</div>
                    </div>

                    <div className="demo-messages">
                        {visibleMessages.map((msg, i) => {
                            if (msg.role === 'booking') return (
                                <div key={i} className="demo-booking-card">
                                    <div className="demo-booking-inner">
                                        <div className="demo-booking-icon"><IconVideo /></div>
                                        <div>
                                            <div className="demo-booking-title">Connect with a Therapist</div>
                                            <div className="demo-booking-sub">Book a private video session for deeper support</div>
                                        </div>
                                    </div>
                                    <div className="demo-booking-btns">
                                        <div className="demo-book-primary"><IconCalendar /> Schedule Appointment</div>
                                        <div className="demo-book-secondary"><IconVideo /> Join Now</div>
                                    </div>
                                </div>
                            )
                            return (
                                <div key={i} className={`demo-msg-row ${msg.role}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="demo-msg-avatar">
                                            <img src="/images/therabyte-icon.png" alt="TB" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </div>
                                    )}
                                    <div className={`demo-bubble ${msg.role}`}>
                                        {renderText(msg.text)}
                                    </div>
                                </div>
                            )
                        })}

                        {isTyping && (
                            <div className="demo-msg-row assistant">
                                <div className="demo-msg-avatar">
                                    <img src="/images/therabyte-icon.png" alt="TB" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                                <div className="demo-typing">
                                    <span /><span /><span />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="demo-input-bar">
                        <div className="demo-input-mock">This is a read-only demo</div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="demo-nav">
                    <button className="demo-nav-ghost" onClick={goPrev} disabled={sceneIndex === 0}>
                        Previous
                    </button>
                    <div className="demo-dots">
                        {SCENES.map((_, i) => (
                            <div key={i} className={`demo-dot ${i === sceneIndex ? 'active' : ''}`} />
                        ))}
                    </div>
                    <button
                        className={`demo-nav-primary ${!sceneComplete ? 'muted' : ''}`}
                        onClick={goNext}
                        disabled={!sceneComplete}
                    >
                        {!sceneComplete
                            ? 'Loading...'
                            : sceneIndex === SCENES.length - 1
                                ? <><span>Create your account</span> <IconArrow /></>
                                : <><span>Next</span> <IconArrow /></>
                        }
                    </button>
                </div>

                {sceneIndex === SCENES.length - 1 && sceneComplete && (
                    <div className="demo-cta-strip">
                        Ready to experience this for real?
                        <a href="/login" className="demo-cta-link">Begin session <IconArrow /></a>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DemoWalkthrough
