import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';

export default function SessionFeedback({ auth }) {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id') || 'general';
    const sessionType = searchParams.get('type') || 'chat';
    const navigate = useNavigate();

    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comments, setComments] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: auth.user_id,
                    session_id: sessionId,
                    session_type: sessionType,
                    rating,
                    comments
                })
            });
            setSubmitted(true);
            setTimeout(() => navigate('/app'), 2000);
        } catch (err) {
            console.error(err);
        }
    };

    if (submitted) {
        return (
            <div style={{ maxWidth: 500, margin: '100px auto', textAlign: 'center', padding: 40, background: 'var(--bg-surface)', borderRadius: 'var(--r-xl)' }}>
                <h2 style={{ color: 'var(--primary-mint)' }}>Thank You!</h2>
                <p>Your feedback helps us improve TheraByte.</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 500, margin: '60px auto', padding: 32, background: 'var(--bg-surface)', borderRadius: 'var(--r-xl)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginBottom: 8 }}>Session Feedback</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>How was your {sessionType} session?</p>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            type="button"
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(rating)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                            <Star
                                size={40}
                                fill={star <= (hover || rating) ? '#F59E0B' : 'transparent'}
                                color={star <= (hover || rating) ? '#F59E0B' : '#CBD5E1'}
                            />
                        </button>
                    ))}
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Any additional comments?</label>
                    <textarea
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                        placeholder="What went well? What could be better?"
                        style={{ width: '100%', minHeight: 120, padding: 16, borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)', resize: 'vertical' }}
                    />
                </div>

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={rating === 0}
                    style={{ width: '100%' }}
                >
                    Submit Feedback
                </button>
            </form>
        </div>
    );
}
