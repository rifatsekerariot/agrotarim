import React from 'react';
import { Badge } from 'react-bootstrap';

const DistanceWidget = ({ data, settings = {} }) => {
    const value = data?.value ?? null;
    const { maxDistance = 400, unit = 'cm', warningThreshold = 50 } = settings;

    // No data state
    if (value === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>📏</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    const percentage = Math.min((value / maxDistance) * 100, 100);
    const isClose = value <= warningThreshold;

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            {/* Distance Value */}
            <div className="mb-2">
                <span className={`display-5 fw-bold ${isClose ? 'text-warning' : 'text-primary'}`}>
                    {value.toFixed(1)}
                </span>
                <span className="text-muted small ms-1">{unit}</span>
            </div>

            {/* Status */}
            <Badge bg={isClose ? 'warning' : 'primary'} className="mx-auto mb-3">
                {isClose ? 'Yakın' : 'Normal'}
            </Badge>

            {/* Distance Bar */}
            <div className="mt-auto px-2">
                <div className="bg-light rounded" style={{ height: '12px', overflow: 'hidden' }}>
                    <div
                        className={`h-100 ${isClose ? 'bg-warning' : 'bg-primary'}`}
                        style={{
                            width: `${percentage}%`,
                            transition: 'width 0.3s ease'
                        }}
                    ></div>
                </div>
                <div className="d-flex justify-content-between mt-1 small text-muted">
                    <span>0</span>
                    <span>{maxDistance} {unit}</span>
                </div>
            </div>
        </div>
    );
};

export default DistanceWidget;
