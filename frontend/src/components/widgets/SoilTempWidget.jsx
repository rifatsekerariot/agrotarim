import React from 'react';

const SoilTempWidget = ({ data }) => {
    const temp = data?.value || 18.5;
    const min = 10;
    const max = 30;
    const idealMin = 15;
    const idealMax = 25;

    // Calculate position percent
    const percent = Math.min(Math.max(((temp - min) / (max - min)) * 100, 0), 100);

    let status = 'İdeal';
    let color = '#198754'; // success
    if (temp < idealMin) { status = 'Düşük'; color = '#0dcaf0'; } // cyan/cold
    else if (temp > idealMax) { status = 'Yüksek'; color = '#dc3545'; } // red/hot

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">

            <div className="mb-4">
                <span className="display-6 fw-bold text-dark">{temp}</span>
                <span className="fs-5 text-muted">°C</span>
            </div>

            <div className="position-relative mb-2 mx-3">
                {/* Track */}
                <div style={{ height: '6px', background: '#e9ecef', borderRadius: '3px', width: '100%' }}></div>

                {/* Ideal Range Marker */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: `${((idealMin - min) / (max - min)) * 100}%`,
                    width: `${((idealMax - idealMin) / (max - min)) * 100}%`,
                    height: '6px',
                    background: '#198754', // success color
                    opacity: 0.3,
                    borderRadius: '2px'
                }}></div>

                {/* Thumb/Indicator */}
                <div style={{
                    position: 'absolute',
                    top: '-6px',
                    left: `${percent}%`,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: color,
                    border: '3px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transform: 'translateX(-50%)',
                    transition: 'left 0.5s ease'
                }}></div>

                {/* Labels */}
                <div className="d-flex justify-content-between mt-2 text-muted small" style={{ fontSize: '0.75rem' }}>
                    <span>{min}°</span>
                    <span>{max}°</span>
                </div>
            </div>

            <div className="mt-2 text-center">
                <span className="badge rounded-pill" style={{ backgroundColor: color }}>{status}</span>
                <div className="text-muted small mt-1">İdeal: {idealMin}-{idealMax}°C</div>
            </div>
        </div>
    );
};

export default SoilTempWidget;
