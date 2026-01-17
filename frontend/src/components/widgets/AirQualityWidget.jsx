import React from 'react';
import { Badge } from 'react-bootstrap';

const AirQualityWidget = ({ data, settings = {} }) => {
    const value = data?.value ?? null;
    const { goodMax = 50, moderateMax = 100, unhealthyMax = 150 } = settings;

    // No data state
    if (value === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>🌫️</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    let variant = 'success';
    let statusText = 'İyi';
    let icon = '😊';

    if (value > unhealthyMax) {
        variant = 'danger';
        statusText = 'Sağlıksız';
        icon = '😷';
    } else if (value > moderateMax) {
        variant = 'warning';
        statusText = 'Hassas';
        icon = '😐';
    } else if (value > goodMax) {
        variant = 'info';
        statusText = 'Orta';
        icon = '🙂';
    }

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            {/* Icon */}
            <div className="mb-2" style={{ fontSize: '2.5rem' }}>{icon}</div>

            {/* AQI Value */}
            <div className="mb-1">
                <span className={`display-6 fw-bold text-${variant}`}>{value.toFixed(0)}</span>
                <span className="text-muted small ms-1">AQI</span>
            </div>

            {/* Status Badge */}
            <Badge bg={variant} className="mx-auto">
                {statusText}
            </Badge>

            {/* Scale */}
            <div className="mt-auto px-1">
                <div className="d-flex" style={{ height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div className="bg-success" style={{ flex: goodMax }}></div>
                    <div className="bg-info" style={{ flex: moderateMax - goodMax }}></div>
                    <div className="bg-warning" style={{ flex: unhealthyMax - moderateMax }}></div>
                    <div className="bg-danger" style={{ flex: 100 }}></div>
                </div>
            </div>
        </div>
    );
};

export default AirQualityWidget;
