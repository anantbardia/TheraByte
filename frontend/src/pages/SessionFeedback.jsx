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
            <div style={{ maxWidth: 500, margin: '140px auto', textAlign: 'center', padding: '60px 40px', background: 'var(--bg-surface)', borderRadius: 'var(--r-2xl)', border: '1px solid rgba(46,43,42,0.04)', boxShadow: '0 4px 20px rgba(46,43,42,0.03)' }}>
                <h2 style={{ color: 'var(--teal-700)', fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, marginBottom: 12 }}>Thank you for your openness.</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>Your feedback helps us understand how to better support you.<br /><br />You may safely close this window.</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 500, margin: '80px auto', padding: 48, background: 'var(--bg-surface)', borderRadius: 'var(--r-2xl)', boxShadow: '0 4px 24px rgba(46,43,42,0.03)', border: '1px solid rgba(46,43,42,0.04)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8, textAlign: 'center' }}>Session Feedback</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: 40, textAlign: 'center' }}>How did you feel about this {sessionType} session?</p>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 40, justifyContent: 'center' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            type="button"
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(rating)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'transform var(--t-fast)' }}
                            className="rating-star"
                        >
                            <Star
                                size={44}
                                fill={star <= (hover || rating) ? 'var(--amber-400)' : 'transparent'}
                                color={star <= (hover || rating) ? 'var(--amber-400)' : 'rgba(46,43,42,0.1)'}
                                style={{ strokeWidth: 1.5, transition: 'all var(--t-fast)' }}
                            />
                        </button>
                    ))}
                </div>

                <div style={{ marginBottom: 32 }}>
                    <label style={{ display: 'block', marginBottom: 12, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Is there anything you'd like us to know?</label>
                    <textarea
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                        placeholder="Share your thoughts here... (Optional)"
                        style={{ width: '100%', minHeight: 140, padding: 16, borderRadius: 'var(--r-xl)', border: '1px solid rgba(46,43,42,0.1)', background: 'transparent', color: 'var(--text-primary)', fontSize: '15px', fontFamily: 'var(--font-body)', resize: 'vertical', outline: 'none' }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--teal-400)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(46,43,42,0.1)'}
                    />
                </div>

                <button
                    type="submit"
                    disabled={rating === 0}
                    style={{ width: '100%', padding: '16px', background: rating === 0 ? 'rgba(46,43,42,0.05)' : 'var(--text-primary)', color: rating === 0 ? 'var(--text-muted)' : 'white', border: 'none', borderRadius: 'var(--r-full)', fontSize: '15px', fontWeight: 500, cursor: rating === 0 ? 'not-allowed' : 'pointer', transition: 'all var(--t-base)', boxShadow: rating === 0 ? 'none' : '0 4px 12px rgba(46,43,42,0.1)' }}
                >
                    Submit Feedback
                </button>
            </form>
        </div>
    );
}
