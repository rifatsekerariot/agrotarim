import React from 'react';

const LightIntensityWidget = ({ data }) => {
    const lux = data?.value || 32500;

    // Day length calc mock
    const hours = 8;
    const minutes = 24;

    return (
        <div className="d-flex flex-column h-100 p-2 text-center overflow-hidden position-relative">
            <div className="h2 fw-bold text-top mb-4 mt-2">{lux.toLocaleString()} <span className="fs-6 text-muted">lux</span></div>

            {/* Animated Sun */}
            <div className="flex-grow-1 d-flex align-items-center justify-content-center position-relative">
                <div className="sun-container position-relative" style={{ width: '60px', height: '60px' }}>
                    {/* Core Sun */}
                    <div style={{
                        width: '100%', height: '100%',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, #ffeb3b 30%, #fbc02d 100%)',
                        boxShadow: '0 0 20px #ffeb3b',
                        position: 'relative',
                        zIndex: 2
                    }}></div>

                    {/* Rays Animation (Simple CSS pulse for now or multiple divs) */}
                    <div style={{
                        position: 'absolute', top: '-10px', left: '-10px', right: '-10px', bottom: '-10px',
                        borderRadius: '50%',
                        background: 'rgba(255, 235, 59, 0.3)',
                        animation: 'pulse 2s infinite',
                        zIndex: 1
                    }}></div>
                </div>

                {/* Ray beams (static for now) */}
                <div style={{
                    position: 'absolute',
                    bottom: '0',
                    width: '80%',
                    height: '4px',
                    background: 'linear-gradient(90deg, transparent, #ffeb3b, transparent)',
                    opacity: 0.5
                }}></div>
            </div>

            <div className="mt-2 small text-muted">
                <div>Gün Işığı Süresi</div>
                <div className="fw-bold text-dark">{hours}s {minutes}dk</div>
            </div>
        </div>
    );
};

export default LightIntensityWidget;
