import React from 'react';

const UVIndexWidget = ({ data }) => {
    const uv = data?.value || 7;

    // Classification
    let status = 'Düşük';
    let color = 'green';

    if (uv >= 3 && uv < 6) { status = 'Orta'; color = '#ffc107'; } // yellow
    else if (uv >= 6 && uv < 8) { status = 'Yüksek'; color = '#fd7e14'; } // orange
    else if (uv >= 8 && uv < 11) { status = 'Çok Yüksek'; color = '#dc3545'; } // red
    else if (uv >= 11) { status = 'Aşırı'; color = '#6f42c1'; } // purple

    const max = 11;
    const percent = Math.min((uv / max) * 100, 100);

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            <div className="mb-2">
                <div className="display-4 fw-bold" style={{ color: color }}>{uv}</div>
                <div className="badge rounded-pill fw-normal px-3" style={{ backgroundColor: color }}>{status.toUpperCase()}</div>
            </div>

            <div className="mx-3 mt-3 position-relative">
                <div style={{ height: '6px', background: 'linear-gradient(90deg, green, yellow, orange, red, purple)', borderRadius: '3px' }}></div>
                <div style={{
                    position: 'absolute', top: '-5px', left: `${percent}%`,
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: '#fff', border: '3px solid #333',
                    transform: 'translateX(-50%)'
                }}></div>
                <div className="d-flex justify-content-between small text-muted mt-1" style={{ fontSize: '0.65rem' }}>
                    <span>0</span>
                    <span>5</span>
                    <span>10+</span>
                </div>
            </div>

            {uv >= 6 && (
                <div className="mt-3 small text-warning fw-bold">
                    <i className="bi bi-exclamation-triangle me-1"></i> Gölgeleme önerilir
                </div>
            )}
        </div>
    );
};

export default UVIndexWidget;
