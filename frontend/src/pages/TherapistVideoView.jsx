import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Activity, AlertCircle, Bot, Sparkles, BrainCircuit } from 'lucide-react';
import './VideoSession.css';

// Web Speech API for transcribing Therapist
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function TherapistVideoView({ auth }) {
    const { roomId } = useParams();
    const navigate = useNavigate();

    // Media State
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [callStatus, setCallStatus] = useState('Waiting for patient to join...');

    // Copilot State
    const [liveInsights, setLiveInsights] = useState([]);
    const [detectedEmotion, setDetectedEmotion] = useState("Calm");
    const [riskFlag, setRiskFlag] = useState(false);

    // When the session ends, if we get a post-session report we show it in a modal
    const [sessionReport, setSessionReport] = useState(null);

    // Refs
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const signalingSocketRef = useRef(null);
    const copilotSocketRef = useRef(null);
    const recognitionRef = useRef(null);

    const clientId = useRef(Math.random().toString(36).substring(7)).current;

    // WebRTC Config
    const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

    useEffect(() => {
        // Mark appointment as 'In-Progress' so patient lobby will auto-join
        fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${roomId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'In-Progress' })
        }).then(() => {
            setupMediaAndSignaling();
            setupSpeechRecognition();
        }).catch(err => {
            console.error("Failed to update status", err);
            setupMediaAndSignaling();
            setupSpeechRecognition();
        });

        return () => { endCall(); };
    }, [roomId]);

    const setupMediaAndSignaling = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            const pc = new RTCPeerConnection(rtcConfig);
            peerConnectionRef.current = pc;

            pc.onicecandidate = (event) => {
                if (event.candidate && signalingSocketRef.current) {
                    signalingSocketRef.current.send(JSON.stringify({ type: 'ice-candidate', candidate: event.candidate }));
                }
            };

            pc.ontrack = (event) => {
                setRemoteStream(event.streams[0]);
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
                setCallStatus('Patient Connected');
            };

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//localhost:8000/ws/signaling/${roomId}/${clientId}`;
            const ws = new WebSocket(wsUrl);
            signalingSocketRef.current = ws;

            ws.onopen = async () => {
                // Therapist creates the offer. If patient is already there, they will receive it.
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    ws.send(JSON.stringify({ type: 'offer', offer }));
                } catch (e) { console.error(e); }
            };

            ws.onmessage = async (event) => {
                const message = JSON.parse(event.data);

                if (message.type === 'peer-joined' || message.type === 'patient-here') {
                    // Patient just joined or responded. Send/resend offer.
                    try {
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        ws.send(JSON.stringify({ type: 'offer', offer }));
                    } catch (e) { console.error(e); }
                } else if (message.type === 'offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    ws.send(JSON.stringify({ type: 'answer', answer }));
                } else if (message.type === 'answer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(message.answer));
                } else if (message.type === 'ice-candidate') {
                    await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
                } else if (message.type === 'peer-left') {
                    setCallStatus('Patient has left.');
                    setRemoteStream(null);
                }
            };

            // Copilot Socket handling live insights
            const copilotWs = new WebSocket(`${protocol}//localhost:8000/ws/copilot/${roomId}`);
            copilotSocketRef.current = copilotWs;

            copilotWs.onmessage = (event) => {
                const payload = JSON.parse(event.data);
                if (payload.type === 'insight') {
                    const data = payload.data;
                    if (data.insights) {
                        setLiveInsights(prev => [...data.insights, ...prev].slice(0, 5)); // Keep last 5
                    }
                    if (data.detected_emotion) setDetectedEmotion(data.detected_emotion);
                    if (data.risk_flag) setRiskFlag(true);
                } else if (payload.type === 'comprehensive_report') {
                    // Post-session report received
                    setSessionReport(payload.data);
                }
            };

        } catch (err) {
            console.error(err);
            setCallStatus("Camera/Microphone access required.");
        }
    };

    const setupSpeechRecognition = () => {
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const lastResult = event.results[event.results.length - 1];
            if (lastResult.isFinal) {
                const transcript = lastResult[0].transcript;
                if (copilotSocketRef.current && copilotSocketRef.current.readyState === WebSocket.OPEN) {
                    copilotSocketRef.current.send(JSON.stringify({
                        type: 'transcript',
                        role: 'therapist',
                        text: transcript
                    }));
                }
            }
        };

        recognition.onend = () => {
            if (peerConnectionRef.current && !isAudioMuted) {
                try { recognition.start(); } catch (e) { }
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
            setIsVideoMuted(!isVideoMuted);
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
            setIsAudioMuted(!isAudioMuted);

            if (!isAudioMuted && recognitionRef.current) recognitionRef.current.stop();
            else if (isAudioMuted && recognitionRef.current) try { recognitionRef.current.start(); } catch (e) { }
        }
    };

    const requestSessionReport = () => {
        // We simulate asking backend for the completed report
        if (copilotSocketRef.current && copilotSocketRef.current.readyState === WebSocket.OPEN) {
            copilotSocketRef.current.send(JSON.stringify({
                type: 'session_complete',
                full_transcript: "Simulated full transcript for post-session analysis generation."
            }));
            setCallStatus("Generating comprehensive report...");
        }
    }

    const endCall = () => {
        if (localStream) localStream.getTracks().forEach(track => track.stop());
        if (peerConnectionRef.current) peerConnectionRef.current.close();
        if (signalingSocketRef.current) signalingSocketRef.current.close();

        // If we want to immediately leave, we just clear and nav.
        // We'll give the therapist the option to wait for report if they haven't explicitly requested it yet.
        if (!sessionReport) {
            navigate('/therapist/dashboard');
        }
    };

    const assignTherapy = (moduleId) => {
        // Logic to update Patient's assigned therapy in backend
        alert(`Assigned ${moduleId} to patient.`);
        navigate('/therapist/dashboard');
    }

    if (sessionReport) {
        return (
            <div className="report-modal-overlay">
                <div className="report-modal">
                    <h2>Session Report & Recommendations</h2>

                    <div className="rep-section">
                        <h4>SOAP Note</h4>
                        <p><strong>S:</strong> {sessionReport.soap_note?.subjective}</p>
                        <p><strong>O:</strong> {sessionReport.soap_note?.objective}</p>
                        <p><strong>A:</strong> {sessionReport.soap_note?.assessment}</p>
                        <p><strong>P:</strong> {sessionReport.soap_note?.plan}</p>
                    </div>

                    <div className="rep-section">
                        <h4>Suggested Modules for Patient</h4>
                        <div className="module-list">
                            {sessionReport.suggested_therapy_modules?.map(m => (
                                <div key={m.module_id} className="module-card">
                                    <h5>{m.module_name}</h5>
                                    <p>{m.reason}</p>
                                    <button onClick={() => assignTherapy(m.module_id)} className="btn-primary">Assign this Therapy</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={() => navigate('/therapist/dashboard')} className="btn-secondary" style={{ marginTop: 24 }}>Return to Dashboard</button>
                </div>
            </div>
        )
    }

    return (
        <div className="video-session-container therapist-layout">

            {/* 1. Main Stage */}
            <div className="video-stage">
                <div className="remote-video-container">
                    {!remoteStream && (
                        <div className="video-placeholder">
                            <Activity className="vp-icon animate-pulse" />
                            <p>{callStatus}</p>
                        </div>
                    )}
                    <video ref={remoteVideoRef} autoPlay playsInline className={`remote-video ${remoteStream ? 'show' : ''}`} />
                    {remoteStream && <div className="video-label">Patient</div>}
                </div>

                <div className="local-video-container">
                    <video ref={localVideoRef} autoPlay playsInline muted className={`local-video ${isVideoMuted ? 'muted' : ''}`} />
                    <div className="video-label">You</div>
                </div>

                <div className="session-controls">
                    <button className={`ctrl-btn ${isAudioMuted ? 'muted' : ''}`} onClick={toggleAudio}><MicOff className={!isAudioMuted ? 'hidden' : ''} /><Mic className={isAudioMuted ? 'hidden' : ''} /></button>
                    <button className={`ctrl-btn ${isVideoMuted ? 'muted' : ''}`} onClick={toggleVideo}><VideoOff className={!isVideoMuted ? 'hidden' : ''} /><Video className={isVideoMuted ? 'hidden' : ''} /></button>
                    <button className="ctrl-btn end-call" onClick={requestSessionReport} title="End & Get Report"><PhoneOff /></button>
                </div>
            </div>

            {/* 2. Co-Pilot Sidebar */}
            <div className="copilot-sidebar">
                <div className="cp-header">
                    <h3><BrainCircuit /> AI Co-Pilot</h3>
                </div>

                <div className="cp-state">
                    <div className="cst-item">
                        <span>Current Emotion</span>
                        <strong>{detectedEmotion}</strong>
                    </div>
                    <div className={`cst-item ${riskFlag ? 'danger' : ''}`}>
                        <span>Safety Risk</span>
                        <strong>{riskFlag ? 'Elevated' : 'None Detected'}</strong>
                    </div>
                </div>

                <div className="cp-body">
                    {liveInsights.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#64748b', marginTop: 40 }}>
                            <Sparkles size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                            <p>AI is listening.</p>
                            <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Insights will appear here automatically based on patient phrasing.</p>
                        </div>
                    ) : (
                        <div className="insights-list">
                            {liveInsights.map((insight, idx) => (
                                <div key={idx} className="insight-card">
                                    <div className="inc-obs">{insight.observation}</div>
                                    <div className="inc-sug">{insight.suggestion}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
