import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import './VideoSession.css';

// Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function VideoSession({ auth, identityMode = "Anonymous" }) {
    const { roomId } = useParams();
    const navigate = useNavigate();

    // Status & UI
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [callStatus, setCallStatus] = useState('Connecting to secure channel...');

    // Advanced Lobby State
    const [appointment, setAppointment] = useState(null);
    const [lobbyState, setLobbyState] = useState('loading'); // 'loading' | 'initial' | 'waiting' | 'error' | 'no-appointment'
    const [preSessionMood, setPreSessionMood] = useState(null);
    const [patientInsights, setPatientInsights] = useState(null);

    // Booking state
    const [availableTherapists, setAvailableTherapists] = useState([]);
    const [selectedTherapist, setSelectedTherapist] = useState(null);
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().slice(0, 16));

    // Refs
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const signalingSocketRef = useRef(null);
    const copilotSocketRef = useRef(null);
    const recognitionRef = useRef(null);

    // Initial state handling
    const [isSessionStarted, setIsSessionStarted] = useState(false);

    // Provide a random client ID for this user in the room
    const clientId = useRef(Math.random().toString(36).substring(7)).current;

    // Setup dynamic Room ID
    const activeRoomId = roomId || appointment?.id || `room-${auth?.session_id || 'default'}`;

    // WebRTC Config
    const rtcConfig = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    const isTherapist = auth?.therapist_id || identityMode === 'therapist';

    useEffect(() => {
        if (!auth) return;

        if (isTherapist) {
            // Therapists fetch their appointments and look for the specific roomId
            fetch(`${import.meta.env.VITE_API_URL}/api/appointments/therapist/${auth.therapist_id}`)
                .then(r => r.json())
                .then(apps => {
                    const currentApp = apps.find(a => a.id === roomId);
                    if (currentApp) {
                        setAppointment(currentApp);
                        setLobbyState('initial'); // Therapists bypass the waiting room check-in automatically
                    } else {
                        setLobbyState('error');
                    }
                })
                .catch(() => setLobbyState('error'));
        } else if (auth.user_id) {
            // Patients fetch their appointment details to enter the lobby
            fetch(`${import.meta.env.VITE_API_URL}/api/appointments/patient/${auth.user_id}`)
                .then(r => r.json())
                .then(apps => {
                    let currentApp = apps.find(a => a.id === roomId) || apps.find(a => ['Pending Confirmation', 'Waiting', 'In-Progress', 'Confirmed', 'Scheduled'].includes(a.status));

                    if (currentApp) {
                        setAppointment(currentApp);
                        if (currentApp.status === 'Pending Confirmation') {
                            setLobbyState('pending-confirmation');
                        } else if (currentApp.status === 'Confirmed' || currentApp.status === 'Scheduled') {
                            setLobbyState('initial'); // Allows pre-session checkin to enter waiting room
                        } else if (currentApp.status === 'Waiting') {
                            setLobbyState('waiting'); // Already in waiting room
                        } else {
                            setLobbyState('initial');
                        }
                    } else {
                        // Load therapists for booking if no appointment
                        fetch(`${import.meta.env.VITE_API_URL}/api/therapists`).then(r => r.json()).then(setAvailableTherapists).catch(() => { });
                        setLobbyState('no-appointment');
                    }
                })
                .catch(() => {
                    fetch(`${import.meta.env.VITE_API_URL}/api/therapists`).then(r => r.json()).then(setAvailableTherapists).catch(() => { });
                    setLobbyState('no-appointment');
                });
        }

        return () => { endCall(); };
    }, [roomId, auth, isTherapist]);

    // Poll for therapist admission/confirmation if waiting or pending confirmation
    useEffect(() => {
        if (!['waiting', 'pending-confirmation'].includes(lobbyState) || !appointment) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/patient/${auth.user_id}`);
                const apps = await res.json();
                const updated = apps.find(a => a.id === appointment.id);

                if (updated && updated.status === 'In-Progress') {
                    clearInterval(interval);
                    startSession();
                } else if (updated && updated.status !== appointment.status) {
                    setAppointment(updated);
                    if (updated.status === 'Confirmed') {
                        setLobbyState('initial'); // Allows them to check-in/join
                    } else if (updated.status === 'Rejected') {
                        setLobbyState('no-appointment'); // Reset
                    }
                }
            } catch (e) { }
        }, 5000); // Polling every 5s
        return () => clearInterval(interval);
    }, [lobbyState, appointment, auth]);

    // Fetch Patient Insights if user is a therapist
    useEffect(() => {
        if (auth && auth.therapist_id && appointment && appointment.user_id && !patientInsights) {
            fetch(`${import.meta.env.VITE_API_URL}/api/ai-insights/${appointment.user_id}`)
                .then(r => r.json())
                .then(setPatientInsights)
                .catch(() => { });
        }
    }, [auth, appointment]);

    const handleJoinLobby = async () => {
        if (!appointment) return;
        setLobbyState('waiting');
        try {
            // Update status to waiting
            await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appointment.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Waiting' })
            });
        } catch (e) { }
    }

    const startSession = async () => {
        if (isTherapist && appointment) {
            try {
                // Admit patient by setting status to In-Progress
                await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appointment.id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'In-Progress' })
                });
            } catch (err) {
                console.error("Failed to admit patient:", err);
            }
        }

        setIsSessionStarted(true);
        setTimeout(() => {
            setupMediaAndSignaling();
            setupSpeechRecognition();
        }, 100);
    };

    const setupMediaAndSignaling = async () => {
        try {
            // 1. Get local media (Video + Audio)
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            // 2. Initialize Peer Connection
            const pc = new RTCPeerConnection(rtcConfig);
            peerConnectionRef.current = pc;

            // Send ICE candidates to the other peer via the signaling server
            pc.onicecandidate = (event) => {
                if (event.candidate && signalingSocketRef.current) {
                    signalingSocketRef.current.send(JSON.stringify({
                        type: 'ice-candidate',
                        candidate: event.candidate
                    }));
                }
            };

            // Receive remote stream
            pc.ontrack = (event) => {
                setRemoteStream(event.streams[0]);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                    setCallStatus('Connected securely');
                }
            };

            // Add local tracks to peer connection
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // 3. Connect to Signaling WebSocket
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const wsBase = apiUrl.replace(/^http/, 'ws');
            const wsUrl = `${wsBase}/ws/signaling/${activeRoomId}/${clientId}`;
            const ws = new WebSocket(wsUrl);
            signalingSocketRef.current = ws;

            ws.onopen = async () => {
                // Wait for the therapist to initiate the offer
            };

            ws.onmessage = async (event) => {
                const message = JSON.parse(event.data);

                if (message.type === 'peer-joined' || message.type === 'patient-here') {
                    // If we are the therapist, we initiate the call (create offer) when someone joins or says they are here
                    if (isTherapist) {
                        try {
                            const offer = await pc.createOffer();
                            await pc.setLocalDescription(offer);
                            ws.send(JSON.stringify({ type: 'offer', offer }));
                        } catch (err) {
                            console.error("Error creating offer:", err);
                        }
                    } else if (message.type === 'peer-joined') {
                        // Patient lets therapist know they are here
                        ws.send(JSON.stringify({ type: 'patient-here' }));
                    }
                } else if (message.type === 'offer') {
                    // Patient receives offer, creates answer
                    if (!isTherapist) {
                        await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        ws.send(JSON.stringify({ type: 'answer', answer }));
                    }
                } else if (message.type === 'answer') {
                    // Therapist receives answer
                    if (isTherapist) {
                        await pc.setRemoteDescription(new RTCSessionDescription(message.answer));
                    }
                } else if (message.type === 'ice-candidate') {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
                    } catch (e) {
                        console.error('Error adding received ice candidate', e);
                    }
                } else if (message.type === 'peer-left') {
                    setCallStatus('Peer has left the session.');
                    setRemoteStream(null);
                }
            };

            // 4. Connect to Copilot Transcript WebSocket
            const copilotWs = new WebSocket(`${wsBase}/ws/copilot/${activeRoomId}`);
            copilotSocketRef.current = copilotWs;

        } catch (err) {
            console.error(err);
            setCallStatus("Error accessing camera/microphone.");
        }
    };

    const setupSpeechRecognition = () => {
        if (!SpeechRecognition) {
            console.warn("Speech Recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false; // We only send final segments to reduce LLM load
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const lastResult = event.results[event.results.length - 1];
            if (lastResult.isFinal) {
                const transcript = lastResult[0].transcript;

                // Send transcript chunk to backend copilot socket
                if (copilotSocketRef.current && copilotSocketRef.current.readyState === WebSocket.OPEN) {
                    copilotSocketRef.current.send(JSON.stringify({
                        type: 'transcript',
                        role: 'patient',
                        text: transcript
                    }));
                }
            }
        };

        recognition.onend = () => {
            // Auto restart if still in call and not intentionally muted
            if (peerConnectionRef.current && !isAudioMuted) {
                try { recognition.start(); } catch (e) { }
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoMuted(!isVideoMuted);
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsAudioMuted(!isAudioMuted);

            // Toggle speech recognition so we don't transcribe while manually muted
            if (!isAudioMuted && recognitionRef.current) {
                recognitionRef.current.stop();
            } else if (isAudioMuted && recognitionRef.current) {
                try { recognitionRef.current.start(); } catch (e) { }
            }
        }
    };

    const endCall = async (isManualEnd = false) => {
        // Send a session complete hook to trigger the final analysis
        if (copilotSocketRef.current && copilotSocketRef.current.readyState === WebSocket.OPEN) {
            copilotSocketRef.current.send(JSON.stringify({
                type: 'session_complete',
                full_transcript: "Full transcript reconstruction will happen on backend side eventually."
            }));
        }

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        if (signalingSocketRef.current) signalingSocketRef.current.close();
        if (copilotSocketRef.current) copilotSocketRef.current.close();
        if (recognitionRef.current) recognitionRef.current.stop();

        // If therapist ends a scheduled session manually, mark it completed
        if (isManualEnd && isTherapist && appointment?.id) {
            try {
                await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appointment.id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Completed' })
                });
            } catch (e) { console.error("Failed to update status to Completed", e); }
        }

        // Only navigate to feedback if it's a manual end of an active session
        if (isManualEnd && isSessionStarted) {
            if (isTherapist) {
                setLobbyState('completed');
                setIsSessionStarted(false);
            } else {
                navigate(`/app/feedback?type=video&session_id=${activeRoomId}`);
                setIsSessionStarted(false);
            }
        } else if (isManualEnd && !isSessionStarted && (lobbyState === 'waiting' || lobbyState === 'initial' || lobbyState === 'pending-confirmation')) {
            if (appointment && !isTherapist && lobbyState === 'waiting') {
                try {
                    // Revert status to Scheduled or Confirmed if patient leaves waiting room early
                    await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appointment.id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'Confirmed' })
                    });
                } catch (e) { }
            }
            navigate(isTherapist ? '/therapist/dashboard' : '/app');
        } else {
            setIsSessionStarted(false);
        }
    };

    if (!isSessionStarted) {
        return (
            <div className="video-session-container">
                <div className="session-header">
                    <div className="sh-brand">
                        <img src="/images/therabyte-icon.png" alt="TheraByte" />
                        <span>TheraByte <span className="sh-badge">SECURE</span></span>
                    </div>
                </div>
                <div className="video-stage" style={{ background: 'var(--bg-surface)' }}>
                    <div className="video-placeholder" style={{ color: 'var(--primary-navy)', textAlign: 'center', width: '100%', maxWidth: 500 }}>
                        <div style={{ background: 'rgba(121, 193, 176, 0.1)', padding: 24, borderRadius: '50%', marginBottom: 24, display: 'inline-block', flexShrink: 0 }}>
                            <Video size={48} color="var(--primary-mint)" />
                        </div>

                        {lobbyState === 'loading' ? (
                            <div style={{ padding: 40 }}>
                                <div className="pulsing-dot" style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary-mint)', display: 'inline-block', marginBottom: 16, animation: 'pulse 1.5s infinite alternate' }} />
                                <p>Loading session details...</p>
                            </div>
                        ) : (lobbyState === 'error' || lobbyState === 'no-appointment') ? (
                            <div className="booking-ui" style={{ width: '100%', textAlign: 'left' }}>
                                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', marginBottom: 12, color: 'var(--primary-navy)' }}>Secure Video Session</h1>
                                <p style={{ color: '#5a6b7d', marginBottom: 32 }}>Book a private, end-to-end encrypted session with a verified specialist.</p>

                                <div style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(16px)', padding: '32px', borderRadius: 'var(--r-2xl)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                                    <h4 style={{ marginBottom: 16, fontSize: '0.9rem', textTransform: 'uppercase', color: '#94a3b8' }}>1. Select a Specialist</h4>
                                    <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                                        {availableTherapists.map(t => (
                                            <div
                                                key={t.id}
                                                onClick={() => setSelectedTherapist(t)}
                                                style={{
                                                    padding: '16px 20px', borderRadius: 12, cursor: 'pointer', border: '2px solid',
                                                    background: selectedTherapist?.id === t.id ? 'var(--primary-mint-dim)' : '#f8fafc',
                                                    borderColor: selectedTherapist?.id === t.id ? 'var(--primary-mint)' : 'transparent',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>Dr. {t.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{t.specialization}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <h4 style={{ marginBottom: 12, fontSize: '0.9rem', textTransform: 'uppercase', color: '#94a3b8' }}>2. Preferred Time</h4>
                                    <input
                                        type="datetime-local"
                                        className="glass"
                                        value={bookingDate}
                                        onChange={(e) => setBookingDate(e.target.value)}
                                        style={{ width: '100%', padding: '14px', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 28 }}
                                    />

                                    <button
                                        className="btn-primary"
                                        disabled={!selectedTherapist}
                                        style={{ width: '100%', padding: '16px', borderRadius: 12 }}
                                        onClick={async () => {
                                            await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/book`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    user_id: auth.user_id,
                                                    therapist_id: selectedTherapist.id,
                                                    scheduled_time: new Date(bookingDate).toISOString()
                                                })
                                            });
                                            // Instead of reload, fetch the new appointment and update state
                                            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/patient/${auth.user_id}`);
                                            const apps = await res.json();
                                            const newApp = apps.find(a => ['Pending Confirmation', 'Waiting', 'In-Progress', 'Confirmed', 'Scheduled'].includes(a.status));
                                            if (newApp) {
                                                setAppointment(newApp);
                                                setLobbyState('pending-confirmation');
                                            }
                                        }}
                                    >
                                        Request Session Confirmation
                                    </button>
                                </div>
                            </div>
                        ) : lobbyState === 'pending-confirmation' ? (
                            <>
                                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 16 }}>Request Sent</h1>
                                <div style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(16px)', padding: 32, borderRadius: 'var(--r-2xl)', border: '1px solid rgba(255,255,255,0.5)', marginBottom: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                                    <div className="pulsing-dot" style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--amber)', display: 'inline-block', marginBottom: 20, animation: 'pulse 1.5s infinite alternate' }} />
                                    <h3 style={{ marginBottom: 8 }}>Appointment Request Sent – Awaiting Confirmation</h3>
                                    <p style={{ color: '#5a6b7d', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                        {appointment ? `Your request for a session with Dr. ${appointment.therapist_name} at ${new Date(appointment.scheduled_time).toLocaleString()} is pending therapist confirmation.` : ''}
                                    </p>
                                </div>
                                <style>{`@keyframes pulse { from { opacity: 0.4; transform: scale(0.8) } to { opacity: 1; transform: scale(1.1) } }`}</style>
                            </>
                        ) : lobbyState === 'completed' ? (
                            <div style={{ textAlign: 'center', padding: 40 }}>
                                <div style={{ background: 'var(--green-dim)', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <CheckCircle size={40} color="var(--green)" />
                                </div>
                                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', marginBottom: 12 }}>Session Completed</h1>
                                <p style={{ color: '#5a6b7d', marginBottom: 32 }}>
                                    The session has been successfully concluded and marked as completed.
                                    AI insights and SOAP notes are being processed.
                                </p>
                                <button className="btn-primary" onClick={() => navigate('/therapist/dashboard')}>Return to Dashboard</button>
                            </div>
                        ) : lobbyState === 'waiting' ? (
                            <>
                                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 16, color: 'var(--primary-navy)' }}>Secure Lobby</h1>
                                <div style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(16px)', padding: 32, borderRadius: 'var(--r-2xl)', border: '1px solid rgba(255,255,255,0.6)', marginBottom: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--primary-mint)', animation: 'pulse 1.5s infinite alternate', flexShrink: 0 }} />
                                        <h3 style={{ margin: 0 }}>Waiting for Dr. {appointment?.therapist_name}</h3>
                                    </div>
                                    <p style={{ color: '#5a6b7d', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                                        The specialist has been notified. The secure video feed will start automatically once they admit you.
                                    </p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <button
                                        onClick={() => endCall(true)}
                                        style={{
                                            background: 'rgba(255,255,255,0.6)',
                                            backdropFilter: 'blur(12px)',
                                            border: '1px solid rgba(0,0,0,0.12)',
                                            borderRadius: 'var(--r-full)',
                                            padding: '13px 32px',
                                            fontSize: '0.95rem',
                                            fontWeight: 600,
                                            color: '#5a6b7d',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontFamily: 'var(--font-body)',
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; e.currentTarget.style.color = '#0f172a'; }}
                                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; e.currentTarget.style.color = '#5a6b7d'; }}
                                    >
                                        ← Leave Waiting Room
                                    </button>
                                </div>
                                <style>{`@keyframes pulse { from { opacity: 0.4; transform: scale(0.8) } to { opacity: 1; transform: scale(1.1) } }`}</style>
                            </>
                        ) : (
                            <>
                                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: 16 }}>Video Consultation</h2>
                                <p style={{ maxWidth: 400, margin: '0 auto 24px', color: '#5a6b7d', lineHeight: 1.6 }}>
                                    {appointment ? (isTherapist ? `Session with patient ${appointment.patient_name}. ` : `Upcoming session with Dr. ${appointment.therapist_name}. `) : ''}
                                    {isTherapist ? 'Conduct your clinical consultation via this secure, encrypted video channel.' : 'Connect with your therapist via a secure, end-to-end encrypted video call.'}
                                </p>

                                {appointment && !isTherapist && (
                                    <div style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(16px)', padding: '32px', borderRadius: 'var(--r-2xl)', border: '1px solid rgba(255,255,255,0.5)', marginBottom: 32, textAlign: 'left', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                                        <h4 style={{ marginBottom: 16, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: 8 }}>Pre-Session Check-in</h4>
                                        <p style={{ fontSize: '0.9rem', color: '#5a6b7d', marginBottom: 12 }}>How are you feeling right now?</p>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                                            {['Calm', 'Anxious', 'Sad', 'Stressed', 'Neutral'].map(m => (
                                                <button
                                                    key={m}
                                                    onClick={() => setPreSessionMood(m)}
                                                    style={{
                                                        padding: '8px 16px', borderRadius: 20, border: '1px solid #e2e8f0',
                                                        background: preSessionMood === m ? 'var(--primary-mint)' : 'white',
                                                        color: preSessionMood === m ? 'white' : '#5a6b7d',
                                                        cursor: 'pointer', transition: 'all 0.2s'
                                                    }}
                                                >{m}</button>
                                            ))}
                                        </div>
                                        <button
                                            className="btn-primary"
                                            style={{ width: '100%', padding: '14px', borderRadius: 12 }}
                                            onClick={handleJoinLobby}
                                            disabled={!preSessionMood}
                                        >
                                            {preSessionMood ? 'Join Lobby' : 'Select a mood to continue'}
                                        </button>
                                    </div>
                                )}
                                {appointment && isTherapist && (
                                    <div style={{ textAlign: 'center' }}>
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '16px 32px', fontSize: '1.1rem', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                                            onClick={startSession}
                                        >
                                            <Video /> Start Consultation
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="video-session-container">
            {/* Top Bar */}
            <div className="session-header">
                <div className="sh-brand">
                    <img src="/images/therabyte-icon.png" alt="TheraByte" />
                    <span>TheraByte <span className="sh-badge">SECURE</span></span>
                </div>
                <div className="sh-status">
                    <div className={`status-dot ${remoteStream ? 'active' : 'waiting'}`}></div>
                    {callStatus}
                </div>
                <div className="sh-identity">
                    Acting as: <strong>{auth?.name || identityMode}</strong>
                </div>
            </div>

            <div className={isTherapist ? "therapist-layout" : "patient-layout"} style={!isTherapist ? { height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' } : {}}>
                {/* Main Stage */}
                <div className="video-stage">
                    {/* Remote Video */}
                    <div className="remote-video-container">
                        {!remoteStream && (
                            <div className="video-placeholder">
                                <Activity className="vp-icon animate-pulse" />
                                <p>Waiting for peer to join...</p>
                            </div>
                        )}
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className={`remote-video ${remoteStream ? 'show' : ''}`}
                        />
                        {remoteStream && (
                            <div className="video-label">{isTherapist ? 'Patient' : 'Therapist'}</div>
                        )}
                    </div>

                    {/* Local Video */}
                    <div className="local-video-container">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`local-video ${isVideoMuted ? 'muted' : ''}`}
                        />
                        {isVideoMuted && (
                            <div className="local-placeholder">
                                <VideoOff size={32} color="rgba(255,255,255,0.7)" />
                            </div>
                        )}
                        <div className="video-label">You</div>
                    </div>

                    {/* Controls overlay */}
                    <div className="session-controls controls-overlay">
                        <button
                            className={`ctrl-btn ${isAudioMuted ? 'muted' : ''}`}
                            onClick={toggleAudio}
                            title="Toggle Audio"
                        >
                            {isAudioMuted ? <MicOff /> : <Mic />}
                        </button>
                        <button
                            className={`ctrl-btn ${isVideoMuted ? 'muted' : ''}`}
                            onClick={toggleVideo}
                            title="Toggle Video"
                        >
                            {isVideoMuted ? <VideoOff /> : <Video />}
                        </button>
                        <button
                            className="ctrl-btn end-call"
                            onClick={() => endCall(true)}
                            title="End Session"
                        >
                            <PhoneOff />
                        </button>
                    </div>
                </div>

                {/* Therapist Copilot Side Panel */}
                {isTherapist && (
                    <div className="copilot-panel" style={{ background: '#f8fafc', borderLeft: '1px solid #e2e8f0', padding: '24px', overflowY: 'auto' }}>
                        <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-mint)" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z" /><path d="M12 12 2.1 7.1" /><path d="m12 12 9.9 4.9" /></svg>
                            AI Co-Pilot
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '24px' }}>Real-time therapeutic context</p>

                        {!patientInsights ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                                <div className="pulsing-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: '#cbd5e1', display: 'inline-block', marginBottom: 16, animation: 'pulse 1.5s infinite alternate' }} />
                                <p>Loading patient insights...</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Sentiment Trend</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: patientInsights.sentiment_trend === 'Downward' ? '#fee2e2' : '#dcfce3', color: patientInsights.sentiment_trend === 'Downward' ? '#b91c1c' : '#15803d' }}>
                                            {patientInsights.sentiment_trend || 'Stable'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
                                        {patientInsights.overall_assessment || patientInsights.assessment || 'No recent clinical assessment available.'}
                                    </div>
                                </div>

                                <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Key Focus Areas</span>
                                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>
                                        <li>Areas of Concern: <strong style={{ color: '#ef4444' }}>{(patientInsights.areas_of_concern || []).join(', ') || 'None identified'}</strong></li>
                                        <li>Strengths: <strong style={{ color: '#10b981' }}>{(patientInsights.strengths_observed || []).join(', ') || 'None identified'}</strong></li>
                                        <li>Approach: <strong>{patientInsights.therapeutic_approach || 'Supportive counseling'}</strong></li>
                                    </ul>
                                </div>

                                <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0369a1', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Live Transcript Events</span>
                                    <div style={{ fontSize: '0.85rem', color: '#0ea5e9', fontStyle: 'italic' }}>
                                        Speech recognition is active. High-risk keywords will flag here during the session.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
