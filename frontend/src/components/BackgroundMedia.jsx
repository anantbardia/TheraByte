import React from 'react';
import './BackgroundMedia.css';

const BackgroundMedia = () => {
    return (
        <div className="bg-media-container">
            {/* Ultra Premium Video Background */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="bg-video"
            >
                {/* A high-quality abstract dark neural/network tech video from a safe CDN */}
                <source src="https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-network-connection-background-27898-large.mp4" type="video/mp4" />
            </video>

            {/* Ambient overlay to ensure text readability and maintain the brand colors */}
            <div className="bg-overlay"></div>

            {/* The animated orbs from previous implementation remain as fluid foreground accents */}
            <div className="bg-orbs"></div>
        </div>
    );
};

export default BackgroundMedia;
