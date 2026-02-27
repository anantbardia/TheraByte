import { useState, useRef, useEffect } from 'react'
import ChatBubble from '../components/ChatBubble'
import InputArea from '../components/InputArea'
import MoodTracker from '../components/MoodTracker'
import { WeatherWidget, QuoteWidget, HelplineWidget } from '../components/InfoWidgets'
import BreathingModal from '../components/BreathingModal'
import VoiceMode from '../components/VoiceMode'
import './ChatSession.css'

const speak = (text) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text.replace(/[*_#\[\]]/g, ''))
    utt.rate = 0.9; utt.pitch = 1; utt.volume = 0.8
    window.speechSynthesis.speak(utt)
}

const QUICK_REPLIES = [
    { text: "I've been feeling overwhelmed lately" },
    { text: "I'm struggling with anxiety" },
    { text: "I feel really low today" },
    { text: "I can't stop overthinking" },
    { text: "I haven't been sleeping well" },
]

const formatDuration = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

// Icon components
const IconVolume = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
const IconVolumeX = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
const IconWind = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" /><path d="M9.6 4.6A2 2 0 1 1 11 8H2" /><path d="M12.6 19.4A2 2 0 1 0 14 16H2" /></svg>
const IconClock = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
const IconMessageCircle = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>

const ChatSession = ({ auth }) => {
    const [messages, setMessages] = useState([{
        role: 'assistant',
        content: "Welcome to TheraByte. This is a safe, completely private space.\n\nI use structured therapeutic frameworks — CBT, DBT, and ACT — to help you gain clarity about what you're experiencing. Everything here is anonymous and encrypted.\n\nHow are you feeling right now?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }])
    const [isLoading, setIsLoading] = useState(false)
    const [tts, setTts] = useState(false)
    const [showBreathing, setShowBreathing] = useState(false)
    const [showVoiceMode, setShowVoiceMode] = useState(false)
    const [quickRepliesVisible, setQuickRepliesVisible] = useState(true)
    const [sessionSeconds, setSessionSeconds] = useState(0)
    const endRef = useRef(null)
    const timerRef = useRef(null)

    useEffect(() => {
        const fetchHistory = async () => {
            if (!auth || !auth.session_id) return;
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${auth.session_id}/messages`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && Array.isArray(data) && data.length > 0) {
                        const history = data.map(m => {
                            const d = new Date(m.timestamp); // SQLite dates saved as local isoformat
                            return {
                                role: m.role,
                                content: m.content,
                                time: isNaN(d) ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            };
                        });
                        setMessages(history);
                    }
                }
            } catch (err) {
                console.error("Failed to load chat history", err);
            }
        };
        fetchHistory();
    }, [auth?.session_id]);

    useEffect(() => {
        timerRef.current = setInterval(() => setSessionSeconds(s => s + 1), 1000)
        return () => clearInterval(timerRef.current)
    }, [])

    useEffect(() => {
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }, [messages, isLoading])

    const sendMessage = async (text) => {
        if (!text.trim()) return
        setQuickRepliesVisible(false)
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const next = [...messages, { role: 'user', content: text, time }]
        setMessages(next); setIsLoading(true)
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: next, user_id: auth.user_id, session_id: auth.session_id }),
            })
            if (!res.ok) throw new Error()
            const data = await res.json()
            const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            let content = data.content || ''

            // Detect booking trigger — strip the marker and show booking card
            const shouldBook = content.includes('ACTION: BOOK_SESSION')
            content = content.replace(/ACTION:\s*BOOK_SESSION/g, '').trim()

            setMessages(prev => [
                ...prev,
                { role: data.role, content, time: aiTime },
                ...(shouldBook ? [{
                    role: 'system-booking',
                    content: '_booking_card_',
                    time: aiTime
                }] : [])
            ])
            if (tts && content) speak(content)
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Connection interrupted. Please try again.', isError: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
        }
        setIsLoading(false)
    }

    const handleMood = async (m) => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/mood`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mood: m.label, user_id: auth.user_id, session_id: auth.session_id })
            })
        } catch { /* silent */ }
    }

    return (
        <div className="chat-page">
            {showBreathing && <BreathingModal onClose={() => setShowBreathing(false)} />}
            {showVoiceMode && (
                <VoiceMode
                    auth={auth}
                    initialMessages={messages}
                    onClose={() => setShowVoiceMode(false)}
                />
            )}

            {/* Topbar */}
            <div className="chat-topbar">
                <div className="ct-left">
                    <div className="ct-indicator" />
                    <span className="ct-title">AI Support Session</span>
                    <span className="ct-id">#{auth.session_id?.toString().slice(0, 8)}</span>
                    <span className="ct-timer"><IconClock />{formatDuration(sessionSeconds)}</span>
                </div>
                <div className="ct-right">
                    {/* Voice Mode button */}
                    <button
                        className="vm-launch-btn"
                        onClick={() => setShowVoiceMode(true)}
                        title="Switch to voice conversation"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" x2="12" y1="19" y2="22" />
                        </svg>
                        Voice Mode
                    </button>
                    <button
                        className={`ct-icon ${tts ? 'on' : ''}`}
                        onClick={() => { setTts(!tts); if (tts) window.speechSynthesis?.cancel() }}
                        title={tts ? 'Mute voice' : 'Enable voice'}
                    >
                        {tts ? <IconVolume /> : <IconVolumeX />}
                    </button>
                    <button className="ct-icon" onClick={() => setShowBreathing(true)} title="Guided breathing">
                        <IconWind />
                    </button>
                    <button
                        className="btn-primary"
                        onClick={() => window.location.href = `/app/feedback?type=chat&session_id=${auth.session_id}`}
                        style={{ padding: '6px 12px', fontSize: '0.85rem', marginLeft: 8 }}
                        title="End session and leave feedback"
                    >
                        End Session
                    </button>
                    <div className="ct-badge">
                        <span className="ct-badge-dot" />
                        Encrypted
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="chat-body">
                <div className="chat-col">
                    <div className="chat-widgets">
                        <WeatherWidget /><QuoteWidget /><HelplineWidget />
                    </div>
                    <div className="chat-mood">
                        <MoodTracker onSelect={handleMood} />
                    </div>
                    {quickRepliesVisible && messages.length <= 1 && (
                        <div className="chat-quick-replies">
                            {QUICK_REPLIES.map((qr, i) => (
                                <button key={i} className="qr-chip" onClick={() => sendMessage(qr.text)}>
                                    <IconMessageCircle />
                                    {qr.text}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="chat-messages">
                        {messages.map((m, i) => {
                            if (m.role === 'system-booking') return (
                                <div key={i} style={{
                                    alignSelf: 'flex-start',
                                    background: 'linear-gradient(135deg, rgba(126,191,181,0.15), rgba(126,191,181,0.05))',
                                    border: '1.5px solid rgba(126,191,181,0.35)',
                                    borderRadius: 20,
                                    padding: '20px 24px',
                                    maxWidth: 380,
                                    animation: 'fadeUp 0.4s ease',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--teal-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal-700)" strokeWidth="2"><rect x="2" y="5" width="14" height="14" rx="2" /><path d="m16 10 6-3v10l-6-3" /></svg>
                                        </div>
                                        <span style={{ fontWeight: 600, color: 'var(--teal-800)', fontSize: '0.95rem' }}>Video Session Available</span>
                                    </div>
                                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
                                        Connect with a licensed therapist for deeper, real-time support.
                                    </p>
                                    <button
                                        className="btn-primary"
                                        style={{ width: '100%', justifyContent: 'center', padding: '11px 20px', fontSize: '0.9rem' }}
                                        onClick={() => window.location.href = '/app/video'}
                                    >
                                        Book Video Session →
                                    </button>
                                </div>
                            )
                            return <ChatBubble key={i} message={m} onSpeak={speak} ttsEnabled={tts} />
                        })}
                        {isLoading && (
                            <div className="typing-indicator">
                                <span className="typing-label">TheraByte is thinking</span>
                                <div className="typing-dots"><span /><span /><span /></div>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>
                </div>
            </div>

            {/* Input */}
            <div className="chat-input-area">
                <div className="chat-input-col">
                    <InputArea onSend={sendMessage} disabled={isLoading} />
                </div>
            </div>
        </div>
    )
}

export default ChatSession
