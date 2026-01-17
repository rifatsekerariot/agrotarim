import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import { RefreshCcw, Wifi, WifiOff, MapPin, Thermometer, Droplets } from 'lucide-react';
import IoTMap from './IoTMap'; // Import Map Component

const IoTDashboard = ({ farmId }) => {
    const [devices, setDevices] = useState([]);
    const [advice, setAdvice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Live Sensors
            const telRes = await fetch(`/api/telemetry/farm/${farmId}`);
            if (!telRes.ok) throw new Error("Sensör verisi alınamadı");
            const deviceData = await telRes.json();
            setDevices(deviceData);

            // 2. Fetch Expert Advice
            const expRes = await fetch(`/api/expert/${farmId}`);
            if (expRes.ok) {
                setAdvice(await expRes.json());
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [farmId]);

    if (loading && devices.length === 0) return <div className="text-center p-5"><Spinner animation="border" /></div>;

    const getSensorValue = (device, code) => {
        const sensor = device.sensors.find(s => s.code === code);
        const val = sensor?.telemetry?.[0]?.value;
        return val !== undefined ? val : "--";
    };

    return (
        <div className="iot-dashboard p-3">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0 text-success"><i className="bi bi-cpu"></i> Akıllı Tarla Takip</h2>
                <div>
                    <div className="btn-group me-2" role="group">
                        <button type="button" className={`btn btn-sm ${viewMode === 'grid' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setViewMode('grid')}>
                            <i className="bi bi-grid"></i> Liste
                        </button>
                        <button type="button" className={`btn btn-sm ${viewMode === 'map' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setViewMode('map')}>
                            <MapPin size={16} /> Harita
                        </button>
                    </div>
                    <button className="btn btn-outline-secondary btn-sm" onClick={fetchData}>
                        <RefreshCcw size={16} /> Yenile
                    </button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* EXPERT ADVICE SECTION */}
            {advice && advice.alerts && (advice.alerts.length > 0 || (advice.actions && advice.actions.length > 0)) && (
                <Card className="mb-4 border-0 shadow-sm" style={{ borderLeft: "5px solid #ffc107" }}>
                    <Card.Body>
                        <h5 className="text-dark fw-bold">🤖 AgroZeka Asistanı: {advice.crop}</h5>
                        <p className="text-muted small mb-2">{advice.summary}</p>
                        <hr />
                        {advice.alerts.map((alert, idx) => (
                            <Alert key={idx} variant={alert.level === 'critical' ? 'danger' : alert.level} className="mb-2 py-2">
                                <strong>DİKKAT:</strong> {alert.msg}
                            </Alert>
                        ))}
                        {advice.actions && advice.actions.map((act, idx) => (
                            <div key={idx} className="text-success fw-bold"><i className="bi bi-check-circle"></i> {act}</div>
                        ))}
                    </Card.Body>
                </Card>
            )}

            {/* MAIN STATUS CONTENT */}
            {devices.length === 0 ? (
                <div className="text-center p-5 text-muted">
                    <WifiOff size={48} className="mb-3" />
                    <h4>Henüz Sensör Verisi Yok</h4>
                    <p>Sensörlerden veri bekleniyor veya simülatör çalışmıyor.</p>
                </div>
            ) : (
                <>
                    {viewMode === 'map' ? (
                        <IoTMap devices={devices} />
                    ) : (
                        <Row>
                            {devices.map(device => (
                                <Col key={device.id} md={6} lg={4} className="mb-4">
                                    <Card
                                        className="h-100 shadow-sm border-0 cursor-pointer"
                                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                        onClick={() => window.location.href = `/device/${device.serialNumber}`} // Simple nav for now, preferably use useNavigate if extracted
                                    >
                                        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                                            <span className="fw-bold text-dark"><MapPin size={16} /> {device.name}</span>
                                            <Badge bg={device.status === 'online' ? 'success' : 'secondary'}>
                                                {device.status === 'online' ? <Wifi size={12} /> : <WifiOff size={12} />} {device.status}
                                            </Badge>
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="d-flex justify-content-around text-center">
                                                <div className="mb-2">
                                                    <div className="text-muted small">Hava Sıcaklığı</div>
                                                    <div className="display-6 fw-bold text-primary">
                                                        {getSensorValue(device, 't_air')}°C
                                                    </div>
                                                </div>
                                                <div className="mb-2">
                                                    <div className="text-muted small">Nem</div>
                                                    <div className="display-6 fw-bold text-info">
                                                        %{getSensorValue(device, 'h_air')}
                                                    </div>
                                                </div>
                                            </div>
                                            <hr />
                                            <div className="d-flex justify-content-between px-3">
                                                <span className="text-muted"><Droplets size={16} /> Toprak Nemi:</span>
                                                <span className={`fw-bold ${parseFloat(getSensorValue(device, 'm_soil')) < 20 ? 'text-danger' : 'text-success'}`}>
                                                    %{getSensorValue(device, 'm_soil')}
                                                </span>
                                            </div>
                                        </Card.Body>
                                        <Card.Footer className="bg-light text-muted small text-end">
                                            Son veri: {device.lastSeen ? new Date(device.lastSeen).toLocaleTimeString() : 'Yok'}
                                        </Card.Footer>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </>
            )}
        </div>
    );
};

export default IoTDashboard;
