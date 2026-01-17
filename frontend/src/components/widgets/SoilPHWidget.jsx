import React from 'react';
import { Badge } from 'react-bootstrap';

const SoilPHWidget = ({ data, settings = {} }) => {
    const value = data?.value ?? null;
    const { optimalMin = 6.0, optimalMax = 7.5 } = settings;

    // No data state
    if (value === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>🧪</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    let variant = 'success';
    let statusText = 'Optimal';

    if (value < 4.5) {
        variant = 'danger';
        statusText = 'Çok Asidik';
    } else if (value < optimalMin) {
        variant = 'warning';
        statusText = 'Asidik';
    } else if (value > 9.5) {
        variant = 'danger';
        statusText = 'Çok Bazik';
    } else if (value > optimalMax) {
        variant = 'warning';
        statusText = 'Bazik';
    }

    // Calculate position on pH scale (0-14)
    const position = (value / 14) * 100;

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            {/* pH Value */}
            <div className="mb-2">
                <span className={`display-5 fw-bold text-${variant}`}>{value.toFixed(1)}</span>
                <span className="text-muted small ms-1">pH</span>
            </div>

            {/* Status */}
            <Badge bg={variant} className="mx-auto mb-3">
                {statusText}
            </Badge>

            {/* pH Scale */}
            <div className="mt-auto px-1">
                <div
                    className="position-relative"
                    style={{
                        height: '16px',
                        borderRadius: '8px',
                        background: 'linear-gradient(90deg, #dc3545 0%, #fd7e14 15%, #ffc107 30%, #28a745 50%, #17a2b8 70%, #6f42c1 85%, #dc3545 100%)'
                    }}
                >
                    {/* Optimal Range Indicator */}
                    <div
                        className="position-absolute border border-2 border-dark"
                        style={{
                            left: `${(optimalMin / 14) * 100}%`,
                            width: `${((optimalMax - optimalMin) / 14) * 100}%`,
                            top: '-2px',
                            bottom: '-2px',
                            borderRadius: '4px'
                        }}
                    ></div>

                    {/* Current Value Indicator */}
                    <div
                        className="position-absolute bg-dark"
                        style={{
                            left: `${position}%`,
                            transform: 'translateX(-50%)',
                            top: '-8px',
                            width: '3px',
                            height: 'calc(100% + 16px)',
                            borderRadius: '2px'
                        }}
                    ></div>
                </div>
                <div className="d-flex justify-content-between mt-1 small text-muted">
                    <span>0 (Asit)</span>
                    <span>7</span>
                    <span>14 (Baz)</span>
                </div>
            </div>
        </div>
    );
};

export default SoilPHWidget;
