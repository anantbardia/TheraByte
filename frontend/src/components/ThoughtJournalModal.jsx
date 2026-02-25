import React, { useState } from 'react';
import { X, Send, CheckCircle2 } from 'lucide-react';
import './WellnessModals.css';

export default function ThoughtJournalModal({ onClose }) {
    const [step, setStep] = useState(1);
    const [situation, setSituation] = useState('');
    const [thought, setThought] = useState('');
    const [distortion, setDistortion] = useState('');
    const [reframe, setReframe] = useState('');

    const distortions = [
        "All-or-Nothing Thinking",
        "Overgeneralization",
        "Mental Filter",
        "Discounting the Positive",
        "Jumping to Conclusions",
        "Magnification (Catastrophizing)",
        "Emotional Reasoning",
        "Should Statements",
        "Labeling",
        "Personalization"
    ];

    const handleNext = () => setStep(s => s + 1);

    return (
        <div className="wellness-modal-overlay">
            <div className="wellness-modal thought-journal-modal">
                <button className="wm-close" onClick={onClose}><X /></button>

                <div className="wm-header">
                    <span className="wm-tag">CBT Exercise</span>
                    <h2>Thought Record</h2>
                </div>

                <div className="tj-content">
                    {step === 1 && (
                        <div className="tj-step fade-in">
                            <h3>1. The Situation</h3>
                            <p>What happened? Where were you, and what were you doing?</p>
                            <textarea
                                value={situation}
                                onChange={e => setSituation(e.target.value)}
                                placeholder="Describe the trigger event..."
                                className="tj-textarea"
                            />
                            <button className="btn-primary" onClick={handleNext} disabled={!situation.trim()}>Next</button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="tj-step fade-in">
                            <h3>2. Automatic Thought</h3>
                            <p>What went through your mind at that exact moment?</p>
                            <textarea
                                value={thought}
                                onChange={e => setThought(e.target.value)}
                                placeholder="Write the thought exactly as it occurred..."
                                className="tj-textarea"
                            />
                            <button className="btn-primary" onClick={handleNext} disabled={!thought.trim()}>Next</button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="tj-step fade-in">
                            <h3>3. Cognitive Distortion</h3>
                            <p>Which thinking trap does this thought fall into?</p>
                            <div className="tj-distortions">
                                {distortions.map(d => (
                                    <button
                                        key={d}
                                        className={`tj-distortion-btn ${distortion === d ? 'selected' : ''}`}
                                        onClick={() => setDistortion(d)}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                            <button className="btn-primary" onClick={handleNext} disabled={!distortion}>Next</button>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="tj-step fade-in">
                            <h3>4. Rational Reframe</h3>
                            <p>How could you look at this more objectively and kindly?</p>
                            <textarea
                                value={reframe}
                                onChange={e => setReframe(e.target.value)}
                                placeholder="Write a balanced, evidence-based thought..."
                                className="tj-textarea"
                            />
                            <button className="btn-primary" onClick={handleNext} disabled={!reframe.trim()}>Complete Entry</button>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="tj-step success fade-in">
                            <CheckCircle2 size={48} color="var(--primary-mint)" style={{ margin: '0 auto 16px' }} />
                            <h3>Entry Saved</h3>
                            <p>You successfully reframed a negative thought. This builds neural pathways for resilience.</p>
                            <div className="tj-summary">
                                <div><strong>Thought:</strong> {thought}</div>
                                <div><strong>Trap:</strong> {distortion}</div>
                                <div><strong>Reframe:</strong> {reframe}</div>
                            </div>
                            <button className="btn-primary" onClick={onClose} style={{ marginTop: 24, width: '100%' }}>Done</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
