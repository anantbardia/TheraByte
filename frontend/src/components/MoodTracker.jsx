import React, { useState } from 'react'
import './MoodTracker.css'

const moods = [
    { label: 'Calm', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" strokeLinecap="round" /><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" strokeLinecap="round" /></svg> },
    { label: 'Anxious', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.1 2.18a9.93 9.93 0 0 1 3.8 0" /><path d="M17.6 3.71a9.95 9.95 0 0 1 2.69 2.7" /><path d="M21.82 10.1a9.93 9.93 0 0 1 0 3.8" /><path d="M20.29 17.6a9.95 9.95 0 0 1-2.7 2.69" /><path d="M13.9 21.82a9.94 9.94 0 0 1-3.8 0" /><path d="M6.4 20.29a9.95 9.95 0 0 1-2.69-2.7" /><path d="M2.18 13.9a9.93 9.93 0 0 1 0-3.8" /><path d="M3.71 6.4a9.95 9.95 0 0 1 2.7-2.69" /><circle cx="12" cy="12" r="1" /></svg> },
    { label: 'Sad', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" strokeLinecap="round" /><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" strokeLinecap="round" /></svg> },
    { label: 'Stressed', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> },
    { label: 'Content', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M9 12h6" /><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" strokeLinecap="round" /><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" strokeLinecap="round" /></svg> },
    { label: 'Focused', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg> },
]

const MoodTracker = ({ onSelect }) => {
    const [selected, setSelected] = useState(null)
    const pick = (m) => { setSelected(m.label); onSelect(m) }

    return (
        <div className="mood-tracker">
            <div className="mood-label">How are you feeling right now?</div>
            <div className="mood-grid">
                {moods.map(m => (
                    <button
                        key={m.label}
                        className={`mood-btn ${selected === m.label ? 'selected' : ''}`}
                        onClick={() => pick(m)}
                        title={m.label}
                    >
                        {m.icon}
                        <span className="mood-btn-label">{m.label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

export default MoodTracker
