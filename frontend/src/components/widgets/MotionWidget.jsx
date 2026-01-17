import React from 'react';
import { Button } from 'react-bootstrap';

const MotionWidget = ({ data }) => {
    // 0 = No Motion, 1 = Motion Detected
    const isMotion = data?.value === 1 || true; // Mock true for demo
    const lastTime = "14:32:15";

    return (
        <div className={`d-flex flex-column h-100 p-2 ${isMotion ? 'bg-danger bg-opacity-10' : ''}`}>
            <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="text-muted small fw-bold">Hareket Algılama</div>
                <i className="bi bi-eye fs-5 text-secondary"></i>
            </div>

            <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-center">
                {isMotion ? (
                    <div className="animate-pulse text-danger">
                        <i className="bi bi-person-walking display-1"></i>
                        <div className="fw-bold mt-2">HAREKET!</div>
                    </div>
                ) : (
                    <div className="text-success opacity-50">
                        <i className="bi bi-shield-check display-1"></i>
                        <div className="fw-bold mt-2">GÜVENLİ</div>
                    </div>
                )}
            </div>

            <div className="mt-3 bg-white bg-opacity-50 rounded p-2 border border-light">
                <div className="d-flex justify-content-between split-text small text-muted mb-1">
                    <span>Konum:</span>
                    <span className="fw-bold text-dark">Sera Girişi</span>
                </div>
                <div className="d-flex justify-content-between split-text small text-muted">
                    <span>Zaman:</span>
                    <span className="fw-bold text-dark">{lastTime}</span>
                </div>
            </div>

            <Button variant="outline-danger" size="sm" className="mt-2 w-100">
                <i className="bi bi-camera-video me-1"></i> Kamerayı Aç
            </Button>
        </div>
    );
};

export default MotionWidget;
