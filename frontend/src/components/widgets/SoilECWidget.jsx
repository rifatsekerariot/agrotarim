import React from 'react';
import { Badge } from 'react-bootstrap';

const SoilECWidget = ({ data, settings = {} }) => {
    const value = data?.value ?? null;
    const { optimalMin = 1.0, optimalMax = 2.5, unit = 'mS/cm' } = settings;

    // No data state
    if (value === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>⚡</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    let variant = 'success';
    let statusText = 'Optimal';

    if (value < optimalMin * 0.5) {
        variant = 'warning';
        statusText = 'Düşük';
    } else if (value < optimalMin) {
        variant = 'info';
        statusText = 'Normal Alt';
    } else if (value > optimalMax * 1.5) {
        variant = 'danger';
        statusText = 'Çok Yüksek';
    } else if (value > optimalMax) {
        variant = 'warning';
        statusText = 'Yüksek';
    }

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            {/* EC Value */}
            <div className="mb-2">
                <span className={`display-5 fw-bold text-${variant}`}>{value.toFixed(2)}</span>
                <span className="text-muted small ms-1">{unit}</span>
            </div>

            {/* Status */}
            <Badge bg={variant} className="mx-auto mb-3">
                {statusText}
            </Badge>

            {/* Info */}
            <div className="small text-muted mt-auto">
                Optimal: {optimalMin} - {optimalMax} {unit}
            </div>
        </div>
    );
};

export default SoilECWidget;
