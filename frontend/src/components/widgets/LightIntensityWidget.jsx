import React from 'react';
import { Badge } from 'react-bootstrap';

const LightIntensityWidget = ({ data, settings = {} }) => {
    const value = data?.value ?? null;
    const { sunlightThreshold = 10000, lowLightThreshold = 1000 } = settings;

    // No data state
    if (value === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>💡</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    let variant = 'info';
    let statusText = 'Normal';
    let icon = '☀️';

    if (value >= sunlightThreshold) {
        variant = 'warning';
        statusText = 'Parlak';
        icon = '🌞';
    } else if (value <= lowLightThreshold) {
        variant = 'secondary';
        statusText = 'Düşük Işık';
        icon = '🌙';
    }

    // Calculate percentage for visual
    const percentage = Math.min((value / sunlightThreshold) * 100, 100);

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            {/* Icon */}
            <div className="mb-2" style={{ fontSize: '2.5rem' }}>{icon}</div>

            {/* Main Value */}
            <div className="mb-2">
                <span className={`h3 fw-bold text-${variant}`}>
                    {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}
                </span>
                <span className="text-muted small ms-1">lux</span>
            </div>

            {/* Status Badge */}
            <Badge bg={variant} className="mx-auto mb-3">
                {statusText}
            </Badge>

            {/* Light Level Bar */}
            <div className="mt-auto px-2">
                <div className="position-relative bg-light" style={{ height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                    <div
                        className={`bg-${variant}`}
                        style={{
                            width: `${percentage}%`,
                            height: '100%',
                            transition: 'width 0.5s ease',
                            background: `linear-gradient(90deg, #6c757d 0%, #ffc107 50%, #fd7e14 100%)`
                        }}
                    ></div>
                </div>
                <div className="d-flex justify-content-between mt-1" style={{ fontSize: '0.65rem' }}>
                    <span className="text-muted">0</span>
                    <span className="text-muted">{(sunlightThreshold / 1000).toFixed(0)}k lux</span>
                </div>
            </div>
        </div>
    );
};

export default LightIntensityWidget;
