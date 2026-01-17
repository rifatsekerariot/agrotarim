import React, { useState } from 'react';
import { Form } from 'react-bootstrap';

const PWMWidget = ({ data }) => {
    const [speed, setSpeed] = useState(0);
    const hasData = data && data.value != null;

    React.useEffect(() => {
        if (hasData) {
            setSpeed(Number(data.value));
        }
    }, [data]);

    // Mock calculations based on speed
    const rpm = Math.round(speed * 28); // max 2800
    const power = Math.round(speed * 0.7); // max 70W

    if (!hasData) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-muted">
                <div className="spinner-border spinner-border-sm text-secondary mb-2" role="status"></div>
                <small>Veri Bekleniyor...</small>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column h-100 p-2">
            <div className="d-flex justify-content-between align-items-end mb-2">
                <span className="display-4 fw-bold lh-1 text-primary">{speed}<span className="fs-4">%</span></span>
                <i className={`bi bi-fan fs-1 text-secondary ${speed > 0 ? 'animate-spin' : ''}`} style={{ animationDuration: `${10000 / (speed || 1)}ms` }}></i>
            </div>

            <div className="mb-4">
                <Form.Range
                    value={speed}
                    onChange={e => setSpeed(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="custom-range"
                />
                <div className="d-flex justify-content-between small text-muted mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                </div>
            </div>

            <div className="row g-2 mt-auto small">
                <div className="col-6">
                    <div className="bg-light rounded p-2 text-center">
                        <div className="text-muted mb-1">Hız (RPM)</div>
                        <div className="fw-bold">{rpm}</div>
                    </div>
                </div>
                <div className="col-6">
                    <div className="bg-light rounded p-2 text-center">
                        <div className="text-muted mb-1">Güç</div>
                        <div className="fw-bold">{power} W</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PWMWidget;
