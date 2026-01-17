import React from 'react';
import { Row, Col, Badge } from 'react-bootstrap';

const GreenhouseWidget = ({ data, settings = {} }) => {
    const { showTemp = true, showHumidity = true, showSoilMoisture = true, showLight = true } = settings;

    // Extract values from data or use null
    const temp = data?.temperature ?? data?.temp ?? null;
    const humidity = data?.humidity ?? data?.hum ?? null;
    const soilMoisture = data?.soilMoisture ?? data?.soil ?? null;
    const light = data?.light ?? data?.lux ?? null;

    // No data state
    const hasAnyData = temp !== null || humidity !== null || soilMoisture !== null || light !== null;

    if (!hasAnyData) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>🏡</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
                <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>
                    Birden fazla sensör bağlayın
                </p>
            </div>
        );
    }

    const getStatusBadge = (type, value) => {
        if (value === null) return { variant: 'secondary', text: 'Yok' };

        switch (type) {
            case 'temp':
                if (value < 15) return { variant: 'info', text: 'Soğuk' };
                if (value > 30) return { variant: 'danger', text: 'Sıcak' };
                return { variant: 'success', text: 'İdeal' };
            case 'humidity':
                if (value < 40) return { variant: 'warning', text: 'Düşük' };
                if (value > 80) return { variant: 'warning', text: 'Yüksek' };
                return { variant: 'success', text: 'İdeal' };
            case 'soil':
                if (value < 30) return { variant: 'danger', text: 'Kuru' };
                if (value > 80) return { variant: 'info', text: 'Islak' };
                return { variant: 'success', text: 'İdeal' };
            case 'light':
                if (value < 1000) return { variant: 'secondary', text: 'Düşük' };
                if (value > 50000) return { variant: 'warning', text: 'Yoğun' };
                return { variant: 'success', text: 'İyi' };
            default:
                return { variant: 'secondary', text: '-' };
        }
    };

    const MetricCard = ({ icon, label, value, unit, type }) => {
        const status = getStatusBadge(type, value);
        return (
            <div className="bg-light rounded p-2 text-center h-100">
                <div style={{ fontSize: '1.5rem' }}>{icon}</div>
                <div className="small text-muted">{label}</div>
                <div className="fw-bold">
                    {value !== null ? `${value.toFixed(0)}${unit}` : '-'}
                </div>
                <Badge bg={status.variant} className="mt-1" style={{ fontSize: '0.65rem' }}>
                    {status.text}
                </Badge>
            </div>
        );
    };

    return (
        <div className="d-flex flex-column h-100 p-2">
            {/* Title */}
            <div className="text-center mb-2">
                <span className="fw-bold">🏡 Sera Durumu</span>
            </div>

            {/* Metrics Grid */}
            <Row className="g-2 flex-grow-1">
                {showTemp && (
                    <Col xs={6}>
                        <MetricCard icon="🌡️" label="Sıcaklık" value={temp} unit="°C" type="temp" />
                    </Col>
                )}
                {showHumidity && (
                    <Col xs={6}>
                        <MetricCard icon="💧" label="Nem" value={humidity} unit="%" type="humidity" />
                    </Col>
                )}
                {showSoilMoisture && (
                    <Col xs={6}>
                        <MetricCard icon="🌱" label="Toprak" value={soilMoisture} unit="%" type="soil" />
                    </Col>
                )}
                {showLight && (
                    <Col xs={6}>
                        <MetricCard icon="☀️" label="Işık" value={light} unit=" lx" type="light" />
                    </Col>
                )}
            </Row>
        </div>
    );
};

export default GreenhouseWidget;
