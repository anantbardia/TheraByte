import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeftRight } from 'lucide-react';
import './WellnessModals.css';

const emotionGuides = {
    Fear: { action: "Approach what you are afraid of.", examples: ["Go to the place you are avoiding.", "Do the thing you are putting off."] },
    Anger: { action: "Gently avoid or take a time out.", examples: ["Take a step back.", "Do something kind for someone else.", "Relax your face and posture."] },
    Sadness: { action: "Get active and engage with others.", examples: ["Reach out to a friend.", "Do a productive task.", "Get moving."] },
    Shame: { action: "Share it with a trusted person.", examples: ["Tell someone what happened.", "Stand tall and make eye contact."] }
};

export default function DBTOppositeActionModal({ onClose }) {
    const [step, setStep] = useState(1);
    const [emotion, setEmotion] = useState('');
    const [urge, setUrge] = useState('');

    const handleNext = () => setStep(s => s + 1);

    return (
        <div className="wellness-modal-overlay">
            <div className="wellness-modal dbt-modal">
                <button className="wm-close" onClick={onClose}><X /></button>

                <div className="wm-header">
                    <span className="wm-tag tc-amber">Dialectical Behavior Therapy</span>
                    <h2>Opposite Action</h2>
                    <p>Change your emotion by acting opposite to its current urge.</p>
                </div>

                <div className="dbt-content">
                    {step === 1 && (
                        <div className="dbt-step fade-in">
                            <h3>1. Identify the Emotion</h3>
                            <p>What primary emotion are you feeling right now?</p>
                            <div className="dbt-options">
                                {Object.keys(emotionGuides).map(e => (
                                    <button
                                        key={e}
                                        className={`dbt-btn ${emotion === e ? 'selected' : ''}`}
                                        onClick={() => setEmotion(e)}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                            <button className="btn-primary" onClick={handleNext} disabled={!emotion}>Next</button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="dbt-step fade-in">
                            <h3>2. Identify the Urge</h3>
                            <p>What does {emotion} make you want to do right now?</p>
                            <textarea
                                value={urge}
                                onChange={e => setUrge(e.target.value)}
                                placeholder="E.g., I want to hide in bed... I want to yell..."
                                className="tj-textarea"
                            />
                            <button className="btn-primary" onClick={handleNext} disabled={!urge.trim()}>Next</button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="dbt-step fade-in">
                            <div className="dbt-opposite-view">
                                <div className="dbt-urge-box">
                                    <span className="box-label">Your Urge</span>
                                    {urge}
                                </div>
                                <ArrowLeftRight size={32} color="#64748b" style={{ margin: '20px auto', display: 'block' }} />
                                <div className="dbt-action-box">
                                    <span className="box-label">Opposite Action</span>
                                    <h4>{emotionGuides[emotion].action}</h4>
                                    <ul>
                                        {emotionGuides[emotion].examples.map((ex, i) => <li key={i}>{ex}</li>)}
                                    </ul>
                                </div>
                            </div>

                            <div className="dbt-commitment">
                                <p>Will you commit to doing the opposite action right now?</p>
                                <button className="btn-primary" onClick={onClose} style={{ width: '100%' }}>I will do it</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
