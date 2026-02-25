import { useState } from 'react';
import { Activity, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QUESTIONS = [
    { id: "q1", text: "Over the last 2 weeks, how often have you felt little interest or pleasure in doing things?" },
    { id: "q2", text: "How often have you felt down, depressed, or hopeless?" },
    { id: "q3", text: "How often have you felt nervous, anxious, or on edge?" },
    { id: "q4", text: "How often have you found it difficult to control your worrying?" },
    { id: "q5", text: "How often have you felt overwhelmed by your daily responsibilities?" }
];

const OPTIONS = [
    { value: 0, label: "Not at all" },
    { value: 1, label: "Several days" },
    { value: 2, label: "More than half the days" },
    { value: 3, label: "Nearly every day" }
];

export default function Assessment() {
    const navigate = useNavigate();
    const [answers, setAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    const handleSelect = (qId, val) => {
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    const allAnswered = QUESTIONS.every(q => answers[q.id] !== undefined);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Map answers to textual descriptions for the AI
            const mappedAnswers = {};
            QUESTIONS.forEach(q => {
                const opt = OPTIONS.find(o => o.value === answers[q.id]);
                mappedAnswers[q.text] = opt ? opt.label : "Unknown";
            });

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/assessment/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: mappedAnswers })
            });
            const data = await res.json();
            setResult(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (result) {
        return (
            <div style={{ maxWidth: 600, margin: '40px auto', padding: 32 }}>
                <div style={{ background: 'white', padding: 32, borderRadius: 'var(--r-xl)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--border-soft)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <Activity size={32} color="var(--primary-mint)" />
                        <h2 style={{ margin: 0 }}>Assessment Complete</h2>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: 1, marginBottom: 8 }}>Severity Level</h4>
                        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-navy)', textTransform: 'capitalize' }}>
                            {result.severity_level}
                        </div>
                    </div>

                    <div style={{ padding: 20, background: 'var(--bg-surface)', borderRadius: 'var(--r-md)', marginBottom: 24 }}>
                        <h4 style={{ marginBottom: 12 }}>Clinical Impression</h4>
                        <p style={{ lineHeight: 1.6 }}>{result.clinical_impression}</p>
                    </div>

                    <div style={{ marginBottom: 32 }}>
                        <h4 style={{ marginBottom: 12 }}>Recommended Actions</h4>
                        <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
                            {result.recommended_actions?.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    </div>

                    {result.risk_flag === "ELEVATED_RISK" && (
                        <div style={{ padding: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--r-md)', color: '#991B1B', display: 'flex', gap: 12, marginBottom: 24 }}>
                            <ShieldAlert />
                            <p style={{ margin: 0, fontSize: '0.95rem' }}>Your responses indicate you might be experiencing significant distress. Please consider reaching out to a crisis helpline or a mental health professional immediately.</p>
                        </div>
                    )}

                    <button className="btn-primary" onClick={() => navigate('/app/tools')} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                        Explore My Wellness Tools <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px' }}>
            <div style={{ marginBottom: 32 }}>
                <h1>Mental Health Assessment</h1>
                <p style={{ color: 'var(--text-muted)' }}>This short questionnaire helps us understand your current condition so we can personalize the tools provided to you. It takes about 2 minutes.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {QUESTIONS.map((q, i) => (
                    <div key={q.id} style={{ background: 'white', padding: 24, borderRadius: 'var(--r-lg)', border: '1px solid var(--border-soft)' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>{i + 1}. {q.text}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {OPTIONS.map(opt => (
                                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid', borderColor: answers[q.id] === opt.value ? 'var(--primary-mint)' : 'var(--border-soft)', background: answers[q.id] === opt.value ? 'rgba(121, 193, 176, 0.05)' : 'transparent', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <input
                                        type="radio"
                                        name={q.id}
                                        value={opt.value}
                                        checked={answers[q.id] === opt.value}
                                        onChange={() => handleSelect(q.id, opt.value)}
                                        style={{ accentColor: 'var(--primary-mint)' }}
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    className="btn-primary"
                    onClick={handleSubmit}
                    disabled={!allAnswered || isSubmitting}
                    style={{ padding: '16px 32px', fontSize: '1.1rem' }}
                >
                    {isSubmitting ? 'Analyzing Responses...' : 'Submit Assessment'}
                </button>
            </div>
        </div>
    );
}
