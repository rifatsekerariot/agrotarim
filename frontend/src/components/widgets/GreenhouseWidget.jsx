import React from 'react';

const GreenhouseWidget = ({ data }) => {
    // Mock Data if not provided
    const temp = data?.temp || 24.5;
    const hum = data?.hum || 65;
    const light = data?.light || 32000;
    const co2 = data?.co2 || 420;

    return (
        <div className="d-flex flex-column h-100">
            {/* Header */}
            <div className="px-3 py-2 bg-light border-bottom d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold"><i className="bi bi-flower1 me-2 text-success"></i> Sera 1 - Genel</h6>
                <span className="badge bg-success rounded-pill px-2">NORMAL</span>
            </div>

            {/* 2x2 Key Metrics */}
            <div className="flex-grow-1 p-2">
                <div className="row g-2 h-100">
                    <div className="col-6">
                        <div className="h-100 bg-orange-soft rounded p-2 d-flex flex-column justify-content-center text-center">
                            <div className="text-muted small">Sıcaklık</div>
                            <div className="fw-bold fs-4 text-orange">{temp}°C</div>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="h-100 bg-blue-soft rounded p-2 d-flex flex-column justify-content-center text-center">
                            <div className="text-muted small">Nem</div>
                            <div className="fw-bold fs-4 text-primary">{hum}%</div>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="h-100 bg-yellow-soft rounded p-2 d-flex flex-column justify-content-center text-center">
                            <div className="text-muted small">Işık</div>
                            <div className="fw-bold fs-5 text-warning">{light / 1000}k lx</div>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="h-100 bg-gray-soft rounded p-2 d-flex flex-column justify-content-center text-center">
                            <div className="text-muted small">CO2</div>
                            <div className="fw-bold fs-5 text-secondary">{co2}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Stats */}
            <div className="px-3 py-2 bg-white small border-top">
                <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Su Tankı:</span>
                    <span className="fw-bold">2,600 L</span>
                </div>
                <div className="d-flex justify-content-between">
                    <span className="text-muted">Toprak Nemi:</span>
                    <span className="fw-bold text-success">70%</span>
                </div>
            </div>
        </div>
    );
};

export default GreenhouseWidget;
