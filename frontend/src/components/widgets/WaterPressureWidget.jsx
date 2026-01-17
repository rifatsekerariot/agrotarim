import React from 'react';
import { ProgressBar } from 'react-bootstrap';

const WaterPressureWidget = ({ data }) => {
    // Mock Data
    const pressure = data?.value || 2.8; // bar
    const min = 0;
    const max = 6;
    const idealMin = 2;
    const idealMax = 4;

    // Determine status
    let status = 'Normal';
    let variant = 'success';
    if (pressure < idealMin) { status = 'Düşük'; variant = 'warning'; }
    else if (pressure > idealMax) { status = 'Yüksek'; variant = 'danger'; }

    const percentage = ((pressure - min) / (max - min)) * 100;

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center">
            <div className="text-center mb-3">
                <div className="display-6 fw-bold text-dark">{pressure} <span className="fs-5 text-muted">bar</span></div>
            </div>

            <div className="mb-2 position-relative">
                <ProgressBar now={percentage} variant={variant} style={{ height: '12px', borderRadius: '6px' }} />
                {/* Ideal Zone Markers (Visual Only) */}
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: `${((idealMin - min) / (max - min)) * 100}%`,
                    width: '2px',
                    height: '12px',
                    background: '#fff',
                    opacity: 0.5
                }} title="İdeal Alt Sınır"></div>
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: `${((idealMax - min) / (max - min)) * 100}%`,
                    width: '2px',
                    height: '12px',
                    background: '#fff',
                    opacity: 0.5
                }} title="İdeal Üst Sınır"></div>
            </div>

            <div className="d-flex justify-content-between align-items-center">
                <span className={`badge bg-${variant} rounded-pill`}>
                    <i className={`bi bi-${variant === 'success' ? 'check-circle' : 'exclamation-triangle'} me-1`}></i>
                    {status}
                </span>
                <small className="text-muted">{idealMin}-{idealMax} bar arası ideal</small>
            </div>
        </div>
    );
};

export default WaterPressureWidget;
