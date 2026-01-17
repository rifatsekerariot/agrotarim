import React from 'react';

const SoilPHWidget = ({ data }) => {
    const ph = data?.value || 6.8;
    const min = 5.5;
    const max = 7.5;

    // Normalize percentage
    const percent = Math.min(Math.max(((ph - min) / (max - min)) * 100, 0), 100);

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            <div className="mb-3">
                <span className="display-6 fw-bold text-dark">{ph}</span>
                <span className="ms-2 badge bg-success align-top small" style={{ fontSize: '0.8rem' }}>İdeal</span>
            </div>

            {/* Gradient Bar */}
            <div className="position-relative mx-3 mb-2">
                <div style={{
                    height: '8px',
                    borderRadius: '4px',
                    background: 'linear-gradient(90deg, #ffc107 0%, #198754 50%, #0d6efd 100%)', // Acid(Yellow) -> Neutral(Green) -> Base(Blue) approximation
                    width: '100%'
                }}></div>

                {/* Indicator */}
                <div style={{
                    position: 'absolute',
                    top: '-6px',
                    left: `${percent}%`,
                    width: '4px',
                    height: '20px',
                    background: '#333',
                    transform: 'translateX(-50%)',
                }}></div>
            </div>

            <div className="d-flex justify-content-between mx-3 text-muted small fw-bold" style={{ fontSize: '0.7rem' }}>
                <span>Asidik</span>
                <span>Bazik</span>
            </div>
            <div className="d-flex justify-content-between mx-3 text-muted small mt-1" style={{ fontSize: '0.7rem' }}>
                <span>{min}</span>
                <span>{max}</span>
            </div>
        </div>
    );
};

export default SoilPHWidget;
