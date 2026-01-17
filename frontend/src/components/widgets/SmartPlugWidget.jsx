import React, { useState } from 'react';
import { Button } from 'react-bootstrap';

const SmartPlugWidget = ({ data }) => {
    const [isOn, setIsOn] = useState(data?.isOn || true);
    // Mock Data
    const power = 1.2; // kW
    const daily = 8.5; // kWh
    const cost = 12; // TL

    return (
        <div className="d-flex flex-column h-100 p-2">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className={`badge ${isOn ? 'bg-success' : 'bg-secondary'} rounded-pill px-3 py-2`}>
                    <i className={`bi bi-circle-fill me-2 small`}></i>
                    {isOn ? 'Çalışıyor' : 'Kapalı'}
                </div>
                <i className="bi bi-outlet fs-4 text-secondary"></i>
            </div>

            <div className="row g-2 mb-3">
                <div className="col-6">
                    <div className="small text-muted">Anlık</div>
                    <div className="fw-bold fs-5">{power} kW</div>
                </div>
                <div className="col-6">
                    <div className="small text-muted">Bugün</div>
                    <div className="fw-bold fs-5">{daily} kWh</div>
                </div>
            </div>

            <div className="alert alert-light border shadow-sm py-1 px-2 mb-3 text-center">
                <small className="text-muted fw-bold">Tahmini Maliyet: <span className="text-dark">{cost} TL</span></small>
            </div>

            <div className="mt-auto d-flex gap-2">
                <Button
                    variant={isOn ? 'outline-danger' : 'outline-success'}
                    size="sm"
                    className="flex-grow-1"
                    onClick={() => setIsOn(!isOn)}
                >
                    {isOn ? 'Kapat' : 'Aç'}
                </Button>
                <Button variant="outline-primary" size="sm"><i className="bi bi-stopwatch"></i></Button>
            </div>
        </div>
    );
};

export default SmartPlugWidget;
