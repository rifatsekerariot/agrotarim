import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner } from 'react-bootstrap';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye } from 'lucide-react';

const WeatherWidget = ({ farmId = 1 }) => {
    const [currentWeather, setCurrentWeather] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchWeather();
        const interval = setInterval(fetchWeather, 30 * 60 * 1000); // 30 min
        return () => clearInterval(interval);
    }, [farmId]);

    const fetchWeather = async () => {
        try {
            setLoading(true);
            const [currentRes, forecastRes] = await Promise.all([
                fetch(`/api/weather/current/${farmId}`),
                fetch(`/api/weather/forecast/${farmId}`)
            ]);

            if (currentRes.ok) {
                const current = await currentRes.json();
                setCurrentWeather(current);
            }

            if (forecastRes.ok) {
                const forecast = await forecastRes.json();
                setForecast(forecast.slice(0, 7));
            }

            setError(null);
        } catch (err) {
            console.error('Weather fetch error:', err);
            setError('Hava durumu yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const getWeatherIcon = (iconCode) => {
        if (!iconCode) return <Cloud size={64} className="text-muted" />;

        if (iconCode.startsWith('01')) return <Sun size={64} className="text-warning" />;
        if (iconCode.startsWith('02')) return <Cloud size={64} className="text-info" />;
        if (iconCode.startsWith('03') || iconCode.startsWith('04'))
            return <Cloud size={64} className="text-secondary" />;
        if (iconCode.startsWith('09') || iconCode.startsWith('10'))
            return <CloudRain size={64} className="text-primary" />;
        if (iconCode.startsWith('11')) return <CloudRain size={64} className="text-danger" />;

        return <Cloud size={64} className="text-muted" />;
    };

    const getSmallWeatherIcon = (iconCode) => {
        if (!iconCode) return <Cloud size={20} className="text-muted" />;

        if (iconCode.startsWith('01')) return <Sun size={20} className="text-warning" />;
        if (iconCode.startsWith('02')) return <Cloud size={20} className="text-info" />;
        if (iconCode.startsWith('09') || iconCode.startsWith('10'))
            return <CloudRain size={20} className="text-primary" />;

        return <Cloud size={20} className="text-secondary" />;
    };

    if (loading && !currentWeather) {
        return (
            <div className="h-100 d-flex align-items-center justify-content-center">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-100 d-flex align-items-center justify-content-center">
                <p className="text-muted">{error}</p>
            </div>
        );
    }

    return (
        <div className="weather-widget h-100 d-flex flex-column" style={{ overflow: 'hidden' }}>
            {/* Current Weather */}
            {currentWeather && (
                <div className="current-weather p-3 text-center" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: '8px 8px 0 0'
                }}>
                    <div className="mb-2">
                        {getWeatherIcon(currentWeather.icon)}
                    </div>
                    <h1 className="display-3 fw-bold mb-0">{Math.round(currentWeather.temperature)}°</h1>
                    <p className="mb-1 opacity-75">Hissedilen: {Math.round(currentWeather.feelsLike)}°C</p>
                    <p className="mb-2 text-capitalize fw-bold">{currentWeather.description}</p>

                    {/* Compact Details */}
                    <Row className="g-2 small mt-3">
                        <Col xs={6} className="d-flex align-items-center justify-content-center gap-1">
                            <Droplets size={14} />
                            <span>{currentWeather.humidity}%</span>
                        </Col>
                        <Col xs={6} className="d-flex align-items-center justify-content-center gap-1">
                            <Wind size={14} />
                            <span>{Math.round(currentWeather.windSpeed * 3.6)} km/h</span>
                        </Col>
                    </Row>
                </div>
            )}

            {/* 7-Day Forecast - Compact */}
            <div className="forecast-list p-2 flex-grow-1" style={{ overflowY: 'auto', fontSize: '0.75rem' }}>
                <h6 className="text-muted mb-2 px-1" style={{ fontSize: '0.7rem', fontWeight: 600 }}>7 GÜNLÜK TAHMİN</h6>
                {forecast.map((day, index) => {
                    const date = new Date(day.date);
                    const dayName = index === 0 ? 'Bugün' : date.toLocaleDateString('tr-TR', { weekday: 'short' });

                    return (
                        <div key={day.date} className="forecast-day p-2 mb-1 bg-light rounded d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2 flex-shrink-0" style={{ minWidth: '60px' }}>
                                <div>
                                    <div className="fw-bold">{dayName}</div>
                                    <div className="text-muted" style={{ fontSize: '0.65rem' }}>{date.getDate()}/{date.getMonth() + 1}</div>
                                </div>
                            </div>

                            <div className="flex-shrink-0">
                                {getSmallWeatherIcon(day.icon)}
                            </div>

                            <div className="d-flex align-items-center gap-1 flex-shrink-0">
                                <span className="text-danger fw-bold">{Math.round(day.maxTemperature)}°</span>
                                <span className="text-muted">/</span>
                                <span className="text-primary">{Math.round(day.minTemperature)}°</span>
                            </div>

                            {day.precipitation > 0 && (
                                <div className="d-flex align-items-center gap-1 flex-shrink-0">
                                    <CloudRain size={12} className="text-primary" />
                                    <span className="text-primary">{day.precipitation}mm</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WeatherWidget;


const WeatherWidget = ({ farmId = 1 }) => {
    const [currentWeather, setCurrentWeather] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchWeather();
        const interval = setInterval(fetchWeather, 30 * 60 * 1000); // 30 min
        return () => clearInterval(interval);
    }, [farmId]);

    const fetchWeather = async () => {
        try {
            setLoading(true);
            const [currentRes, forecastRes] = await Promise.all([
                fetch(`/api/weather/current/${farmId}`),
                fetch(`/api/weather/forecast/${farmId}`)
            ]);

            if (currentRes.ok) {
                const current = await currentRes.json();
                setCurrentWeather(current);
            }

            if (forecastRes.ok) {
                const forecast = await forecastRes.json();
                setForecast(forecast.slice(0, 7)); // 7 days
            }

            setError(null);
        } catch (err) {
            console.error('Weather fetch error:', err);
            setError('Hava durumu yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const getWeatherIcon = (iconCode) => {
        // OpenWeather icon codes
        if (!iconCode) return <Cloud size={48} className="text-muted" />;

        if (iconCode.startsWith('01')) return <Sun size={48} className="text-warning" />;
        if (iconCode.startsWith('02')) return <Cloud size={48} className="text-info" />;
        if (iconCode.startsWith('03') || iconCode.startsWith('04'))
            return <Cloud size={48} className="text-secondary" />;
        if (iconCode.startsWith('09') || iconCode.startsWith('10'))
            return <CloudRain size={48} className="text-primary" />;
        if (iconCode.startsWith('11')) return <CloudRain size={48} className="text-danger" />;

        return <Cloud size={48} className="text-muted" />;
    };

    const getSmallWeatherIcon = (iconCode) => {
        if (!iconCode) return <Cloud size={24} className="text-muted" />;

        if (iconCode.startsWith('01')) return <Sun size={24} className="text-warning" />;
        if (iconCode.startsWith('02')) return <Cloud size={24} className="text-info" />;
        if (iconCode.startsWith('09') || iconCode.startsWith('10'))
            return <CloudRain size={24} className="text-primary" />;

        return <Cloud size={24} className="text-secondary" />;
    };

    if (loading && !currentWeather) {
        return (
            <div className="h-100 d-flex align-items-center justify-content-center">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-100 d-flex align-items-center justify-content-center">
                <p className="text-muted">{error}</p>
            </div>
        );
    }

    return (
        <div className="weather-widget h-100 p-3" style={{ overflow: 'auto' }}>
            {/* Current Weather */}
            {currentWeather && (
                <Card className="border-0 shadow-sm mb-3 bg-gradient" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}>
                    <Card.Body className="text-white">
                        <Row className="align-items-center">
                            <Col xs={4} className="text-center">
                                {getWeatherIcon(currentWeather.icon)}
                            </Col>
                            <Col xs={8}>
                                <h2 className="mb-0 fw-bold">{Math.round(currentWeather.temperature)}°C</h2>
                                <p className="mb-1 opacity-75">Hissedilen: {Math.round(currentWeather.feelsLike)}°C</p>
                                <p className="mb-0 text-capitalize small">{currentWeather.description}</p>
                            </Col>
                        </Row>

                        {/* Details */}
                        <Row className="mt-3 g-2">
                            <Col xs={6} className="d-flex align-items-center">
                                <Droplets size={16} className="me-2" />
                                <small>Nem: {currentWeather.humidity}%</small>
                            </Col>
                            <Col xs={6} className="d-flex align-items-center">
                                <Wind size={16} className="me-2" />
                                <small>Rüzgar: {Math.round(currentWeather.windSpeed * 3.6)} km/h</small>
                            </Col>
                            <Col xs={6} className="d-flex align-items-center">
                                <Eye size={16} className="me-2" />
                                <small>Bulut: %{currentWeather.cloudCover}</small>
                            </Col>
                            <Col xs={6} className="d-flex align-items-center">
                                <i className="bi bi-speedometer2 me-2"></i>
                                <small>{currentWeather.pressure} hPa</small>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* 7-Day Forecast */}
            <div className="forecast-list">
                <h6 className="text-muted mb-3">7 Günlük Tahmin</h6>
                {forecast.map((day, index) => {
                    const date = new Date(day.date);
                    const dayName = index === 0 ? 'Bugün' : date.toLocaleDateString('tr-TR', { weekday: 'short' });

                    return (
                        <Card key={day.date} className="border-0 shadow-sm mb-2" style={{ fontSize: '0.85rem' }}>
                            <Card.Body className="py-2 px-3">
                                <Row className="align-items-center">
                                    <Col xs={3}>
                                        <strong>{dayName}</strong>
                                        <div className="text-muted small">{date.getDate()}/{date.getMonth() + 1}</div>
                                    </Col>
                                    <Col xs={2} className="text-center">
                                        {getSmallWeatherIcon(day.icon)}
                                    </Col>
                                    <Col xs={4}>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="text-danger fw-bold">{Math.round(day.maxTemperature)}°</span>
                                            <span className="text-muted">/</span>
                                            <span className="text-primary">{Math.round(day.minTemperature)}°</span>
                                        </div>
                                    </Col>
                                    <Col xs={3} className="text-end">
                                        {day.precipitation > 0 && (
                                            <div className="d-flex align-items-center justify-content-end gap-1">
                                                <CloudRain size={14} className="text-primary" />
                                                <small>{day.precipitation}mm</small>
                                            </div>
                                        )}
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    );
                })}
            </div>

            <style jsx>{`
                .weather-widget {
                    font-family: 'Inter', system-ui, sans-serif;
                }
            `}</style>
        </div>
    );
};

export default WeatherWidget;
