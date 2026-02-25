import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw } from 'lucide-react';
import './WellnessModals.css';

const muscleGroups = [
    { name: "Hands and Arms", instruction: "Clench your fists tightly and pull your forearms up against your upper arms." },
    { name: "Forehead", instruction: "Raise your eyebrows as high as they will go, as though you were surprised." },
    { name: "Eyes and Cheeks", instruction: "Squeeze your eyes tight shut." },
    { name: "Mouth and Jaw", instruction: "Open your mouth as wide as you can, as you might when you're yawning." },
    { name: "Neck", instruction: "Be careful. Pull your head back slowly, as though you are looking up at the ceiling." },
    { name: "Shoulders", instruction: "Tense the muscles in your shoulders as you bring your shoulders up towards your ears." },
    { name: "Chest and Stomach", instruction: "Breathe in deeply, filling your lungs. Tense your stomach muscles." },
    { name: "Back", instruction: "Arch your back slowly." },
    { name: "Legs and Feet", instruction: "Point your toes towards the ceiling, then point them downwards." }
];

export default function PMRModal({ onClose }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentGroup, setCurrentGroup] = useState(0);
    const [phase, setPhase] = useState('idle'); // idle -> tense -> hold -> release -> relax
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setTimer(t => {
                    const next = t + 1;

                    // Logic flow:
                    // 0-4s: TENSE (5s)
                    // 5-14s: RELAX (10s)
                    // Then next group

                    if (next <= 5) {
                        setPhase('tense');
                    } else if (next <= 15) {
                        setPhase('relax');
                    } else {
                        if (currentGroup < muscleGroups.length - 1) {
                            setCurrentGroup(cg => cg + 1);
                            return 0; // Reset timer for next group
                        } else {
                            setIsPlaying(false);
                            setPhase('done');
                        }
                    }
                    return next;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentGroup]);

    const togglePlay = () => setIsPlaying(!isPlaying);
    const reset = () => { setIsPlaying(false); setCurrentGroup(0); setTimer(0); setPhase('idle'); };

    return (
        <div className="wellness-modal-overlay">
            <div className="wellness-modal pmr-modal">
                <button className="wm-close" onClick={onClose}><X /></button>

                <div className="wm-header">
                    <span className="wm-tag tc-green">Physical</span>
                    <h2>Progressive Muscle Relaxation</h2>
                    <p>Release physical tension systematically to lower anxiety.</p>
                </div>

                <div className="pmr-content">
                    {phase === 'done' ? (
                        <div className="wm-completed">
                            <div className="wm-success-icon">🌿</div>
                            <h2>Body Relaxed</h2>
                            <p>Notice how much lighter you feel when tension is released.</p>
                        </div>
                    ) : (
                        <>
                            <div className="pmr-timer-ring">
                                <svg width="120" height="120" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                                    <circle
                                        cx="60" cy="60" r="54" fill="none"
                                        stroke={phase === 'tense' ? '#ef4444' : '#10b981'}
                                        strokeWidth="8"
                                        strokeDasharray="339.29"
                                        strokeDashoffset={339.29 - (timer / 15) * 339.29}
                                        strokeLinecap="round"
                                        transform="rotate(-90 60 60)"
                                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                                    />
                                </svg>
                                <div className="pmr-time-text">
                                    {phase === 'tense' ? (5 - timer > 0 ? 5 - timer : 0) : phase === 'relax' ? (15 - timer > 0 ? 15 - timer : 0) : ''}
                                </div>
                            </div>

                            <h3 className={`pmr-phase-title ${phase}`}>{phase === 'tense' ? 'TENSE' : phase === 'relax' ? 'RELAX' : 'Ready'}</h3>
                            <h4 className="pmr-group-name">{muscleGroups[currentGroup].name}</h4>
                            <p className="pmr-instruction">{muscleGroups[currentGroup].instruction}</p>

                            <div className="pmr-progress">
                                {muscleGroups.map((_, i) => (
                                    <div key={i} className={`pmr-dot ${i === currentGroup ? 'active' : ''} ${i < currentGroup ? 'done' : ''}`} />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="pmr-controls">
                    {phase !== 'done' && (
                        <button className="pmr-play-btn" onClick={togglePlay}>
                            {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" style={{ marginLeft: 4 }} />}
                        </button>
                    )}
                    <button className="pmr-reset-btn" onClick={reset}><RotateCcw /></button>
                </div>
            </div>
        </div>
    );
}
