import React, { useState, useEffect } from 'react'
import './BreathingModal.css'

const CYCLES = [
    { phase: 'inhale', label: 'Breathe In', duration: 4, class: 'inhale', instruction: 'Slowly breathe in through your nose...' },
    { phase: 'hold', label: 'Hold', duration: 4, class: 'hold', instruction: 'Hold gently. You are safe.' },
    { phase: 'exhale', label: 'Breathe Out', duration: 6, class: 'exhale', instruction: 'Slowly release through your mouth...' },
    { phase: 'hold', label: 'Rest', duration: 2, class: 'exhale', instruction: 'Rest for a moment.' },
]
const TOTAL_ROUNDS = 4

const BreathingModal = ({ onClose }) => {
    const [phaseIdx, setPhaseIdx] = useState(0)
    const [count, setCount] = useState(CYCLES[0].duration)
    const [round, setRound] = useState(1)
    const [done, setDone] = useState(false)

    useEffect(() => {
        if (done) return
        const interval = setInterval(() => {
            setCount(prev => {
                if (prev <= 1) {
                    // Move to next phase
                    const nextIdx = (phaseIdx + 1) % CYCLES.length
                    const isNewRound = nextIdx === 0
                    if (isNewRound && round >= TOTAL_ROUNDS) {
                        setDone(true)
                        clearInterval(interval)
                        return 0
                    }
                    if (isNewRound) setRound(r => r + 1)
                    setPhaseIdx(nextIdx)
                    return CYCLES[nextIdx].duration
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(interval)
    }, [phaseIdx, round, done])

    const current = CYCLES[phaseIdx]

    return (
        <div className="breathing-overlay" onClick={onClose}>
            <div className="breathing-card" onClick={e => e.stopPropagation()}>
                <div>
                    <div className="breathing-title">🫧 Guided Breathing</div>
                    <div className="breathing-subtitle">
                        {done ? 'Session complete. Well done. 💜' : `Round ${round} of ${TOTAL_ROUNDS}`}
                    </div>
                </div>

                <div className="breathing-circle-wrap">
                    <div className={`breathing-circle ${done ? 'exhale' : current.class}`}>
                        <span className="breathing-step-text">{done ? 'Done' : current.label}</span>
                        {!done && <span className="breathing-count">{count}</span>}
                    </div>
                </div>

                {/* Round progress dots */}
                <div className="breathing-dots">
                    {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                        <div
                            key={i}
                            className={`breathing-dot ${i < round - 1 ? 'done' : i === round - 1 ? 'active' : ''}`}
                        />
                    ))}
                </div>

                <div className="breathing-instruction">
                    {done ? 'Your nervous system is calming. Take a moment before you continue.' : current.instruction}
                </div>

                <button className="breathing-close" onClick={onClose}>
                    {done ? 'Return to chat' : 'End session'}
                </button>
            </div>
        </div>
    )
}

export default BreathingModal
