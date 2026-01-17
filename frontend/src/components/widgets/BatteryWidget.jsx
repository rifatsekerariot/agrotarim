import React from 'react';
import { ProgressBar } from 'react-bootstrap';

const BatteryWidget = ({ data }) => {
    const level = data?.value || 85;
    const daysLeft = 45;

    let variant = 'success';
    if (level < 20) variant = 'danger';
    else if (level < 50) variant = 'warning';

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            {/* Battery Icon Visual */}
            <div className="d-flex justify-content-center mb-3">
                <div className="position-relative" style={{ width: '60px', height: '100px', border: '4px solid #333', borderRadius: '8px', padding: '4px' }}>
                    {/* Cap */}
                    <div style={{ position: 'absolute', top: '-10px', left: '15px', right: '15px', height: '6px', background: '#333', borderTopLeftRadius: '3px', borderTopRightRadius: '3px' }}></div>

                    {/* Fill */}
                    <div style={{
                        width: '100%',
                        height: `${level}%`,
                        background: variant === 'success' ? '#198754' : variant === 'warning' ? '#ffc107' : '#dc3545',
                        position: 'absolute',
                        bottom: '4px',
                        left: '4px',
                        right: '4px',
                        borderRadius: '2px',
                        transition: 'height 0.5s ease'
                    }}></div>

                    <div className="position-absolute top-50 start-50 translate-middle fw-bold text-white fs-5" style={{ textShadow: '0 0 2px black' }}>
                        {level}%
                    </div>
                </div>
            </div>

            <div className="small text-muted">
                Tahmini Ömür: <span className="fw-bold text-dark">~{daysLeft} gün</span>
            </div>
            <div className="small text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                Son Şarj: 2 gün önce
            </div>
        </div>
    );
};

export default BatteryWidget;
