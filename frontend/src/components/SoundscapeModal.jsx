import React, { useState, useRef } from 'react';
import { X, Play, Pause, Volume2, CloudRain, Waves, Trees, Wind } from 'lucide-react';
import './WellnessModals.css';

const SOUNDS = [
    { id: 'rain', name: 'Gentle Rain', icon: <CloudRain />, color: '#3b82f6', url: 'https://cdn.pixabay.com/download/audio/2022/07/04/audio_34e007823f.mp3?filename=heavy-rain-nature-sounds-8186.mp3' },
    { id: 'waves', name: 'Ocean Waves', icon: <Waves />, color: '#0ea5e9', url: 'https://cdn.pixabay.com/download/audio/2022/02/22/audio_73e7210e7b.mp3?filename=ocean-wave-2-121016.mp3' },
    { id: 'forest', name: 'Forest Birds', icon: <Trees />, color: '#10b981', url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_15a995db84.mp3?filename=forest-with-small-river-birds-and-nature-field-recording-6735.mp3' },
    { id: 'wind', name: 'Soft Wind', icon: <Wind />, color: '#8b5cf6', url: 'https://cdn.pixabay.com/download/audio/2023/02/10/audio_5594b59521.mp3?filename=gentle-wind-nature-sounds-137682.mp3' },
];

export default function SoundscapeModal({ onClose }) {
    const [activeSound, setActiveSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const audioRef = useRef(null);

    const handlePlay = (sound) => {
        if (activeSound?.id === sound.id) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        } else {
            if (audioRef.current) audioRef.current.pause();
            setActiveSound(sound);
            setIsPlaying(true);
        }
    };

    const handleVolume = (e) => {
        const v = parseFloat(e.target.value);
        setVolume(v);
        if (audioRef.current) audioRef.current.volume = v;
    };

    return (
        <div className="wellness-modal-overlay">
            <div className="wellness-modal soundscape-modal">
                <button className="wm-close" onClick={() => { if (audioRef.current) audioRef.current.pause(); onClose(); }}><X /></button>

                <div className="wm-header">
                    <span className="wm-tag tc-slate">Sensory Regulation</span>
                    <h2>Calming Soundscape</h2>
                    <p>Mask intrusive thoughts or environmental noise with ambient sounds.</p>
                </div>

                <div className="ss-content">
                    <div className="ss-grid">
                        {SOUNDS.map(s => (
                            <div
                                key={s.id}
                                className={`ss-card ${activeSound?.id === s.id ? 'active' : ''}`}
                                onClick={() => handlePlay(s)}
                                style={{ '--theme': s.color }}
                            >
                                <div className="ss-icon">
                                    {activeSound?.id === s.id && isPlaying ? <div className="ss-eq"><span /><span /><span /></div> : s.icon}
                                </div>
                                <h4>{s.name}</h4>
                            </div>
                        ))}
                    </div>

                    {activeSound && (
                        <div className="ss-controls fade-in">
                            <div className="ss-now-playing">
                                <strong>Now Playing:</strong> {activeSound.name}
                            </div>
                            <div className="ss-volume">
                                <Volume2 size={18} />
                                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolume} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Audio element holding the current stream */}
                {activeSound && (
                    <audio
                        ref={audioRef}
                        src={activeSound.url}
                        loop
                        autoPlay
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onLoadedData={() => { if (audioRef.current) audioRef.current.volume = volume; }}
                    />
                )}
            </div>
        </div>
    );
}
