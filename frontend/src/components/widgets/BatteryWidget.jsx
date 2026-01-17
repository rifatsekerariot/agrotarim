import React from 'react';
import { Badge } from 'react-bootstrap';

const BatteryWidget = ({ data, settings = {} }) => {
    const level = data?.value ?? null;
    const { capacity = 5000, lowThreshold = 20, criticalThreshold = 10 } = settings;

    // No data state
    if (level === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2">
                    <i className="bi bi-battery fs-1 opacity-50"></i>
                </div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    let variant = 'success';
    let statusText = 'Normal';
    if (level <= criticalThreshold) {
        variant = 'danger';
        statusText = 'Kritik';
    } else if (level <= lowThreshold) {
        variant = 'warning';
        statusText = 'Düşük';
    }

    const colorMap = { success: '#198754', warning: '#ffc107', danger: '#dc3545' };

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            {/* Battery Icon Visual */}
            <div className="d-flex justify-content-center mb-3">
                <div className="position-relative" style={{
                    width: '60px',
                    height: '100px',
                    border: '4px solid #333',
                    borderRadius: '8px',
                    padding: '4px'
                }}>
                    {/* Cap */}
                    <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '15px',
                        right: '15px',
                        height: '6px',
                        background: '#333',
                        borderTopLeftRadius: '3px',
                        borderTopRightRadius: '3px'
                    }}></div>

                    {/* Fill */}
                    <div style={{
                        width: 'calc(100% - 8px)',
                        height: `${level}%`,
                        background: colorMap[variant],
                        position: 'absolute',
                        bottom: '4px',
                        left: '4px',
                        borderRadius: '2px',
                        transition: 'height 0.5s ease'
                    }}></div>

                    <div className="position-absolute top-50 start-50 translate-middle fw-bold text-white fs-5"
                        style={{ textShadow: '0 0 2px black' }}>
                        {level.toFixed(0)}%
                    </div>
                </div>
            </div>

            {/* Status */}
            <Badge bg={variant} className="mx-auto mb-2">
                {statusText}
            </Badge>

            {/* Info */}
            <div className="small text-muted">
                Kapasite: <span className="fw-bold text-dark">{capacity} mAh</span>
            </div>
        </div>
    );
};

export default BatteryWidget;
