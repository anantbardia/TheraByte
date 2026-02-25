import React, { useState, useEffect } from 'react';
import { X, Eye, Headset, Hand, Wind, Coffee } from 'lucide-react';
import './WellnessModals.css';

const steps = [
    { num: 5, icon: <Eye size={32} />, title: '5 Things you can SEE', desc: 'Look around you and name five things you can see.' },
    { num: 4, icon: <Hand size={32} />, title: '4 Things you can FEEL', desc: 'Pay attention to your body and think of four things you can feel.' },
    { num: 3, icon: <Headset size={32} />, title: '3 Things you can HEAR', desc: 'Listen out for three sounds. It could be traffic, birds, or a hum.' },
    { num: 2, icon: <Wind size={32} />, title: '2 Things you can SMELL', desc: 'Notice two things you can smell right now.' },
    { num: 1, icon: <Coffee size={32} />, title: '1 Thing you can TASTE', desc: 'Focus on one thing you can taste right now.' }
];

export default function GroundingModal({ onClose }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [completed, setCompleted] = useState(false);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setCompleted(true);
        }
    };

    return (
        <div className="wellness-modal-overlay">
            <div className="wellness-modal grounding-modal">
                <button className="wm-close" onClick={onClose}><X /></button>

                {completed ? (
                    <div className="wm-completed">
                        <div className="wm-success-icon">✨</div>
                        <h2>Grounding Complete</h2>
                        <p>You have successfully brought your mind back to the present moment.</p>
                        <button className="btn-primary" onClick={onClose} style={{ marginTop: 24 }}>Return</button>
                    </div>
                ) : (
                    <>
                        <div className="wm-header">
                            <span className="wm-tag">5-4-3-2-1</span>
                            <h2>Grounding Exercise</h2>
                            <p>This technique brings you back to the present moment.</p>
                        </div>

                        <div className="grounding-content">
                            <div className="gc-icon-wrapper fade-in" key={currentStep}>
                                {steps[currentStep].icon}
                            </div>
                            <h3 className="fade-in" key={`t-${currentStep}`}>{steps[currentStep].title}</h3>
                            <p className="fade-in" key={`d-${currentStep}`}>{steps[currentStep].desc}</p>
                        </div>

                        <div className="wm-footer">
                            <div className="wm-progress">
                                {steps.map((_, i) => (
                                    <div key={i} className={`wm-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`} />
                                ))}
                            </div>
                            <button className="btn-primary" onClick={handleNext}>
                                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
