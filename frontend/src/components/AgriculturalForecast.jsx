import React from 'react';
import { Card, ProgressBar } from 'react-bootstrap';
import { Thermometer, Droplets, Sun, Sprout, ArrowRight } from 'lucide-react';

const AgriculturalForecast = ({ data }) => {
    if (!data) return null;

    const formatValue = (val, decimals = null) => {
        if (val === undefined || val === null || val === -9999 || val === "-9999") return "-";
        if (decimals !== null && typeof val === 'number') return val.toFixed(decimals);
        return val;
    };

    // Calculate percentages for visual bars (mock max values)
    // Rainfall max 50mm, GDD max 200, Chill max 500h (just for visual balance)
    const rainPct = Math.min((data.ToplamYagis / 50) * 100, 100) || 0;
    const gddPct = Math.min((data.ToplamSicaklik / 200) * 100, 100) || 0;
    const chillPct = Math.min((data.ToplamSoguklama / 500) * 100, 100) || 0;

    return (
        <Card className="mgm-card mb-4">
            <Card.Body className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <h5 className="fw-bold mb-0 text-dark">
                        <Sprout className="text-success me-2" size={24} />
                        Tarımsal Veriler
                    </h5>
                    <small className="text-muted">Son 24 Saat</small>
                </div>

                <div className="agri-item">
                    <div className="agri-icon-box bg-danger bg-opacity-10 text-danger">
                        <Thermometer />
                    </div>
                    <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-end mb-1">
                            <span className="agri-label">Etkili Sıcaklık</span>
                            <span className="agri-value">{formatValue(data.dunEtkiliSicak, 1)}°C</span>
                        </div>
                        <ProgressBar now={(data.dunEtkiliSicak / 40) * 100} variant="danger" style={{ height: '6px' }} />
                        <small className="text-muted mt-1 d-block">Dün Toprak Üstü Min: <strong>{formatValue(data.dunToprakUstuMin, 1)}°C</strong></small>
                    </div>
                </div>

                <div className="agri-item">
                    <div className="agri-icon-box bg-primary bg-opacity-10 text-primary">
                        <Droplets />
                    </div>
                    <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-end mb-1">
                            <span className="agri-label">Toplam Yağış</span>
                            <span className="agri-value">{formatValue(data.ToplamYagis, 1)} mm</span>
                        </div>
                        <ProgressBar now={rainPct} variant="primary" style={{ height: '6px' }} />
                    </div>
                </div>

                <div className="agri-item">
                    <div className="agri-icon-box bg-warning bg-opacity-10 text-warning">
                        <Sun />
                    </div>
                    <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-end mb-1">
                            <span className="agri-label">Sıcaklık Toplamı (GDD)</span>
                            <span className="agri-value">{formatValue(data.ToplamSicaklik, 0)}</span>
                        </div>
                        <ProgressBar now={gddPct} variant="warning" style={{ height: '6px' }} />
                    </div>
                </div>

                <div className="mt-3 text-center">
                    <button className="btn btn-link text-decoration-none text-muted small fw-bold">
                        Detaylı Raporu Gör <ArrowRight size={14} className="ms-1" />
                    </button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default AgriculturalForecast;
