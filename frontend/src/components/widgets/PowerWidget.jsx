import React from 'react';
import { Badge } from 'react-bootstrap';

const PowerWidget = ({ data, settings = {} }) => {
    const power = data?.value ?? null;
    const { maxPower = 10000, costPerKwh = 2.5 } = settings;

    // No data state
    if (power === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>⚡</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    const percentage = Math.min((power / maxPower) * 100, 100);
    const isHigh = percentage > 80;

    // Calculate cost
    const hourlyCost = (power * costPerKwh / 1000);
    const dailyCost = hourlyCost * 24;

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            {/* Power Value */}
            <div className="mb-2">
                <span className={`display-5 fw-bold ${isHigh ? 'text-danger' : 'text-primary'}`}>
                    {power >= 1000 ? `${(power / 1000).toFixed(2)} kW` : `${power.toFixed(0)} W`}
                </span>
            </div>

            {/* Status */}
            <Badge bg={isHigh ? 'danger' : 'primary'} className="mx-auto mb-3">
                {isHigh ? 'Yüksek Tüketim' : 'Normal'}
            </Badge>

            {/* Usage Bar */}
            <div className="px-2 mb-2">
                <div className="bg-light rounded" style={{ height: '10px', overflow: 'hidden' }}>
                    <div
                        className={`h-100 ${isHigh ? 'bg-danger' : 'bg-primary'}`}
                        style={{ width: `${percentage}%`, transition: 'width 0.3s ease' }}
                    ></div>
                </div>
            </div>

            {/* Cost */}
            <div className="small text-muted mt-auto">
                <div>Saatlik: {hourlyCost.toFixed(2)} TL</div>
                <div>Günlük: {dailyCost.toFixed(2)} TL</div>
            </div>
        </div>
    );
};

export default PowerWidget;
