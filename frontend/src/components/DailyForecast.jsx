import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { Cloud, CloudRain, Sun, CloudSnow, Wind } from 'lucide-react';

const DailyForecast = ({ data }) => {
    if (!data || data.length === 0) return null;

    const forecast = data[0];

    // Format date in farmer-friendly way
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Bugün';
        if (date.toDateString() === tomorrow.toDateString()) return 'Yarın';

        return date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    // Translate technical weather codes to simple Turkish
    const getWeatherInfo = (hadise) => {
        const code = hadise?.toUpperCase() || '';

        if (code.includes('AB') || code.includes('A')) {
            return { icon: Sun, text: 'Güneşli', color: 'text-warning', emoji: '☀️' };
        } else if (code.includes('Y') || code.includes('KY')) {
            return { icon: CloudRain, text: 'Yağışlı', color: 'text-primary', emoji: '🌧️' };
        } else if (code.includes('KR') || code.includes('S')) {
            return { icon: CloudSnow, text: 'Karlı', color: 'text-info', emoji: '❄️' };
        } else if (code.includes('PB') || code.includes('CB')) {
            return { icon: Cloud, text: 'Bulutlu', color: 'text-secondary', emoji: '☁️' };
        }
        return { icon: Cloud, text: 'Değişken', color: 'text-muted', emoji: '🌤️' };
    };

    const days = [1, 2, 3, 4, 5].map(i => ({
        date: forecast[`tarihGun${i}`],
        hadise: forecast[`hadiseGun${i}`],
        min: forecast[`enDusukGun${i}`],
        max: forecast[`enYuksekGun${i}`],
        wind: forecast[`ruzgarHizGun${i}`]
    }));

    return (
        <Card className="mb-3 shadow-sm border-0">
            <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-4">
                    <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                        <span className="fs-2">📅</span>
                    </div>
                    <div>
                        <h5 className="fw-bold mb-0">5 Günlük Hava Durumu</h5>
                        <small className="text-muted">Meteoroloji tahminleri</small>
                    </div>
                </div>

                <Row className="g-3">
                    {days.map((day, idx) => {
                        const weather = getWeatherInfo(day.hadise);
                        const WeatherIcon = weather.icon;
                        const isFrost = day.min <= 0;
                        const isHot = day.max >= 35;

                        return (
                            <Col key={idx} xs={12} sm={6} lg className="mb-2">
                                <Card className={`h-100 border-0 shadow-sm ${isFrost ? 'border-start border-primary border-4' : ''} ${isHot ? 'border-start border-danger border-4' : ''}`}>
                                    <Card.Body className="p-3 text-center">
                                        <div className="fw-bold text-dark mb-2">{formatDate(day.date)}</div>

                                        {/* Weather Icon */}
                                        <div className="my-3">
                                            <WeatherIcon size={48} className={weather.color} />
                                        </div>

                                        {/* Weather Description */}
                                        <Badge bg="light" text="dark" className="mb-3 border px-3 py-2">
                                            {weather.emoji} {weather.text}
                                        </Badge>

                                        {/* Temperature */}
                                        <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
                                            <span className="fs-4 fw-bold text-danger">{day.max}°</span>
                                            <span className="text-muted">/</span>
                                            <span className={`fs-5 fw-bold ${isFrost ? 'text-primary' : 'text-info'}`}>{day.min}°</span>
                                        </div>

                                        {/* Frost Warning */}
                                        {isFrost && (
                                            <div className="alert alert-info py-1 px-2 mb-2 small">
                                                ❄️ <strong>Don Riski!</strong>
                                            </div>
                                        )}

                                        {/* Heat Warning */}
                                        {isHot && (
                                            <div className="alert alert-warning py-1 px-2 mb-2 small">
                                                🔥 <strong>Çok Sıcak!</strong>
                                            </div>
                                        )}

                                        {/* Wind */}
                                        <div className="small text-muted d-flex align-items-center justify-content-center gap-1">
                                            <Wind size={14} /> Rüzgar: {day.wind} km/s
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>

                {/* Farmer-Friendly Summary */}
                <div className="mt-4 p-3 bg-light rounded">
                    <strong className="text-dark">💡 Özet:</strong>
                    <span className="ms-2 text-muted">
                        {days.some(d => d.min <= 0) && "Don riski var, koruyucu önlem alın. "}
                        {days.some(d => d.max >= 35) && "Sıcak günler bekleniyor, sulama yapın. "}
                        {days.filter(d => getWeatherInfo(d.hadise).text === 'Yağışlı').length >= 2 && "Yağış olacak, sulamayı erteleyin. "}
                        {!days.some(d => d.min <= 0) && !days.some(d => d.max >= 35) && "Hava durumu normal, rutin işlemlere devam edin."}
                    </span>
                </div>
            </Card.Body>
        </Card>
    );
};

export default DailyForecast;
