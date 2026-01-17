import React from 'react';
import { Card } from 'react-bootstrap';

const WaterTankWidget = ({ data, settings = {} }) => {
    // Use settings or fallback to data or defaults
    const capacity = settings.capacity || data?.capacity || 4000;
    const consumptionRate = settings.consumptionRate || 150;
    const level = data?.value || 65; // percentage
    const currentLiters = (capacity * level) / 100;
    const daysLeft = (currentLiters / consumptionRate).toFixed(1);

    return (
        <div className="d-flex flex-column h-100 p-2">
            <div className="flex-grow-1 d-flex align-items-center justify-content-center mb-2">
                {/* Tank Container */}
                <div style={{
                    width: '80px',
                    height: '100px',
                    border: '3px solid #e0e0e0',
                    borderRadius: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                    background: '#f8f9fa'
                }}>
                    {/* Water Level */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: `${level}%`,
                        background: 'linear-gradient(to top, #2196f3, #4fc3f7)',
                        transition: 'height 1s ease-in-out',
                        opacity: 0.8
                    }}>
                        {/* Wave Animation (Simple CSS Mock) */}
                        <div style={{
                            position: 'absolute',
                            top: '-5px',
                            left: 0,
                            width: '200%',
                            height: '10px',
                            background: 'rgba(255,255,255,0.3)',
                            borderRadius: '50%',
                            transform: 'translateX(-25%)'
                        }}></div>
                    </div>

                    {/* Percentage Text Overlay */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontWeight: 'bold',
                        color: level > 50 ? '#fff' : '#333',
                        zIndex: 2,
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                        {level}%
                    </div>
                </div>
            </div>

            <div className="text-center">
                <div className="h4 mb-0 fw-bold">{currentLiters.toLocaleString()} <span className="fs-6 text-muted fw-normal">/ {capacity.toLocaleString()} L</span></div>
                <div className="text-muted small mt-1">
                    <i className="bi bi-clock-history me-1"></i> ~{daysLeft} gün yeter
                </div>
            </div>
        </div>
    );
};

export default WaterTankWidget;
