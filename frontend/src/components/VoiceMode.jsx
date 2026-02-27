import React, { useState, useEffect, useRef, useCallback } from 'react'
import './VoiceMode.css'

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TTS  – waits for voices to load, picks a nice one
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const getVoice = () => {
    const voices = window.speechSynthesis?.getVoices() || []
    const preferred = [
        'Google US English', 'Google UK English Female',
        'Samantha', 'Karen', 'Moira', 'en-US', 'en-GB',
    ]
    for (const name of preferred) {
        const v = voices.find(v => v.name.includes(name) || v.lang === name)
        if (v) return v
    }
    return voices.find(v => v.lang?.startsWith('en')) || voices[0] || null
}

const speakText = (text, onEnd) => {
    if (!window.speechSynthesis) { onEnd?.(); return }
    window.speechSynthesis.cancel()

    const clean = text
        .replace(/[*_#\[\]>~`]/g, '')
        .replace(/\n+/g, '. ')
        .trim()
    if (!clean) { onEnd?.(); return }

    const doSpeak = () => {
        const utt = new SpeechSynthesisUtterance(clean)
        const voice = getVoice()
        if (voice) utt.voice = voice
        utt.rate = 0.88
        utt.pitch = 1.05
        utt.volume = 1.0
        utt.onend = onEnd
        utt.onerror = onEnd
        window.speechSynthesis.speak(utt)
    }

    // Voices load asynchronously – wait if not ready yet
    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true })
        setTimeout(doSpeak, 500)   // fallback if event never fires
    } else {
        doSpeak()
    }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Animated orb (CSS-only, no canvas dep for waveform)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const Orb = ({ state }) => (
    <div className={`vm-orb-wrap`}>
        <div className={`vm-ring vm-ring-1 ${state}`} />
        <div className={`vm-ring vm-ring-2 ${state}`} />
        <div className={`vm-ring vm-ring-3 ${state}`} />
        <div className={`vm-orb ${state}`}>
            {state === 'idle' && <MicIcon />}
            {state === 'listening' && <MicIcon />}
            {state === 'processing' && <Spinner />}
            {state === 'speaking' && <SpeakerIcon />}
        </div>
    </div>
)

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Micro icon components
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const MicIcon = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
const MicOffIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="2" y1="2" x2="22" y2="22" /><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" /><path d="M5 10v2a7 7 0 0 0 12 3" /><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
const SpeakerIcon = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
const Spinner = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 0.9s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
const StopIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="3" /></svg>
const CloseIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
const SkipIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   State machine constants
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const S = { IDLE: 'idle', LISTENING: 'listening', PROCESSING: 'processing', SPEAKING: 'speaking' }
const LABELS = { idle: 'Tap to speak', listening: 'Listening…', processing: 'Thinking…', speaking: 'Speaking' }

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Main VoiceMode component
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const VoiceMode = ({ auth, onClose, initialMessages }) => {
    const [state, setState] = useState(S.IDLE)
    const [transcript, setTranscript] = useState('')
    const [interim, setInterim] = useState('')
    const [aiText, setAiText] = useState('')
    const [autoLoop, setAutoLoop] = useState(true)   // on by default: hands-free
    const [error, setError] = useState('')
    const [messages, setMessages] = useState(initialMessages || [])
    const [history, setHistory] = useState([]) // conversation turn history shown in panel

    const recogRef = useRef(null)
    const stateRef = useRef(S.IDLE)
    const autoRef = useRef(true)
    const messagesRef = useRef(initialMessages || [])
    const silenceTimerRef = useRef(null)

    useEffect(() => { stateRef.current = state }, [state])
    useEffect(() => { autoRef.current = autoLoop }, [autoLoop])
    useEffect(() => { messagesRef.current = messages }, [messages])

    // Cleanup on unmount
    useEffect(() => () => {
        recogRef.current?.abort()
        window.speechSynthesis?.cancel()
        clearTimeout(silenceTimerRef.current)
    }, [])

    /* ─── Send to AI ─── */
    const sendToAI = useCallback(async (text) => {
        if (!text.trim()) { setState(S.IDLE); return }
        setState(S.PROCESSING)
        setAiText('')
        setTranscript('')
        setInterim('')

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const next = [...messagesRef.current, { role: 'user', content: text, time }]
        setMessages(next)
        messagesRef.current = next
        setHistory(h => [...h, { role: 'user', text }])

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: next,
                    user_id: auth.user_id,
                    session_id: auth.session_id,
                }),
            })
            if (!res.ok) throw new Error('API error')
            const data = await res.json()

            const aiMsg = { role: data.role, content: data.content, time }
            const withAi = [...next, aiMsg]
            setMessages(withAi)
            messagesRef.current = withAi
            setAiText(data.content)
            setHistory(h => [...h, { role: 'assistant', text: data.content }])
            setState(S.SPEAKING)

            speakText(data.content, () => {
                if (stateRef.current !== S.SPEAKING) return // was stopped
                if (autoRef.current) {
                    setTimeout(() => startListening(), 350) // tiny gap feels natural
                } else {
                    setState(S.IDLE)
                }
            })
        } catch {
            setError('Connection lost. Check backend.')
            setState(S.IDLE)
        }
    }, [auth])

    /* ─── Build recognition instance ─── */
    const buildRecog = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) {
            setError('Speech recognition not supported — use Chrome or Edge.')
            return null
        }
        const r = new SR()
        r.lang = 'en-IN'   // works well for Indian English + accent
        r.continuous = true
        r.interimResults = true
        r.maxAlternatives = 1

        r.onstart = () => setState(S.LISTENING)

        r.onresult = (e) => {
            clearTimeout(silenceTimerRef.current)
            let fin = '', tmp = ''
            for (let i = e.resultIndex; i < e.results.length; i++) {
                if (e.results[i].isFinal) fin += e.results[i][0].transcript + ' '
                else tmp += e.results[i][0].transcript
            }
            if (fin) setTranscript(prev => (prev + fin).trimStart())
            setInterim(tmp)

            // Auto-send after 2s of silence (feels natural)
            silenceTimerRef.current = setTimeout(() => {
                setTranscript(prev => {
                    const t = (prev + fin).trim()
                    if (t && stateRef.current === S.LISTENING) {
                        recogRef.current?.stop()
                        setTimeout(() => sendToAI(t), 0)
                    }
                    return t
                })
            }, 2000)
        }

        r.onend = () => {
            setInterim('')
            // Only auto-submit if still in listening (recognition stopped naturally)
            setTranscript(prev => {
                const t = prev.trim()
                if (t && stateRef.current === S.LISTENING) {
                    setTimeout(() => sendToAI(t), 0)
                } else if (stateRef.current === S.LISTENING) {
                    setState(S.IDLE)
                }
                return prev
            })
        }

        r.onerror = (e) => {
            clearTimeout(silenceTimerRef.current)
            if (e.error === 'not-allowed') {
                setError('Microphone permission denied. Please allow mic access.')
            } else if (e.error !== 'aborted' && e.error !== 'no-speech') {
                setError(`Mic error: ${e.error}`)
            }
            if (stateRef.current === S.LISTENING) setState(S.IDLE)
        }

        return r
    }, [sendToAI])

    /* ─── Controls ─── */
    const startListening = useCallback(() => {
        if (stateRef.current === S.PROCESSING) return
        setError('')
        setTranscript('')
        setInterim('')
        window.speechSynthesis?.cancel()
        recogRef.current?.abort()
        const r = buildRecog()
        if (!r) return
        recogRef.current = r
        try { r.start() } catch { setError('Could not start microphone.') }
    }, [buildRecog])

    const stopListening = useCallback(() => {
        clearTimeout(silenceTimerRef.current)
        recogRef.current?.stop()
    }, [])

    const stopSpeaking = useCallback(() => {
        window.speechSynthesis?.cancel()
        if (autoRef.current) startListening()
        else setState(S.IDLE)
    }, [startListening])

    const stopAll = useCallback(() => {
        clearTimeout(silenceTimerRef.current)
        recogRef.current?.abort()
        window.speechSynthesis?.cancel()
        setState(S.IDLE)
        setTranscript('')
        setInterim('')
        setAiText('')
    }, [])

    /* ─── Main orb button handler ─── */
    const handleOrbClick = () => {
        if (state === S.IDLE) startListening()
        else if (state === S.LISTENING) stopListening()
        else if (state === S.SPEAKING) stopSpeaking()
    }

    return (
        <div className="vm-overlay">
            {/* Close */}
            <button className="vm-ctrl-btn" onClick={() => { stopAll(); onClose() }}
                style={{ position: 'absolute', top: 24, right: 24 }}>
                <CloseIcon /> Close
            </button>

            {/* Ambient glow */}
            <div className={`vm-glow ${state}`} />

            <div className="vm-content">
                {/* Status label */}
                <div className="vm-state-badge" style={{ marginBottom: 8 }}>
                    <span className={`vm-state-dot ${state === 'idle' ? 'muted' : state === 'processing' ? 'amber' : ''}`} />
                    {LABELS[state]}
                </div>

                {/* Orb — tap to toggle */}
                <div style={{ cursor: 'pointer' }} onClick={handleOrbClick}>
                    <Orb state={state} />
                </div>

                {/* Live transcript */}
                <div className="vm-transcript" style={{ minHeight: 56, marginTop: 24 }}>
                    {state === S.IDLE && !transcript && (
                        <span className="vm-transcript-placeholder">
                            {error || (autoLoop ? 'Tap orb → speak → AI replies and listens again' : 'Tap orb to speak')}
                        </span>
                    )}
                    {state === S.LISTENING && (
                        <>
                            {transcript && <span style={{ color: 'var(--teal-800)' }}>{transcript} </span>}
                            {interim && <span className="vm-interim">{interim}</span>}
                            {!transcript && !interim && <span className="vm-transcript-placeholder">Speak naturally…</span>}
                        </>
                    )}
                    {state === S.PROCESSING && transcript && (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{transcript}"</span>
                    )}
                    {state === S.SPEAKING && aiText && (
                        <div className="vm-ai-response">{aiText}</div>
                    )}
                </div>

                {/* Controls row */}
                <div className="vm-controls" style={{ marginTop: 28 }}>
                    {/* Stop button always visible when active */}
                    {state !== S.IDLE && (
                        <button className="vm-ctrl-btn danger" onClick={stopAll}>
                            <StopIcon /> Stop
                        </button>
                    )}

                    {/* Skip TTS */}
                    {state === S.SPEAKING && (
                        <button className="vm-ctrl-btn" onClick={stopSpeaking} title="Skip to listening">
                            <SkipIcon /> Skip
                        </button>
                    )}

                    {/* Auto-loop toggle */}
                    <button
                        className="vm-ctrl-btn"
                        onClick={() => setAutoLoop(p => !p)}
                        style={autoLoop ? { background: 'rgba(15,118,110,0.2)', borderColor: 'rgba(45,212,191,0.4)', color: '#0f766e' } : {}}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
                        {autoLoop ? 'Auto-loop ON' : 'Auto-loop'}
                    </button>
                </div>

                {/* Conversation history */}
                {history.length > 0 && (
                    <div style={{
                        marginTop: 32, maxHeight: 200, overflowY: 'auto', width: '100%',
                        borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8
                    }}>
                        {history.slice(-6).map((h, i) => (
                            <div key={i} style={{
                                textAlign: h.role === 'user' ? 'right' : 'left',
                                fontSize: '0.85rem',
                                color: h.role === 'user' ? 'var(--teal-700)' : 'var(--text-secondary)',
                                padding: '6px 12px',
                                background: h.role === 'user' ? 'rgba(126,191,181,0.12)' : 'rgba(0,0,0,0.03)',
                                borderRadius: 12,
                            }}>
                                {h.text.length > 120 ? h.text.slice(0, 120) + '…' : h.text}
                            </div>
                        ))}
                    </div>
                )}

                <div className="vm-hint" style={{ marginTop: 16 }}>
                    {autoLoop
                        ? '🔄 Hands-free — AI listens again after every reply'
                        : 'Tap the orb to speak · Toggle Auto-loop for hands-free mode'}
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}

export default VoiceMode
