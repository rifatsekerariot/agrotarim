import React from 'react';
import { Badge } from 'react-bootstrap';

const UltrasonicWidget = ({ data, settings = {} }) => {
    const distance = data?.value ?? null;
    const { tankHeight = 200, emptyDistance = 200, fullDistance = 10 } = settings;

    // No data state
    if (distance === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>📡</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    // Calculate fill percentage (smaller distance = more full)
    const range = emptyDistance - fullDistance;
    const filledHeight = emptyDistance - distance;
    const percentage = Math.max(0, Math.min(100, (filledHeight / range) * 100));

    let variant = 'primary';
    if (percentage < 20) variant = 'danger';
    else if (percentage < 40) variant = 'warning';
    else if (percentage > 80) variant = 'success';

    return (
        <div className="d-flex flex-column h-100 p-2">
            <div className="flex-grow-1 d-flex align-items-center justify-content-center">
                {/* Tank Visualization */}
                <div style={{
                    width: '60px',
                    height: '100px',
                    border: '3px solid #dee2e6',
                    borderRadius: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                    background: '#f8f9fa'
                }}>
                    {/* Fill Level */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: `${percentage}%`,
                        background: `var(--bs-${variant})`,
                        transition: 'height 0.5s ease',
                        opacity: 0.8
                    }}></div>

                    {/* Percentage Overlay */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontWeight: 'bold',
                        color: percentage > 50 ? '#fff' : '#333',
                        zIndex: 2
                    }}>
                        {percentage.toFixed(0)}%
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="text-center">
                <Badge bg={variant} className="mb-1">
                    {percentage < 20 ? 'Düşük' : percentage > 80 ? 'Dolu' : 'Normal'}
                </Badge>
                <div className="small text-muted">
                    Mesafe: {distance.toFixed(0)} cm
                </div>
            </div>
        </div>
    );
};

export default UltrasonicWidget;
