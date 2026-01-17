import React from 'react';
import { Button } from 'react-bootstrap';

const MultiLocationWidget = ({ data }) => {
    // Mock List
    const locations = [
        { id: 1, name: 'Sera 1 (Domates)', temp: 24, status: 'normal' },
        { id: 2, name: 'Sera 2 (Biber)', temp: 32, status: 'high' },
        { id: 3, name: 'Sera 3 (Fide)', temp: 22, status: 'normal' },
        { id: 4, name: 'Depo Alanı', temp: 18, status: 'low' },
    ];

    return (
        <div className="d-flex flex-column h-100">
            <div className="px-3 py-2 border-bottom bg-light">
                <h6 className="mb-0 fw-bold">📍 Tüm Lokasyonlar</h6>
            </div>

            <div className="flex-grow-1 overflow-auto">
                {locations.map(loc => (
                    <div key={loc.id} className="d-flex justify-content-between align-items-center p-3 border-bottom hover-bg-light">
                        <div>
                            <div className="fw-bold text-dark">{loc.name}</div>
                            <small className="text-muted">Son veri: 2 dk önce</small>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                            <span className="fs-5 fw-bold">{loc.temp}°C</span>
                            {loc.status === 'normal' && <i className="bi bi-circle-fill text-success"></i>}
                            {loc.status === 'high' && <i className="bi bi-circle-fill text-danger animate-pulse"></i>}
                            {loc.status === 'low' && <i className="bi bi-circle-fill text-warning"></i>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-auto p-2">
                <Button variant="outline-primary" size="sm" className="w-100">Detaylı Görünüm</Button>
            </div>
        </div>
    );
};

export default MultiLocationWidget;
