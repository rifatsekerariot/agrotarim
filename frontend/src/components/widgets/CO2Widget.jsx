import React from 'react';
import { Badge } from 'react-bootstrap';

const CO2Widget = ({ data, settings = {} }) => {
    const value = data?.value ?? null;
    const { normalMax = 1000, warningMax = 2000, dangerMax = 5000 } = settings;

    // No data state
    if (value === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>🌬️</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    let variant = 'success';
    let statusText = 'Normal';
    let icon = '✓';

    if (value > dangerMax) {
        variant = 'danger';
        statusText = 'Tehlikeli';
        icon = '⚠';
    } else if (value > warningMax) {
        variant = 'warning';
        statusText = 'Yüksek';
        icon = '!';
    } else if (value > normalMax) {
        variant = 'info';
        statusText = 'Normal Üzeri';
        icon = '↑';
    }

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            {/* Main Value */}
            <div className="mb-2">
                <span className={`display-5 fw-bold text-${variant}`}>
                    {value.toFixed(0)}
                </span>
                <span className="text-muted fs-6 ms-1">ppm</span>
            </div>

            {/* Status Badge */}
            <Badge bg={variant} className="mx-auto mb-3 px-3 py-2">
                {icon} {statusText}
            </Badge>

            {/* Scale Indicator */}
            <div className="mt-auto px-2">
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.65rem' }}>
                    <span className="text-success">Normal</span>
                    <span className="text-warning">Yüksek</span>
                    <span className="text-danger">Tehlike</span>
                </div>
                <div className="position-relative" style={{ height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div className="d-flex h-100">
                        <div className="bg-success" style={{ width: `${(normalMax / dangerMax) * 100}%` }}></div>
                        <div className="bg-warning" style={{ width: `${((warningMax - normalMax) / dangerMax) * 100}%` }}></div>
                        <div className="bg-danger" style={{ width: `${((dangerMax - warningMax) / dangerMax) * 100}%` }}></div>
                    </div>
                    {/* Indicator */}
                    <div
                        className="position-absolute bg-dark"
                        style={{
                            left: `${Math.min((value / dangerMax) * 100, 100)}%`,
                            top: 0,
                            width: '3px',
                            height: '100%',
                            transform: 'translateX(-50%)'
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default CO2Widget;
