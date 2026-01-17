import React from 'react';
import { Badge } from 'react-bootstrap';

const WaterLeakWidget = ({ data, settings = {} }) => {
    const detected = data?.value ?? null;
    const { criticalAlert = true } = settings;

    // No data state
    if (detected === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>💧</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    const hasLeak = detected === 1 || detected === true;

    return (
        <div className={`d-flex flex-column h-100 p-2 justify-content-center text-center ${hasLeak ? 'bg-danger bg-opacity-10' : ''}`}>
            {/* Leak Icon */}
            <div
                className="mb-3"
                style={{
                    fontSize: '3rem',
                    animation: hasLeak ? 'pulse 0.5s infinite' : 'none'
                }}
            >
                {hasLeak ? '🚿' : '✓'}
            </div>

            {/* Status */}
            <Badge
                bg={hasLeak ? 'danger' : 'success'}
                className="mx-auto px-4 py-2 fs-6"
            >
                {hasLeak ? 'SU SIZINTISI!' : 'NORMAL'}
            </Badge>

            {hasLeak && criticalAlert && (
                <div className="mt-3 text-danger small fw-bold">
                    ⚠️ Acil müdahale gerekli!
                </div>
            )}
        </div>
    );
};

export default WaterLeakWidget;
