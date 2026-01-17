import React from 'react';
import { Badge } from 'react-bootstrap';

const WaterTempWidget = ({ data, settings = {} }) => {
    const value = data?.value ?? null;
    const { idealMin = 18, idealMax = 24 } = settings;

    // No data state
    if (value === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>🌡️</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    let variant = 'success';
    let statusText = 'İdeal';
    let icon = '✓';

    if (value < idealMin - 5) {
        variant = 'primary';
        statusText = 'Çok Soğuk';
        icon = '❄️';
    } else if (value < idealMin) {
        variant = 'info';
        statusText = 'Soğuk';
        icon = '🌊';
    } else if (value > idealMax + 5) {
        variant = 'danger';
        statusText = 'Çok Sıcak';
        icon = '🔥';
    } else if (value > idealMax) {
        variant = 'warning';
        statusText = 'Sıcak';
        icon = '☀️';
    }

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            {/* Icon */}
            <div className="mb-2" style={{ fontSize: '2rem' }}>{icon}</div>

            {/* Temperature Value */}
            <div className="mb-2">
                <span className={`display-5 fw-bold text-${variant}`}>{value.toFixed(1)}</span>
                <span className="text-muted small ms-1">°C</span>
            </div>

            {/* Status */}
            <Badge bg={variant} className="mx-auto mb-3">
                {statusText}
            </Badge>

            {/* Ideal Range */}
            <div className="small text-muted mt-auto">
                İdeal: {idealMin}°C - {idealMax}°C
            </div>
        </div>
    );
};

export default WaterTempWidget;
