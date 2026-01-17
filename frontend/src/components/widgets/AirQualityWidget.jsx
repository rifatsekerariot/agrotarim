import React from 'react';

const AirQualityWidget = ({ data }) => {
    const voc = data?.voc || 125; // ppb
    const pm25 = data?.pm25 || 12; // ug/m3

    let status = 'İYİ';
    let color = 'success';
    // Mock logic
    if (pm25 > 35) { status = 'ORTA'; color = 'warning'; }
    if (pm25 > 55) { status = 'KÖTÜ'; color = 'danger'; }

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            <div className="mb-3">
                <div className="text-muted fw-bold small">GENEL DURUM</div>
                <div className={`h2 fw-bold text-${color}`}>{status}</div>
                <div className={`bg-${color} rounded-circle mx-auto mt-2`} style={{ width: '20px', height: '20px', boxShadow: `0 0 10px var(--bs-${color})` }}></div>
            </div>

            <div className="d-flex justify-content-center gap-3 border-top pt-3">
                <div className="text-start">
                    <div className="small text-muted fw-bold">VOC</div>
                    <div className="h5 mb-0">{voc} <small className="text-muted fs-6">ppb</small></div>
                </div>
                <div className="vr"></div>
                <div className="text-start">
                    <div className="small text-muted fw-bold">PM2.5</div>
                    <div className="h5 mb-0">{pm25} <small className="text-muted fs-6">µg/m³</small></div>
                </div>
            </div>
        </div>
    );
};

export default AirQualityWidget;
