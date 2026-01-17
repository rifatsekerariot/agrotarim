import React from 'react';
import { ProgressBar, Badge } from 'react-bootstrap';

const SoilMoistureWidget = ({ data, settings = {} }) => {
    // Get value from real sensor data
    const value = data?.value ?? null;
    const { criticalLow = 30, optimalMin = 50, optimalMax = 70, criticalHigh = 90 } = settings;

    const getStatus = (val) => {
        if (val === null) return { variant: 'secondary', label: 'Veri Yok' };
        if (val < criticalLow) return { variant: 'danger', label: 'Kritik Düşük' };
        if (val < optimalMin) return { variant: 'warning', label: 'Düşük' };
        if (val <= optimalMax) return { variant: 'success', label: 'Optimal' };
        if (val <= criticalHigh) return { variant: 'warning', label: 'Yüksek' };
        return { variant: 'danger', label: 'Kritik Yüksek' };
    };

    const status = getStatus(value);

    // No data state
    if (value === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2">
                    <i className="bi bi-moisture fs-1 opacity-50"></i>
                </div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
                <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>
                    Widget ayarlarından sensör seçin
                </p>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column h-100 p-2">
            {/* Main Value Display */}
            <div className="text-center mb-3">
                <div className="display-4 fw-bold" style={{ color: `var(--bs-${status.variant})` }}>
                    {value.toFixed(0)}%
                </div>
                <Badge bg={status.variant} className="mt-1">
                    {status.label}
                </Badge>
            </div>

            {/* Progress Bar Visualization */}
            <div className="flex-grow-1 d-flex flex-column justify-content-center">
                <ProgressBar style={{ height: '20px', borderRadius: '10px' }}>
                    <ProgressBar
                        variant="danger"
                        now={criticalLow}
                        key={1}
                        style={{ opacity: value < criticalLow ? 1 : 0.3 }}
                    />
                    <ProgressBar
                        variant="warning"
                        now={optimalMin - criticalLow}
                        key={2}
                        style={{ opacity: value >= criticalLow && value < optimalMin ? 1 : 0.3 }}
                    />
                    <ProgressBar
                        variant="success"
                        now={optimalMax - optimalMin}
                        key={3}
                        style={{ opacity: value >= optimalMin && value <= optimalMax ? 1 : 0.3 }}
                    />
                    <ProgressBar
                        variant="warning"
                        now={criticalHigh - optimalMax}
                        key={4}
                        style={{ opacity: value > optimalMax && value <= criticalHigh ? 1 : 0.3 }}
                    />
                    <ProgressBar
                        variant="danger"
                        now={100 - criticalHigh}
                        key={5}
                        style={{ opacity: value > criticalHigh ? 1 : 0.3 }}
                    />
                </ProgressBar>

                {/* Value Indicator */}
                <div className="position-relative mt-1" style={{ height: '10px' }}>
                    <div
                        className="position-absolute"
                        style={{
                            left: `${Math.min(Math.max(value, 0), 100)}%`,
                            transform: 'translateX(-50%)',
                            fontSize: '0.7rem'
                        }}
                    >
                        ▼
                    </div>
                </div>
            </div>

            {/* Range Info */}
            <div className="mt-2 pt-2 border-top d-flex justify-content-between small text-muted">
                <span>Optimal: {optimalMin}-{optimalMax}%</span>
                <span className="fw-bold">{data?.unit || '%'}</span>
            </div>
        </div>
    );
};

export default SoilMoistureWidget;
