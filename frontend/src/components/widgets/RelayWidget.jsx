import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';

const RelayWidget = ({ data }) => {
    const [isOn, setIsOn] = useState(false);
    const [isAuto, setIsAuto] = useState(true);

    const hasData = data && data.value != null;

    React.useEffect(() => {
        if (hasData) {
            setIsOn(data.value === 1);
        }
    }, [data]);

    const toggle = () => {
        // Placeholder for API call to toggle relay
        setIsOn(!isOn);
    };
    const toggleAuto = () => setIsAuto(!isAuto);

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
            <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="badge bg-light text-dark border">
                    {isAuto ? <><i className="bi bi-robot me-1 text-primary"></i> Otomatik</> : <><i className="bi bi-hand-index-thumb me-1 text-warning"></i> Manuel</>}
                </span>
                <Form.Check
                    type="switch"
                    id="auto-switch"
                    checked={isAuto}
                    onChange={toggleAuto}
                    title="Otomatik Mod"
                />
            </div>

            <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
                <div className="position-relative cursor-pointer" onClick={toggle} style={{ cursor: 'pointer' }}>
                    {/* Cable visual */}
                    <div className="position-absolute top-50 start-0 translate-middle-y bg-secondary" style={{ width: '30px', height: '4px', left: '-30px' }}></div>
                    <div className="position-absolute top-50 end-0 translate-middle-y bg-secondary" style={{ width: '30px', height: '4px', right: '-30px' }}></div>

                    {/* Switch Body */}
                    <div className={`rounded-pill p-1 d-flex align-items-center transition-all shadow-sm ${isOn ? 'bg-success' : 'bg-secondary'}`}
                        style={{ width: '80px', height: '40px', transition: '0.3s' }}>
                        <div className={`bg-white rounded-circle shadow-sm`}
                            style={{ width: '32px', height: '32px', transform: isOn ? 'translateX(40px)' : 'translateX(0)', transition: '0.3s' }}></div>
                    </div>
                </div>
                <div className="mt-3 fw-bold fs-5">
                    {isOn ? <span className="text-success">AÇIK</span> : <span className="text-muted">KAPALI</span>}
                </div>
            </div>

            <div className="mt-auto pt-3 border-top d-flex justify-content-between text-muted small">
                <span>Son güncelleme: <strong>{data.ts ? new Date(data.ts).toLocaleTimeString() : '-'}</strong></span>
            </div>
        </div>
    );
};

export default RelayWidget;
