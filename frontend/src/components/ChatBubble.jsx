import React, { useState } from 'react'
import './ChatBubble.css'

const STEP_EMOJI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']

// Parse content into clean readable segments
const renderContent = (content) => {
    // Split by newlines, filter blank lines
    const lines = content.split('\n').filter(l => l.trim() !== '')
    const elements = []
    let textBuffer = []

    const flushText = () => {
        if (textBuffer.length > 0) {
            elements.push(
                <div key={`t-${elements.length}`} className="msg-para-group">
                    {textBuffer.map((line, i) => {
                        // Render **bold** markdown inline
                        const parts = line.split(/(\*\*[^*]+\*\*)/g)
                        return (
                            <p key={i}>
                                {parts.map((part, j) =>
                                    part.startsWith('**') && part.endsWith('**')
                                        ? <strong key={j}>{part.slice(2, -2)}</strong>
                                        : part
                                )}
                            </p>
                        )
                    })}
                </div>
            )
            textBuffer = []
        }
    }

    lines.forEach((line, idx) => {
        const stepMatch = STEP_EMOJI.findIndex(e => line.includes(e))
        if (stepMatch !== -1) {
            flushText()
            const emoji = STEP_EMOJI[stepMatch]
            const text = line.replace(emoji, '').replace(/^\s*\*\*/, '').replace(/\*\*\s*—?\s*/, ' — ').trim()
            elements.push(
                <div key={`step-${idx}`} className="msg-step">
                    <span className="msg-step-num">{emoji}</span>
                    <span className="msg-step-text">{text}</span>
                </div>
            )
        } else {
            textBuffer.push(line)
        }
    })
    flushText()
    return elements
}

const formatTime = () => {
    const d = new Date()
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const ChatBubble = ({ message, onSpeak, ttsEnabled }) => {
    const isUser = message.role === 'user'
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
        })
    }

    return (
        <div className={`msg-row ${isUser ? 'msg-user' : 'msg-ai'}`}>
            {!isUser && (
                <div className="msg-avatar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2a5 5 0 0 1 5 5v0a3 3 0 0 1 3 3 4 4 0 0 1-1.5 7.5" />
                        <path d="M12 2a5 5 0 0 0-5 5v0a3 3 0 0 0-3 3 4 4 0 0 0 1.5 7.5" />
                        <path d="M12 2v20" />
                    </svg>
                </div>
            )}

            <div className="msg-bubble-wrap">
                <div className={`msg-bubble ${isUser ? 'msg-bubble-user' : 'msg-bubble-ai'} ${message.isError ? 'msg-bubble-error' : ''}`}>
                    {isUser
                        ? message.content.split('\n').map((line, i) => <p key={i}>{line || '\u00A0'}</p>)
                        : renderContent(message.content)
                    }
                    {!isUser && onSpeak && (
                        <button className="tts-btn" onClick={() => onSpeak(message.content)} title="Read aloud">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                        </button>
                    )}
                </div>
                <div className="msg-meta">
                    <span className="msg-time">{message.time || formatTime()}</span>
                    {!isUser && (
                        <button
                            className={`msg-action-btn ${copied ? 'msg-copied' : ''}`}
                            onClick={handleCopy}
                            title="Copy response"
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {copied
                                    ? <><polyline points="20 6 9 17 4 12" /></>
                                    : <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>
                                }
                            </svg>
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    )}
                </div>
            </div>

            {isUser && (
                <div className="msg-avatar-user">
                    You
                </div>
            )}
        </div>
    )
}

export default ChatBubble
