import React, { useState } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';

const ServoWidget = ({ data }) => {
    const [position, setPosition] = useState(data?.value || 45); // 0-100% open

    return (
        <div className="d-flex flex-column h-100 p-2">
            <div className="text-center mb-3">
                <h2 className="mb-0 fw-bold">{position}%</h2>
                <small className="text-muted">Açıklık</small>
            </div>

            {/* Window Visual */}
            <div className="flex-grow-1 mx-auto bg-light border border-2 border-secondary rounded position-relative mb-3 overflow-hidden"
                style={{ width: '100px', height: '80px', perspective: '200px' }}>

                {/* Window Frame */}
                <div className="w-100 h-100 position-absolute border border-secondary" style={{ opacity: 0.2 }}></div>

                {/* Moving Pane - Rotates based on percentage */}
                <div className="bg-info bg-opacity-25 border border-info w-100 h-100 shadow-sm"
                    style={{
                        transformOrigin: 'bottom center',
                        transform: `rotateX(${-position}deg)`,
                        transition: 'transform 0.5s ease',
                        backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.5) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.5) 75%, transparent 75%, transparent)',
                        backgroundSize: '10px 10px'
                    }}>
                </div>
            </div>

            <div className="mt-auto">
                <ButtonGroup className="w-100 shadow-sm">
                    <Button variant="outline-primary" size="sm" onClick={() => setPosition(100)}>Aç</Button>
                    <Button variant="outline-success" size="sm" onClick={() => setPosition(45)}>Auto</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => setPosition(0)}>Kapat</Button>
                </ButtonGroup>
            </div>
        </div>
    );
};

export default ServoWidget;
