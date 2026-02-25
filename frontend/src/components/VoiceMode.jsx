import React, { useState, useEffect, useRef, useCallback } from 'react'
import './VoiceMode.css'

/* ─── TTS helper ─── */
const getVoice = () => {
    const voices = window.speechSynthesis?.getVoices() || []
    const preferred = ['Google US English', 'Google UK English Female', 'Samantha', 'Karen', 'Moira']
    for (const name of preferred) {
        const v = voices.find(v => v.name.includes(name))
        if (v) return v
    }
    return voices.find(v => v.lang?.startsWith('en')) || voices[0] || null
}

const speakText = (text, onEnd) => {
    if (!window.speechSynthesis) { onEnd?.(); return }
    window.speechSynthesis.cancel()
    const clean = text.replace(/[*_#\[\]>~]/g, '').replace(/\n+/g, '. ')
    const utt = new SpeechSynthesisUtterance(clean)
    const voice = getVoice()
    if (voice) utt.voice = voice
    utt.rate = 0.90; utt.pitch = 1.0; utt.volume = 0.9
    utt.onend = onEnd
    utt.onerror = onEnd
    window.speechSynthesis.speak(utt)
}

/* ─── Waveform visualizer ─── */
const WaveformCanvas = ({ active }) => {
    const canvasRef = useRef(null)
    const animRef = useRef(null)
    const analyserRef = useRef(null)
    const streamRef = useRef(null)
    const audioCtxRef = useRef(null)

    useEffect(() => {
        if (!active) {
            // stop everything
            cancelAnimationFrame(animRef.current)
            streamRef.current?.getTracks().forEach(t => t.stop())
            audioCtxRef.current?.close().catch(() => { })
            streamRef.current = null
            audioCtxRef.current = null
            analyserRef.current = null
            // draw flat line
            const canvas = canvasRef.current
            if (canvas) {
                const ctx = canvas.getContext('2d')
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                ctx.beginPath()
                ctx.moveTo(0, canvas.height / 2)
                ctx.lineTo(canvas.width, canvas.height / 2)
                ctx.strokeStyle = 'rgba(45,212,191,0.20)'
                ctx.lineWidth = 1.5
                ctx.stroke()
            }
            return
        }

        let mounted = true
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            if (!mounted) { stream.getTracks().forEach(t => t.stop()); return }
            streamRef.current = stream
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
            audioCtxRef.current = audioCtx
            const analyser = audioCtx.createAnalyser()
            analyser.fftSize = 256
            analyserRef.current = analyser
            audioCtx.createMediaStreamSource(stream).connect(analyser)

            const canvas = canvasRef.current
            const draw = () => {
                if (!mounted || !analyserRef.current) return
                animRef.current = requestAnimationFrame(draw)
                const ctx = canvas.getContext('2d')
                const w = canvas.width; const h = canvas.height
                const data = new Uint8Array(analyser.frequencyBinCount)
                analyser.getByteFrequencyData(data)
                ctx.clearRect(0, 0, w, h)
                const bars = 40; const gap = 3
                const barW = (w - gap * (bars - 1)) / bars
                for (let i = 0; i < bars; i++) {
                    const val = data[Math.floor(i * data.length / bars)] / 255
                    const bH = Math.max(2, val * h * 0.88)
                    const x = i * (barW + gap); const y = (h - bH) / 2
                    ctx.fillStyle = `rgba(45,212,191,${0.3 + val * 0.7})`
                    // Use fillRect for compatibility instead of roundRect
                    ctx.beginPath()
                    ctx.rect(x, y + 2, barW, Math.max(0, bH - 4))
                    ctx.fill()
                }
            }
            draw()
        }).catch(() => { /* mic denied */ })

        return () => {
            mounted = false
            cancelAnimationFrame(animRef.current)
            streamRef.current?.getTracks().forEach(t => t.stop())
            audioCtxRef.current?.close().catch(() => { })
        }
    }, [active])

    return (
        <canvas ref={canvasRef} className="vm-canvas" width={300} height={80} />
    )
}

