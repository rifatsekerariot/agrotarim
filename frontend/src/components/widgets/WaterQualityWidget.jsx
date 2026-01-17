import React from 'react';
import { Badge } from 'react-bootstrap';

const WaterQualityWidget = ({ data, settings = {} }) => {
    const value = data?.value ?? null;
    const { ppmMax = 500, goodMax = 150 } = settings;

    // No data state
    if (value === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>💧</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    let variant = 'success';
    let statusText = 'İyi';
    let icon = '✨';

    if (value > ppmMax) {
        variant = 'danger';
        statusText = 'Kötü';
        icon = '⚠️';
    } else if (value > goodMax) {
        variant = 'warning';
        statusText = 'Orta';
        icon = '~';
    }

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            {/* Icon */}
            <div className="mb-2" style={{ fontSize: '2rem' }}>{icon}</div>

            {/* TDS Value */}
            <div className="mb-2">
                <span className={`display-6 fw-bold text-${variant}`}>{value.toFixed(0)}</span>
                <span className="text-muted small ms-1">ppm</span>
            </div>

            {/* Status */}
            <Badge bg={variant} className="mx-auto">
                {statusText} Kalite
            </Badge>

            {/* Info */}
            <div className="small text-muted mt-auto">
                İyi: &lt;{goodMax} ppm
            </div>
        </div>
    );
};

export default WaterQualityWidget;
