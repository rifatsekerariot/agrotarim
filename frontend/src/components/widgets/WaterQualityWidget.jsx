import React from 'react';
import { ProgressBar } from 'react-bootstrap';

const WaterQualityWidget = ({ data }) => {
    const ph = data?.ph || 6.5;
    const ec = data?.ec || 1.8; // mS/cm

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center">
            <div className="mb-3">
                <div className="d-flex justify-content-between mb-1 align-items-end">
                    <span className="fw-bold">pH Değeri</span>
                    <span>{ph} <i className="bi bi-check-circle-fill text-success small ms-1"></i></span>
                </div>
                <ProgressBar now={(ph / 14) * 100} variant="success" style={{ height: '8px' }} />
            </div>

            <div>
                <div className="d-flex justify-content-between mb-1 align-items-end">
                    <span className="fw-bold">EC Değeri</span>
                    <span>{ec} mS/cm <i className="bi bi-check-circle-fill text-success small ms-1"></i></span>
                </div>
                <ProgressBar now={(ec / 3) * 100} variant="info" style={{ height: '8px' }} />
            </div>

            <div className="mt-3 text-center">
                <small className="text-success fw-bold"><i className="bi bi-shield-check me-1"></i> Su kalitesi uygun</small>
            </div>
        </div>
    );
};

export default WaterQualityWidget;
