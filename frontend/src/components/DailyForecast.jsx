import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Calendar } from 'lucide-react';

const DailyForecast = ({ data }) => {
    if (!data || data.length === 0) return null;

    const forecast = data[0];

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Bugün';
        if (date.toDateString() === tomorrow.toDateString()) return 'Yarın';

        return date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' });
    };

    const getWeatherInfo = (hadise) => {
        const code = hadise?.toUpperCase() || '';
        if (code.includes('AB') || code.includes('A')) return { icon: Sun, text: 'Güneşli', color: 'text-warning', emoji: '☀️' };
        if (code.includes('Y') || code.includes('KY')) return { icon: CloudRain, text: 'Yağışlı', color: 'text-primary', emoji: '🌧️' };
        if (code.includes('KR') || code.includes('S')) return { icon: CloudSnow, text: 'Karlı', color: 'text-info', emoji: '❄️' };
        if (code.includes('PB') || code.includes('CB')) return { icon: Cloud, text: 'Bulutlu', color: 'text-secondary', emoji: '☁️' };
        return { icon: Cloud, text: 'Değişken', color: 'text-muted', emoji: '🌤️' };
    };

    const days = [1, 2, 3, 4, 5].map(i => ({
        date: forecast[`tarihGun${i}`],
        hadise: forecast[`hadiseGun${i}`],
        min: forecast[`enDusukGun${i}`],
        max: forecast[`enYuksekGun${i}`],
        wind: forecast[`ruzgarHizGun${i}`],
        humidity: forecast[`nemGun${i}`] // Assuming available or mock
    }));

    return (
        <div className="mb-4">
            <div className="d-flex align-items-center mb-4">
                <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                    <Calendar size={28} className="text-primary" />
                </div>
                <div>
                    <h4 className="fw-bold mb-0">5 Günlük Hava Tahmini</h4>
                    <span className="text-muted small">MGM Veritabanlı Resmi Tahminler</span>
                </div>
            </div>

            <Row className="g-3">
                {days.map((day, idx) => {
                    const weather = getWeatherInfo(day.hadise);
                    const WeatherIcon = weather.icon;
                    const isFrost = day.min <= 0;

                    return (
                        <Col key={idx} xs={6} md={4} lg={4} xl={20} className="flex-grow-1">
                            <Card className={`mgm-card h-100 border-0 ${isFrost ? 'border-primary border-bottom border-4' : ''}`}>
                                <Card.Body className="p-3 text-center d-flex flex-column align-items-center justify-content-center">
                                    <span className="badge bg-light text-dark mb-2 text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>
                                        {formatDate(day.date)}
                                    </span>

                                    <WeatherIcon size={48} className={`mb-3 ${weather.color}`} strokeWidth={1.5} />

                                    <div className="mb-2">
                                        <div className="forecast-temp-large text-dark">{day.max}°</div>
                                        <div className="forecast-temp-min">{day.min}°</div>
                                    </div>

                                    <span className="text-muted fw-medium small mb-3 d-block">{weather.text}</span>

                                    <div className="d-flex align-items-center text-muted small bg-light rounded-pill px-2 py-1">
                                        <Wind size={12} className="me-1" /> {day.wind} km/s
                                    </div>

                                    {isFrost && (
                                        <div className="mt-2 text-primary fw-bold small">
                                            ❄️ Don Riski
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        </div>
    );
};

export default DailyForecast;
