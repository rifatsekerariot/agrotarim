import React from 'react';

const DistanceWidget = ({ data }) => {
    const distance = data?.value || 85; // cm
    const threshold = 50; // cm

    // Logic: If distance > threshold, Door is OPEN (sensor measures distance to door frame or opposite wall when open? 
    // Usually dist sensors on door frame: Dist small = Closed, Dist large = Open. 
    // Let's assume: Sensor on frame facing moving part. 
    // Closed = ~5cm. Open = >50cm (no reflection or far wall).
    // Let's assume standard door sensor usage:
    // Distance small (<10cm) -> Closed
    // Distance large (>10cm) -> Open

    const isOpen = distance > 20;

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            <div className="mb-3">
                <div className={`p-3 rounded-circle d-inline-block ${isOpen ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`}>
                    <i className={`bi ${isOpen ? 'bi-door-open-fill' : 'bi-door-closed-fill'} display-4`}></i>
                </div>
            </div>

            <div className="mb-3">
                <h4 className={isOpen ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                    {isOpen ? 'AÇIK' : 'KAPALI'}
                </h4>
                <div className="text-muted small">
                    Mesafe: <span className="fw-bold text-dark">{distance} cm</span>
                </div>
            </div>

            <div className="alert alert-light border shadow-sm py-1 px-2 m-0 d-flex align-items-center justify-content-center gap-2">
                <i className="bi bi-clock-history text-muted"></i>
                <small className="text-muted">Son hareket: <strong>2 dk önce</strong></small>
            </div>
        </div>
    );
};

export default DistanceWidget;
