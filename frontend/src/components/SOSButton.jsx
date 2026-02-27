import { useState } from 'react';
import { Phone, X, AlertTriangle, Heart } from 'lucide-react';

const SOS_CONTACTS = [
    { name: 'iCall (India)', number: '9152987821', desc: 'Free counseling, Mon–Sat 8am–10pm' },
    { name: 'Vandrevala Foundation', number: '1860-2662-345', desc: '24/7 mental health helpline' },
    { name: 'AASRA', number: '9820466627', desc: '24/7 crisis support' },
    { name: 'Emergency Services', number: '112', desc: 'National emergency number (India)' },
];

export default function SOSButton() {
    const [open, setOpen] = useState(false);
    const [called, setCalled] = useState(null);

    return (
        <>
            {/* Floating SOS Button */}
            <button
                onClick={() => setOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 9999,
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    boxShadow: '0 4px 24px rgba(239, 68, 68, 0.5)',
                    animation: 'sos-pulse 2s infinite',
                    flexDirection: 'column',
                    gap: 2,
                }}
                title="Emergency SOS"
            >
                <AlertTriangle size={20} />
                <span>SOS</span>
            </button>

            {/* Overlay Modal */}
            {open && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 10000,
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
                }}>
                    <div style={{
                        background: 'white', borderRadius: 24, padding: 32,
                        maxWidth: 480, width: '100%',
                        boxShadow: '0 32px 80px rgba(239,68,68,0.2)',
                        border: '2px solid rgba(239,68,68,0.15)',
                        animation: 'scaleIn 0.2s ease',
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                    <div style={{ background: '#fee2e2', padding: 8, borderRadius: 12 }}>
                                        <Heart size={20} color="#dc2626" />
                                    </div>
                                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e293b' }}>You're not alone</h2>
                                </div>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                    Reach out to a trained professional right now. All calls are free and confidential.
                                </p>
                            </div>
                            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                                <X size={22} />
                            </button>
                        </div>

                        {/* Contacts */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {SOS_CONTACTS.map((c) => (
                                <a key={c.number} href={`tel:${c.number}`}
                                    onClick={() => setCalled(c.number)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 16,
                                        padding: '16px 20px', borderRadius: 16, textDecoration: 'none',
                                        background: called === c.number ? '#fee2e2' : '#f8fafc',
                                        border: called === c.number ? '2px solid #fca5a5' : '1px solid #e2e8f0',
                                        transition: 'all 0.2s', cursor: 'pointer',
                                    }}
                                >
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Phone size={18} color="white" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{c.name}</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626', letterSpacing: '0.03em' }}>{c.number}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.desc}</div>
                                    </div>
                                </a>
                            ))}
                        </div>

                        <p style={{ textAlign: 'center', marginTop: 20, color: '#94a3b8', fontSize: '0.8rem' }}>
                            Your wellbeing matters. Reaching out is a sign of strength.
                        </p>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes sos-pulse {
                    0%, 100% { box-shadow: 0 4px 24px rgba(239, 68, 68, 0.5); transform: scale(1); }
                    50% { box-shadow: 0 4px 32px rgba(239, 68, 68, 0.8); transform: scale(1.05); }
                }
            `}</style>
        </>
    );
}
