import React from 'react';
import { Badge } from 'react-bootstrap';

const WaterFlowWidget = ({ data, settings = {} }) => {
    const value = data?.value ?? null;
    const { maxFlowRate = 100, unit = 'L/dk' } = settings;

    // No data state
    if (value === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>💧</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    const percentage = Math.min((value / maxFlowRate) * 100, 100);
    const isFlowing = value > 0;

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            {/* Animated Water Icon */}
            <div className="mb-2 position-relative">
                <div style={{ fontSize: '2.5rem' }}>
                    {isFlowing ? '💧' : '🚫'}
                </div>
                {isFlowing && (
                    <div
                        className="position-absolute"
                        style={{
                            bottom: '-5px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            animation: 'pulse 1s infinite'
                        }}
                    >
                        <div className="bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                    </div>
                )}
            </div>

            {/* Flow Value */}
            <div className="mb-2">
                <span className={`display-6 fw-bold ${isFlowing ? 'text-primary' : 'text-muted'}`}>
                    {value.toFixed(1)}
                </span>
                <span className="text-muted small ms-1">{unit}</span>
            </div>

            {/* Status */}
            <Badge bg={isFlowing ? 'primary' : 'secondary'} className="mx-auto mb-3">
                {isFlowing ? 'Akış Var' : 'Akış Yok'}
            </Badge>

            {/* Flow Bar */}
            <div className="mt-auto px-2">
                <div className="bg-light rounded" style={{ height: '10px', overflow: 'hidden' }}>
                    <div
                        className="bg-primary h-100"
                        style={{
                            width: `${percentage}%`,
                            transition: 'width 0.3s ease'
                        }}
                    ></div>
                </div>
                <div className="text-muted small mt-1">Max: {maxFlowRate} {unit}</div>
            </div>
        </div>
    );
};

export default WaterFlowWidget;
