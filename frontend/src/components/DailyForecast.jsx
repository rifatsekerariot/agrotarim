import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';

const DailyForecast = ({ data }) => {
    if (!data || data.length === 0) return null;

    const forecast = data[0]; // Assuming single station result

    // Helper to format date
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    // Helper to get icon (basic mapping)
    const getIcon = (hadise) => {
        // In a real app, map hadise codes (A, PB, Y, etc.) to icons
        // For now, using bootstrap icons as placeholders
        if (hadise?.includes('A')) return 'bi-sun';
        if (hadise?.includes('Y')) return 'bi-cloud-rain';
        if (hadise?.includes('B')) return 'bi-cloud';
        return 'bi-cloud-sun';
    };

    const days = [1, 2, 3, 4, 5].map(i => ({
        date: forecast[`tarihGun${i}`],
        hadise: forecast[`hadiseGun${i}`],
        min: forecast[`enDusukGun${i}`],
        max: forecast[`enYuksekGun${i}`],
        wind: forecast[`ruzgarHizGun${i}`]
    }));

    return (
        <Card className="mb-3 shadow-sm">
            <Card.Header className="bg-primary text-white">
                <i className="bi bi-calendar-range me-2"></i> 5 Günlük Tahmin
            </Card.Header>
            <Card.Body className="p-2">
                <div className="d-flex flex-wrap justify-content-around text-center">
                    {days.map((day, idx) => (
                        <div key={idx} className="forecast-day-card p-2 mb-2 border rounded shadow-sm bg-white" style={{ minWidth: '130px', flex: '1 1 auto', margin: '5px' }}>
                            <div className="fw-bold text-muted small">{formatDate(day.date)}</div>
                            <div className="fs-1 my-1 text-primary">
                                <i className={`bi ${getIcon(day.hadise)}`}></i>
                            </div>
                            <div className="fs-5 fw-bold mb-1">
                                <span className="text-danger">{day.max}°</span> <span className="text-muted">/</span> <span className="text-primary">{day.min}°</span>
                            </div>
                            <div className="small text-muted mb-1">
                                <i className="bi bi-wind me-1"></i>{day.wind} km/s
                            </div>
                            <div className="badge bg-light text-dark border text-wrap" style={{ maxWidth: '100px' }}>
                                {day.hadise}
                            </div>
                        </div>
                    ))}
                </div>
            </Card.Body>
        </Card>
    );
};

export default DailyForecast;
