import React from 'react';
import { Badge } from 'react-bootstrap';

const MotionWidget = ({ data, settings = {} }) => {
    const detected = data?.value ?? null;
    const lastMotion = data?.lastMotion ?? null;
    const { cooldownSeconds = 30 } = settings;

    // No data state
    if (detected === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>👁️</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    const isActive = detected === 1 || detected === true;

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            {/* Motion Icon with Animation */}
            <div
                className="mb-3"
                style={{
                    fontSize: '3rem',
                    animation: isActive ? 'pulse 1s infinite' : 'none'
                }}
            >
                {isActive ? '🚨' : '✓'}
            </div>

            {/* Status */}
            <Badge
                bg={isActive ? 'danger' : 'success'}
                className="mx-auto px-4 py-2 fs-6"
            >
                {isActive ? 'HAREKET ALGILANDI' : 'GÜVENLİ'}
            </Badge>

            {/* Last Motion Time */}
            {lastMotion && (
                <div className="small text-muted mt-3">
                    Son hareket: {new Date(lastMotion).toLocaleTimeString('tr-TR')}
                </div>
            )}
        </div>
    );
};

export default MotionWidget;
