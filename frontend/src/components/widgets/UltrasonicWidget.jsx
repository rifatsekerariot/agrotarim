import React from 'react';

const UltrasonicWidget = ({ data }) => {
    // Distance in cm from sensor to liquid surface
    // Lower distance = Higher level
    const distance = data?.value || 40;
    const maxDistance = 100; // Tank height (Empty)
    const minDistance = 10;  // Sensor offset (Full)

    // Calculate fill percentage
    // If distance is max (100), fill is 0
    // If distance is min (10), fill is 100
    const rawPercent = ((maxDistance - distance) / (maxDistance - minDistance)) * 100;
    const percent = Math.min(Math.max(rawPercent, 0), 100);

    const capacity = 200; // Liters
    const currentLiters = Math.round((percent / 100) * capacity);

    return (
        <div className="d-flex flex-column h-100 p-2">
            <h6 className="text-muted small fw-bold mb-2">Gübre Tankı</h6>

            <div className="flex-grow-1 position-relative border border-2 border-secondary rounded overflow-hidden bg-light mx-auto mb-2" style={{ width: '60%', minHeight: '100px' }}>
                {/* Rulers */}
                <div className="position-absolute top-0 end-0 h-100 d-flex flex-column justify-content-between pe-1 text-muted" style={{ fontSize: '0.6rem' }}>
                    <span>Max</span>
                    <span>50%</span>
                    <span>Min</span>
                </div>

                {/* Liquid */}
                <div className="position-absolute bottom-0 start-0 w-100 bg-info bg-opacity-75"
                    style={{
                        height: `${percent}%`,
                        transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                    {/* Surface Effect */}
                    <div className="w-100 bg-info" style={{ height: '3px', opacity: 0.8 }}></div>
                </div>

                {/* Fill Text */}
                <div className="position-absolute top-50 start-50 translate-middle text-dark fw-bold" style={{ textShadow: '0 0 4px white' }}>
                    {Math.round(percent)}%
                </div>
            </div>

            <div className="text-center">
                <div className="fs-5 fw-bold">{currentLiters} L</div>
                <small className="text-muted d-block">Boşluk: {distance} cm</small>
                {percent < 20 && (
                    <div className="badge bg-warning text-dark mt-1 animate-pulse">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        Dolum Gerekli
                    </div>
                )}
            </div>
        </div>
    );
};

export default UltrasonicWidget;
