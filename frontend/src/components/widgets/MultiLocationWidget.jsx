import React from 'react';
import { Badge } from 'react-bootstrap';

const MultiLocationWidget = ({ data, settings = {} }) => {
    const { locationCount = 4 } = settings;

    // Get locations from data or create empty array
    const locations = data?.locations ?? [];

    // No data state
    if (locations.length === 0) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>📍</div>
                <p className="text-muted mb-0 small">Lokasyon Verisi Yok</p>
                <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>
                    Birden fazla sensör bağlayın
                </p>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column h-100 p-2">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold">📍 Lokasyonlar</span>
                <Badge bg="secondary">{locations.length}</Badge>
            </div>

            {/* Location List */}
            <div className="flex-grow-1 overflow-auto custom-scrollbar">
                {locations.slice(0, locationCount).map((loc, idx) => (
                    <div
                        key={idx}
                        className="d-flex justify-content-between align-items-center p-2 mb-1 bg-light rounded"
                    >
                        <div>
                            <div className="fw-medium small">{loc.name || `Lokasyon ${idx + 1}`}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                {loc.description || 'Açıklama yok'}
                            </div>
                        </div>
                        <div className="text-end">
                            {loc.temp !== undefined && (
                                <div className="small">
                                    <span className="text-primary fw-bold">{loc.temp.toFixed(1)}°C</span>
                                </div>
                            )}
                            {loc.humidity !== undefined && (
                                <div className="small text-muted">
                                    {loc.humidity.toFixed(0)}%
                                </div>
                            )}
                            {loc.status && (
                                <Badge
                                    bg={loc.status === 'ok' ? 'success' : loc.status === 'warning' ? 'warning' : 'danger'}
                                    style={{ fontSize: '0.6rem' }}
                                >
                                    {loc.status === 'ok' ? '✓' : loc.status === 'warning' ? '!' : '✗'}
                                </Badge>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MultiLocationWidget;
