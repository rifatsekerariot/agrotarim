import React from 'react';

const UVIndexWidget = ({ data, settings = {} }) => {
    const uv = data?.value ?? null;
    const { lowThreshold = 3, moderateThreshold = 6, highThreshold = 8 } = settings;

    // No Data State
    if (uv === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>☀️</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    // Classification
    let status = 'Düşük';
    let color = '#198754'; // green

    if (uv >= lowThreshold && uv < moderateThreshold) { status = 'Orta'; color = '#ffc107'; }
    else if (uv >= moderateThreshold && uv < highThreshold) { status = 'Yüksek'; color = '#fd7e14'; }
    else if (uv >= highThreshold && uv < 11) { status = 'Çok Yüksek'; color = '#dc3545'; }
    else if (uv >= 11) { status = 'Aşırı'; color = '#6f42c1'; }

    const max = 11;
    const percent = Math.min((uv / max) * 100, 100);

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            <div className="mb-2">
                <div className="display-4 fw-bold" style={{ color: color }}>{uv.toFixed(1)}</div>
                <div className="badge rounded-pill fw-normal px-3" style={{ backgroundColor: color }}>{status.toUpperCase()}</div>
                <div className="text-muted small mt-1">UV İndeksi</div>
            </div>

            <div className="mx-3 mt-3 position-relative">
                <div style={{
                    height: '6px',
                    background: 'linear-gradient(90deg, #198754, #ffc107, #fd7e14, #dc3545, #6f42c1)',
                    borderRadius: '3px'
                }}></div>
                <div style={{
                    position: 'absolute', top: '-5px', left: `${percent}%`,
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: '#fff', border: '3px solid #333',
                    transform: 'translateX(-50%)',
                    transition: 'left 0.5s ease'
                }}></div>
                <div className="d-flex justify-content-between small text-muted mt-1" style={{ fontSize: '0.65rem' }}>
                    <span>0</span>
                    <span>5</span>
                    <span>10+</span>
                </div>
            </div>

            {uv >= moderateThreshold && (
                <div className="mt-3 small text-warning fw-bold">
                    <i className="bi bi-exclamation-triangle me-1"></i> Gölgeleme önerilir
                </div>
            )}
        </div>
    );
};

export default UVIndexWidget;
