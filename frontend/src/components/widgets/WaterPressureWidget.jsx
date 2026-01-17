import React from 'react';
import { ProgressBar } from 'react-bootstrap';

const WaterPressureWidget = ({ data, settings = {} }) => {
    const pressure = data?.value ?? null;
    const { normalMin = 2.0, normalMax = 4.0, unit = 'bar' } = settings;

    // Scale for visual bar
    const min = 0;
    const max = settings.maxPressure || 6;

    // No Data State
    if (pressure === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>⏲️</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    // Determine status
    let status = 'Normal';
    let variant = 'success';
    if (pressure < normalMin) { status = 'Düşük'; variant = 'warning'; }
    else if (pressure > normalMax) { status = 'Yüksek'; variant = 'danger'; }

    const percentage = Math.min(Math.max(((pressure - min) / (max - min)) * 100, 0), 100);

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center">
            <div className="text-center mb-3">
                <div className="display-6 fw-bold text-dark">{pressure.toFixed(1)} <span className="fs-5 text-muted">{unit}</span></div>
            </div>

            <div className="mb-2 position-relative">
                <ProgressBar now={percentage} variant={variant} style={{ height: '12px', borderRadius: '6px' }} />
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: `${((normalMin - min) / (max - min)) * 100}%`,
                    width: '2px',
                    height: '12px',
                    background: '#fff',
                    opacity: 0.5
                }} title="Normal Alt Sınır"></div>
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: `${((normalMax - min) / (max - min)) * 100}%`,
                    width: '2px',
                    height: '12px',
                    background: '#fff',
                    opacity: 0.5
                }} title="Normal Üst Sınır"></div>
            </div>

            <div className="d-flex justify-content-between align-items-center">
                <span className={`badge bg-${variant} rounded-pill`}>
                    <i className={`bi bi-${variant === 'success' ? 'check-circle' : 'exclamation-triangle'} me-1`}></i>
                    {status}
                </span>
                <small className="text-muted">{normalMin}-{normalMax} {unit} ideal</small>
            </div>
        </div>
    );
};

export default WaterPressureWidget;
