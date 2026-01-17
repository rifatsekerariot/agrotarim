import React from 'react';
import { ProgressBar } from 'react-bootstrap';

const SoilECWidget = ({ data }) => {
    const ec = data?.value || 1.2; // mS/cm
    // Assume 0-2 range for visual
    const percent = (ec / 2.5) * 100;

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center">
            <div className="text-center mb-3">
                <div className="h1 fw-bold text-dark mb-0">{ec}</div>
                <div className="text-muted small">mS/cm</div>
            </div>

            <ProgressBar now={percent} variant="info" className="mb-2" style={{ height: '10px' }} />

            <div className="alert alert-light border-0 shadow-sm d-flex align-items-center p-2 mb-0">
                <i className="bi bi-lightning-charge-fill text-warning me-2 fs-5"></i>
                <div>
                    <div className="fw-bold small">Besin Seviyesi</div>
                    <div className="text-success small">Normal</div>
                </div>
            </div>
        </div>
    );
};

export default SoilECWidget;
