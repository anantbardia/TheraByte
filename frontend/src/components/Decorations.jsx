import React from 'react';
import './Decorations.css';

// Gentle organic blob (Static by default, can be animated)
export const SoftBlob = ({ color = 'var(--primary-mint-dim)', size = 300, style, className = '' }) => (
    <svg className={`deco-blob ${className}`} width={size} height={size} viewBox="0 0 200 200" style={{ position: 'absolute', zIndex: 0, pointerEvents: 'none', ...style }} xmlns="http://www.w3.org/2000/svg">
        <path fill={color} d="M45.7,-76.3C58.9,-69.3,69.1,-55.3,77.5,-40.5C85.9,-25.7,92.5,-10.1,90.4,4.5C88.3,19.1,77.6,32.7,66.6,44.2C55.6,55.7,44.3,65.1,30.8,71.5C17.3,77.9,1.6,81.3,-13.2,79.5C-28,77.7,-41.9,70.7,-53.4,60.8C-64.9,50.9,-74,38.1,-79.8,23.6C-85.6,9.1,-88.1,-7,-83.4,-20.5C-78.7,-34,-66.8,-44.9,-54,-52.7C-41.2,-60.5,-27.5,-65.2,-13.3,-67.6C0.9,-70,15.1,-70.1,32.5,-73.3Z" transform="translate(100 100)" />
    </svg>
);

// Slow rotating minimalist star (Moving)
export const RotatingStar = ({ color = 'var(--amber-100)', size = 60, style }) => (
    <svg className="rotate-slow" width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute', zIndex: 0, pointerEvents: 'none', ...style }} xmlns="http://www.w3.org/2000/svg">
        <path fill={color} d="M50 0L53.5 35.5L85.5 14.5L64.5 46.5L100 50L64.5 53.5L85.5 85.5L53.5 64.5L50 100L46.5 64.5L14.5 85.5L35.5 53.5L0 50L35.5 46.5L14.5 14.5L46.5 35.5Z" />
    </svg>
);

// Gentle floating minimalist ring (Moving)
export const FloatingRing = ({ color = 'var(--teal-200)', size = 120, thickness = 2, style }) => (
    <div className="float-slow" style={{
        position: 'absolute',
        width: size, height: size,
        border: `${thickness}px solid ${color}`,
        borderRadius: '50%',
        zIndex: 0,
        pointerEvents: 'none',
        ...style
    }}></div>
);

// Premium soft noise overlay for texture (Static)
export const NoiseOverlay = () => (
    <div className="premium-noise-overlay"></div>
);

// Subtle dot grid background (Static)
export const DotGrid = ({ style }) => (
    <div className="premium-dot-grid" style={style}></div>
);
