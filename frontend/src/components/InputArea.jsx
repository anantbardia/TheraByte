import React, { useState, useEffect, useRef } from 'react'
import './InputArea.css'

const MAX_CHARS = 600

const InputArea = ({ onSend, disabled }) => {
    const [input, setInput] = useState('')
    const [isListening, setIsListening] = useState(false)
    const [recognition, setRecognition] = useState(null)
    const textareaRef = useRef(null)

    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SR) {
            const r = new SR()
            r.continuous = true        // keep listening until stopped
            r.interimResults = true    // show words as they're being spoken
            r.lang = 'en-US'
            r.onstart = () => setIsListening(true)
            r.onend = () => setIsListening(false)
            r.onresult = (e) => {
                let final = ''
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    if (e.results[i].isFinal) final += e.results[i][0].transcript + ' '
                }
                if (final) setInput(prev => (prev + final).trimStart())
            }
            setRecognition(r)
        }
    }, [])

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 140) + 'px'
    }, [input])

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    const handleSubmit = (e) => {
        e?.preventDefault()
        if (input.trim() && !disabled) {
            onSend(input.trim())
            setInput('')
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
        }
    }

    const charCount = input.length
    const isOverLimit = charCount > MAX_CHARS

    return (
        <div>
            <form className="input-bar" onSubmit={handleSubmit}>
                {/* Mic button */}
                <div className="input-mic-wrap">
                    <button
                        type="button"
                        className={`input-icon ${isListening ? 'recording' : ''}`}
                        onClick={() => recognition && (isListening ? recognition.stop() : recognition.start())}
                        title={isListening ? 'Stop listening' : 'Voice input'}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" x2="12" y1="19" y2="22" />
                        </svg>
                    </button>
                </div>

                <textarea
                    ref={textareaRef}
                    className="input-field"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? '🎙️ Listening...' : 'Share what\'s on your mind... (Enter to send, Shift+Enter for new line)'}
                    disabled={disabled}
                    rows={1}
                    maxLength={MAX_CHARS + 50}
                />

                {charCount > 80 && (
                    <span className={`input-char-count ${isOverLimit ? 'warn' : ''}`}>
                        {charCount}/{MAX_CHARS}
                    </span>
                )}

                <button
                    type="submit"
                    className="input-send"
                    disabled={disabled || !input.trim() || isOverLimit}
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                    </svg>
                </button>
            </form>
            <div className="input-hint">
                <span>Enter to send · Shift+Enter for new line</span>
            </div>
        </div>
    )
}

export default InputArea
