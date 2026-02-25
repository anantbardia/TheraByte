import { useNavigate } from 'react-router-dom';

export default function TermsAndConditions() {
    const navigate = useNavigate();

    return (
        <div style={{ maxWidth: 800, margin: '60px auto', padding: 32, background: 'var(--bg-surface)', borderRadius: 'var(--r-xl)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h1 style={{ marginBottom: 24, color: 'var(--primary-navy)' }}>Terms and Conditions</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Last Updated: February 2026</p>

            <div style={{ lineHeight: 1.6, color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <section>
                    <h3 style={{ marginBottom: 12 }}>1. Acceptance of Terms</h3>
                    <p>By accessing or using TheraByte, you agree to be bound by these Terms and Conditions. If you do not agree to all the terms and conditions, then you may not access the platform.</p>
                </section>

                <section>
                    <h3 style={{ marginBottom: 12 }}>2. Not a Replacement for Professional Medical Advice</h3>
                    <p><strong>CRITICAL NOTICE:</strong> TheraByte is an AI-assisted psychological support and triage system. It is <strong>NOT</strong> a licensed healthcare provider, medical professional, or a replacement for professional clinical care, diagnosis, or treatment.</p>
                    <p>Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical or mental health condition. Never disregard professional medical advice or delay in seeking it because of something you have read on this platform.</p>
                </section>

                <section>
                    <h3 style={{ marginBottom: 12 }}>3. Emergency Situations</h3>
                    <p>If you are experiencing a medical or mental health emergency, or are considering harming yourself or others, <strong>do not use this platform</strong>. Instead, immediately call emergency services (e.g., 911 in the US, 999 in the UK, 112 in Europe, 9999 666 555 in India) or go to the nearest emergency room.</p>
                </section>

                <section>
                    <h3 style={{ marginBottom: 12 }}>4. Privacy and Data Security</h3>
                    <p>Your privacy is paramount. TheraByte uses end-to-end encryption and anonymization protocols to protect your data. However, mandatory reporting laws may require us to escalate severe risk markers (e.g., imminent self-harm or harm to others) to designated authorities or licensed professionals.</p>
                </section>

                <section>
                    <h3 style={{ marginBottom: 12 }}>5. Therapist-Led Sessions</h3>
                    <p>When participating in therapist-led sessions or video consultations, the AI operates strictly as an auxiliary tool for the licensed professional and provides analytical insights to aid clinical judgment, but does not dictate treatment.</p>
                </section>

                <section>
                    <h3 style={{ marginBottom: 12 }}>6. User Responsibilities</h3>
                    <p>You agree to provide accurate information during assessments and to use the platform in good faith. Any misuse, abuse of the system, or attempts to circumvent safety protocols will result in immediate termination of an account.</p>
                </section>
            </div>

            <button
                className="btn-primary"
                onClick={() => navigate(-1)}
                style={{ marginTop: 40 }}
            >
                Go Back
            </button>
        </div>
    );
}
