import React from 'react';
import { ProgressBar } from 'react-bootstrap';

const CO2Widget = ({ data }) => {
    const ppm = data?.value || 420;

    // Scale: 400 (Base) -> 1000 (Limit) -> 2000 (High)
    // Percentage for 400-1200 range roughly
    const min = 400;
    const max = 1500;
    const percent = Math.min(Math.max(((ppm - min) / (max - min)) * 100, 0), 100);

    let status = 'İdeal';
    let variant = 'success';
    if (ppm > 1000) { status = 'Yüksek'; variant = 'warning'; }
    if (ppm > 2000) { status = 'Kritik'; variant = 'danger'; }

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center">
            <div className="text-center mb-3">
                <div className="h1 fw-bold mb-0">{ppm} <span className="fs-6 text-muted fw-normal">ppm</span></div>
            </div>

            <ProgressBar now={percent} variant={variant} style={{ height: '10px' }} className="mb-2" />

            <div className="d-flex justify-content-between small text-muted mb-2">
                <span>Düşük</span>
                <span>Yüksek</span>
            </div>

            <div className="text-center">
                <span className={`badge bg-${variant} rounded-pill`}>
                    <i className="bi bi-check2 me-1"></i>{status}
                </span>
                <div className="small text-muted mt-1">İdeal: 400-1000 ppm</div>
            </div>
        </div>
    );
};

export default CO2Widget;
