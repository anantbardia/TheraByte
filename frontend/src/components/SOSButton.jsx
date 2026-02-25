import React from 'react';

const SOSButton = ({ onTrigger }) => {
    return (
        <button className="sos-button" onClick={onTrigger} title="Emergency Support">
            SOS
        </button>
    );
};

export default SOSButton;
