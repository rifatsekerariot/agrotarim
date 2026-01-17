import React from 'react';
import { Badge } from 'react-bootstrap';

const FeelsLikeWidget = ({ data, settings = {} }) => {
    const rawTemp = data?.temperature ?? data?.value ?? null;
    const temp = rawTemp !== null ? Number(rawTemp) : null;
    const humidity = data?.humidity != null ? Number(data.humidity) : null;

    // No data state
    if (temp === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>🌡️</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    // Simple heat index calculation
    let feelsLike = temp;
    if (humidity !== null && temp >= 20) {
        // Simplified heat index formula
        feelsLike = temp + 0.33 * humidity * 0.1 - 4;
    }

    let comfort = 'Konforlu';
    let icon = '😊';
    let variant = 'success';

    if (feelsLike < 10) {
        comfort = 'Soğuk';
        icon = '🥶';
        variant = 'primary';
    } else if (feelsLike < 18) {
        comfort = 'Serin';
        icon = '😌';
        variant = 'info';
    } else if (feelsLike > 35) {
        comfort = 'Çok Sıcak';
        icon = '🥵';
        variant = 'danger';
    } else if (feelsLike > 28) {
        comfort = 'Sıcak';
        icon = '😓';
        variant = 'warning';
    }

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            {/* Icon */}
            <div className="mb-2" style={{ fontSize: '2.5rem' }}>{icon}</div>

            {/* Feels Like */}
            <div className="mb-1">
                <span className={`display-6 fw-bold text-${variant}`}>{feelsLike.toFixed(0)}°</span>
            </div>

            <Badge bg={variant} className="mx-auto mb-2">
                {comfort}
            </Badge>

            {/* Actual values */}
            <div className="small text-muted mt-auto">
                <div>Gerçek: {temp.toFixed(1)}°C</div>
                {humidity !== null && <div>Nem: {humidity.toFixed(0)}%</div>}
            </div>
        </div>
    );
};

export default FeelsLikeWidget;
