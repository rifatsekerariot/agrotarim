import React from 'react';

const FeelsLikeWidget = ({ data }) => {
    const real = data?.temp || 24.5;
    const feels = 28; // calculated or from data
    const diff = (feels - real).toFixed(1);

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            <div className="mb-2">
                <div className="small text-muted">Hissedilen</div>
                <div className="display-4 fw-bold text-dark">{feels}°</div>
            </div>

            <div className="mb-3">
                <span className="badge bg-light text-muted border">Gerçek: {real}°C</span>
            </div>

            <div className="alert alert-warning border-0 shadow-sm py-2 d-flex align-items-center justify-content-center gap-2 mb-0">
                <i className="bi bi-thermometer-sun fs-4 text-warning"></i>
                <div className="text-start lh-1">
                    <div className="fw-bold small">Nem etkisiyle</div>
                    <small className="text-muted">+{diff}°C daha sıcak</small>
                </div>
            </div>
        </div>
    );
};

export default FeelsLikeWidget;
