import React from 'react';

const WaterTempWidget = ({ data }) => {
    // Re-using SoilTemp logic but optimized for water specific visuals (blue theme)
    const temp = data?.value || 22.5;
    const min = 15;
    const max = 30;
    const idealMin = 18;
    const idealMax = 24;

    const percent = Math.min(Math.max(((temp - min) / (max - min)) * 100, 0), 100);

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            <div className="mb-4">
                <span className="display-6 fw-bold text-dark">{temp}</span>
                <span className="fs-5 text-muted">°C</span>
            </div>

            <div className="position-relative mb-2 mx-3">
                <div style={{ height: '6px', background: '#e9ecef', borderRadius: '3px', width: '100%' }}></div>

                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: `${((idealMin - min) / (max - min)) * 100}%`,
                    width: `${((idealMax - idealMin) / (max - min)) * 100}%`,
                    height: '6px',
                    background: '#0d6efd',
                    opacity: 0.3,
                    borderRadius: '2px'
                }}></div>

                <div style={{
                    position: 'absolute',
                    top: '-6px',
                    left: `${percent}%`,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#0d6efd',
                    border: '3px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transform: 'translateX(-50%)'
                }}></div>

                <div className="d-flex justify-content-between mt-2 text-muted small" style={{ fontSize: '0.75rem' }}>
                    <span>{min}°</span>
                    <span>{max}°</span>
                </div>
            </div>

            <div className="mt-2 text-center">
                <span className="badge bg-primary rounded-pill">İdeal</span>
            </div>
        </div>
    );
};

export default WaterTempWidget;