/* ─── Icons ─── */
const IconMic = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
const IconMicOff = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="2" x2="22" y2="22" /><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" /><path d="M5 10v2a7 7 0 0 0 12 3" /><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
const IconX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
const IconVolume2 = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
const IconSkip = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>

const Spinner = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
)

/* ─── State constants ─── */
const S = { IDLE: 'idle', LISTENING: 'listening', PROCESSING: 'processing', SPEAKING: 'speaking' }
const LABELS = { idle: 'Ready', listening: 'Listening...', processing: 'Thinking...', speaking: 'Speaking' }

/* ─── Main VoiceMode component ─── */
const VoiceMode = ({ auth, onClose, initialMessages }) => {
    const [state, setState] = useState(S.IDLE)
    const [transcript, setTranscript] = useState('')
    const [interim, setInterim] = useState('')
    const [aiText, setAiText] = useState('')
    const [messages, setMessages] = useState(initialMessages || [])
    const [autoLoop, setAutoLoop] = useState(false)
    const [error, setError] = useState('')

    const recogRef = useRef(null)
    const stateRef = useRef(S.IDLE)
    const autoRef = useRef(false)
    const messagesRef = useRef(initialMessages || [])

    // Keep refs in sync
    useEffect(() => { stateRef.current = state }, [state])
    useEffect(() => { autoRef.current = autoLoop }, [autoLoop])
    useEffect(() => { messagesRef.current = messages }, [messages])

    /* ─── Cleanup on unmount ─── */
    useEffect(() => {
        return () => {
            recogRef.current?.abort()
            window.speechSynthesis?.cancel()
        }
    }, [])

    /* ─── AI call ─── */
    const sendToAI = useCallback(async (text) => {
        setState(S.PROCESSING)
        setAiText('')
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const next = [...messagesRef.current, { role: 'user', content: text, time }]
        setMessages(next)
        messagesRef.current = next
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: next, user_id: auth.user_id, session_id: auth.session_id }),
            })
            if (!res.ok) throw new Error('API error')
            const data = await res.json()
            const aiMsg = { role: data.role, content: data.content, time }
            const withAi = [...next, aiMsg]
            setMessages(withAi)
            messagesRef.current = withAi
            setAiText(data.content)
            setState(S.SPEAKING)
            speakText(data.content, () => {
                if (autoRef.current) {
                    startListening()
                } else {
                    setState(S.IDLE)
                }
            })
        } catch {
            setError('Connection error — check backend is running.')
            setState(S.IDLE)
        }
    }, [auth])

    /* ─── Recognition setup ─── */
    const buildRecognition = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) { setError('Speech recognition not supported (use Chrome/Edge).'); return null }
        const r = new SR()
        r.lang = 'en-US'
        r.continuous = false
        r.interimResults = true
        r.maxAlternatives = 1
        r.onstart = () => { setState(S.LISTENING); setTranscript(''); setInterim(''); setAiText('') }
        r.onresult = (e) => {
            let fin = ''; let tmp = ''
            for (let i = e.resultIndex; i < e.results.length; i++) {
                if (e.results[i].isFinal) fin += e.results[i][0].transcript
                else tmp += e.results[i][0].transcript
            }
            if (fin) setTranscript(prev => (prev + ' ' + fin).trim())
            setInterim(tmp)
        }
        r.onend = () => {
            setInterim('')
            // Use a functional approach to read latest transcript safely
            setTranscript(prev => {
                const t = prev.trim()
                if (t && stateRef.current === S.LISTENING) {
                    // defer the AI call to avoid calling inside setState
                    setTimeout(() => sendToAI(t), 0)
                } else if (stateRef.current === S.LISTENING) {
                    setState(S.IDLE)
                }
                return prev // don't change transcript
            })
        }
        r.onerror = (e) => {
            if (e.error !== 'aborted' && e.error !== 'no-speech') {
                setError(`Mic error: ${e.error}`)
            }
            if (stateRef.current === S.LISTENING) setState(S.IDLE)
        }
        return r
    }, [sendToAI])

    /* ─── Controls ─── */
    const startListening = useCallback(() => {
        setError('')
        recogRef.current?.abort()
        const r = buildRecognition()
        if (!r) return
        recogRef.current = r
        try { r.start() } catch { setError('Could not access microphone.') }
    }, [buildRecognition])

    const stopListening = useCallback(() => {
        recogRef.current?.stop()
    }, [])

    const skipSpeech = useCallback(() => {
        window.speechSynthesis?.cancel()
        if (autoRef.current) startListening()
        else setState(S.IDLE)
    }, [startListening])

    const stopAll = useCallback(() => {
        recogRef.current?.abort()
        window.speechSynthesis?.cancel()
        setState(S.IDLE)
        setTranscript(''); setInterim(''); setAiText('')
    }, [])

    const dotClass = state === S.PROCESSING ? 'amber' : state === S.IDLE ? 'muted' : ''

    return (
        <div className="vm-overlay">
            <button className="vm-ctrl-btn" onClick={onClose} style={{ position: 'absolute', top: 24, right: 24 }}>
                <IconX /> Close
            </button>

            <div className={`vm-glow ${state}`} />

            <div className="vm-content">
                {/* Waveform */}
                <div className="vm-waveform-wrap">
                    <WaveformCanvas active={state === S.LISTENING} />
                </div>

                {/* Orb */}
                <div className="vm-orb-wrap">
                    <div className="vm-ring" /><div className="vm-ring" /><div className="vm-ring" />
                    <div className={`vm-orb ${state}`}>
                        {state === S.IDLE && <IconMic />}
                        {state === S.LISTENING && <IconMic />}
                        {state === S.PROCESSING && <Spinner />}
                        {state === S.SPEAKING && <IconVolume2 />}
                    </div>
                </div>

                {/* Status */}
                <div className="vm-status">
                    <div className="vm-state-badge">
                        <span className={`vm-state-dot ${dotClass}`} />
                        {LABELS[state]}
                    </div>
                    <div className="vm-transcript">
                        {state === S.IDLE && !transcript && (
                            <span className="vm-transcript-placeholder">
                                {error || 'Press the mic button to start speaking'}
                            </span>
                        )}
                        {(state === S.LISTENING || state === S.PROCESSING) && (
                            <>
                                {transcript && <span>{transcript} </span>}
                                {interim && <span className="vm-interim">{interim}</span>}
                                {!transcript && !interim && (
                                    <span className="vm-transcript-placeholder">Speak naturally...</span>
                                )}
                            </>
                        )}
                        {state === S.SPEAKING && aiText && (
                            <div className="vm-ai-response">{aiText}</div>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="vm-controls">
                    {state === S.IDLE && <button className="vm-mic-btn" onClick={startListening}><IconMic /></button>}
                    {state === S.LISTENING && <button className="vm-mic-btn active" onClick={stopListening}><IconMicOff /></button>}
                    {state === S.PROCESSING && <div className="vm-mic-btn" style={{ opacity: 0.5, cursor: 'default' }}><Spinner /></div>}
                    {state === S.SPEAKING && <button className="vm-mic-btn" onClick={skipSpeech}><IconSkip /></button>}

                    <div className="vm-controls-row">
                        <button
                            className="vm-ctrl-btn"
                            onClick={() => setAutoLoop(p => !p)}
                            style={autoLoop ? { background: 'rgba(15,118,110,0.25)', borderColor: 'rgba(45,212,191,0.35)', color: 'var(--teal-300)' } : {}}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 1-9 9M3 12a9 9 0 0 1 9-9" /><path d="m21 3-3 9 6 0z" /></svg>
                            {autoLoop ? 'Auto-loop ON' : 'Auto-loop'}
                        </button>
                        {state !== S.IDLE && (
                            <button className="vm-ctrl-btn danger" onClick={stopAll}>
                                <IconMicOff /> Stop
                            </button>
                        )}
                    </div>
                </div>

                <div className="vm-hint">
                    {autoLoop
                        ? 'Hands-free: AI will automatically listen after each response'
                        : 'Press mic → speak → AI replies aloud · Toggle Auto-loop for hands-free'}
                </div>
            </div>
        </div>
    )
}

export default VoiceMode
