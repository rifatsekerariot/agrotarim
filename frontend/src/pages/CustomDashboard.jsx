import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Badge } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- Widget Components ---

const WidgetCard = ({ data, unit, title, lastUpdate }) => (
    <Card className="h-100 text-center shadow-sm border-0">
        <Card.Body>
            <h6 className="text-muted mb-2">{title}</h6>
            <h2 className="display-4 fw-bold text-primary">
                {data !== null ? data : '-'} <span className="fs-5 text-secondary">{unit}</span>
            </h2>
            <small className="text-muted">Güncelleme: {lastUpdate || 'Bekleniyor...'}</small>
        </Card.Body>
    </Card>
);

const WidgetGauge = ({ data, min = 0, max = 100, unit, title }) => {
    // Simple SVG Gauge
    const value = data || 0;
    const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1);
    const rotation = -90 + (percentage * 180);

    return (
        <Card className="h-100 text-center shadow-sm border-0">
            <Card.Body>
                <h6 className="text-muted mb-3">{title}</h6>
                <div style={{ position: 'relative', height: '100px', overflow: 'hidden' }}>
                    <div style={{
                        width: '200px', height: '200px', borderRadius: '50%', border: '20px solid #eee',
                        position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)'
                    }}></div>
                    <div style={{
                        width: '200px', height: '200px', borderRadius: '50%',
                        border: '20px solid transparent', borderTopColor: value > max * 0.8 ? '#dc3545' : '#198754',
                        position: 'absolute', top: '0', left: '50%', transform: `translateX(-50%) rotate(${rotation}deg)`,
                        transition: 'transform 1s ease-out'
                    }}></div>
                </div>
                <h3 className="mt-2 text-dark">{value} {unit}</h3>
            </Card.Body>
        </Card>
    );
};

const WidgetChart = ({ deviceSerial, sensorCode, title, unit }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, [deviceSerial, sensorCode]);

    const fetchHistory = async () => {
        try {
            // Fetch last 24h history
            const res = await fetch(`/api/telemetry/history/${deviceSerial}?hours=24`);
            const json = await res.json();

            // API returns { "t_air": [...], "h_air": [...] }
            // We need to extract the specific sensor array and format for Recharts
            if (json[sensorCode]) {
                const formatted = json[sensorCode].map(apiPoint => ({
                    time: new Date(apiPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    value: apiPoint.value,
                    timestamp: new Date(apiPoint.timestamp).getTime() // for sorting if needed
                })).reverse(); // API usually returns newest first? verify. TelemetryService usually sorts desc. Recharts needs asc in X axis usually.

                // Sort ascending by time
                formatted.sort((a, b) => a.timestamp - b.timestamp);

                setData(formatted);
            }
        } catch (error) {
            console.error("Chart data fetch error", error);
        } finally {
            setLoading(false);
        }
    };

    // Determine Color
    let strokeColor = '#8884d8';
    if (sensorCode.includes('temp') || sensorCode.includes('sicaklik') || title.toLowerCase().includes('sıcaklık')) strokeColor = '#dc3545'; // Red
    else if (sensorCode.includes('hum') || sensorCode.includes('nem')) strokeColor = '#0dcaf0'; // Blue
    else if (sensorCode.includes('soil') || sensorCode.includes('toprak')) strokeColor = '#198754'; // Green

    return (
        <Card className="h-100 shadow-sm border-0">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="text-muted mb-0">{title || sensorCode} ({unit})</h6>
                    <Badge bg="light" text="dark">Son 24 Saat</Badge>
                </div>
                <div style={{ width: '100%', height: 250 }}>
                    {loading ? <p className="text-center mt-5">Yükleniyor...</p> : (
                        <ResponsiveContainer>
                            <LineChart data={data}>
                                <XAxis dataKey="time" tick={{ fontSize: 12 }} interval="preserveStartEnd" minTickGap={30} />
                                <YAxis domain={['auto', 'auto']} width={40} />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};

const CustomDashboard = () => {
    const [widgets, setWidgets] = useState([]);
    const [devices, setDevices] = useState([]);
    const [showModal, setShowModal] = useState(false);

    // Config State
    const farmId = 1; // Default MVP

    // New Widget Form State
    const [newWidget, setNewWidget] = useState({ deviceId: '', sensorCode: '', type: 'chart', title: '' });
    const [selectedDeviceSensors, setSelectedDeviceSensors] = useState([]);

    // Live Data Storage for gauges/cards
    const [telemetry, setTelemetry] = useState({}); // { deviceSerial: { sensors: {...} } }

    useEffect(() => {
        fetchConfig();
        fetchDevices();

        // Poll for live data (MVP approach - could be MQTT over WS)
        const interval = setInterval(fetchLiveData, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch(`/api/expert/${farmId}/dashboard`);
            const config = await res.json();
            if (config.widgets) setWidgets(config.widgets);
        } catch (e) {
            console.error("Layout load failed", e);
        }
    };

    const fetchDevices = async () => {
        const res = await fetch('/api/devices');
        const data = await res.json();
        setDevices(data);
    };

    const fetchLiveData = async () => {
        const res = await fetch('/api/devices');
        const data = await res.json();
        const telMap = {};

        data.forEach(d => {
            const sensors = {};
            d.sensors.forEach(s => {
                if (s.telemetry && s.telemetry[0]) {
                    sensors[s.code] = {
                        value: s.telemetry[0].value,
                        ts: new Date(s.telemetry[0].timestamp).toLocaleTimeString(),
                        unit: s.unit
                    };
                }
            });
            telMap[d.id] = sensors;
        });
        setTelemetry(telMap);
    };

    const saveConfig = async (newWidgets) => {
        setWidgets(newWidgets);
        await fetch(`/api/expert/${farmId}/dashboard`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ widgets: newWidgets })
        });
    };

    const handleAddWidget = () => {
        const widget = { ...newWidget, id: Date.now() };
        // Find unit of selected sensor
        const device = devices.find(d => d.id == widget.deviceId);
        if (device) {
            widget.serialNumber = device.serialNumber;
            widget.deviceName = device.name;
        }

        saveConfig([...widgets, widget]);
        setShowModal(false);
    };

    const removeWidget = (id) => {
        if (!window.confirm("Bileşeni kaldırmak istiyor musunuz?")) return;
        saveConfig(widgets.filter(w => w.id !== id));
    };

    const handleDeviceSelect = (devId) => {
        setNewWidget({ ...newWidget, deviceId: devId, sensorCode: '' });
        const dev = devices.find(d => d.id == devId);
        if (dev) {
            // Populate sensors
            // 1. From Mappings logic
            const mapped = dev.telemetryMappings ? Object.values(dev.telemetryMappings) : [];
            // 2. From DB sensors
            const dbSensors = dev.sensors ? dev.sensors.map(s => s.code) : [];
            const combined = [...new Set([...mapped, ...dbSensors])];
            setSelectedDeviceSensors(combined);
        } else {
            setSelectedDeviceSensors([]);
        }
    };

    return (
        <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-primary"><i className="bi bi-grid-1x2-fill"></i> Özel Dashboard Tasarımı</h2>
                <Button variant="success" onClick={() => setShowModal(true)}>
                    <i className="bi bi-plus-lg"></i> Yeni Bileşen Ekle
                </Button>
            </div>

            <Row>
                {widgets.length === 0 ? (
                    <div className="text-center text-muted p-5">
                        <h4>Henüz bir bileşen eklemediniz.</h4>
                        <p>Sağ üstteki butonu kullanarak göstergeler eklemeye başlayın.</p>
                    </div>
                ) : widgets.map(w => {
                    const devData = telemetry[w.deviceId] || {};
                    const sensorData = devData[w.sensorCode];
                    const val = sensorData ? sensorData.value : null;
                    const ts = sensorData ? sensorData.ts : null;
                    const unit = sensorData ? sensorData.unit : '';

                    return (
                        <Col key={w.id} md={w.type === 'chart' ? 12 : 4} className="mb-4">
                            <div style={{ position: 'relative', height: '100%' }}>
                                <Button size="sm" variant="danger"
                                    style={{ position: 'absolute', right: 5, top: 5, zIndex: 10, opacity: 0.5 }}
                                    onClick={() => removeWidget(w.id)}>x</Button>

                                {w.type === 'card' && <WidgetCard data={val} unit={unit} title={w.title || w.sensorCode} lastUpdate={ts} />}
                                {w.type === 'gauge' && <WidgetGauge data={val} unit={unit} title={w.title || w.sensorCode} />}
                                {w.type === 'chart' && (
                                    <WidgetChart
                                        deviceSerial={w.serialNumber}
                                        sensorCode={w.sensorCode}
                                        title={w.title}
                                        unit={unit}
                                    />
                                )}
                            </div>
                        </Col>
                    );
                })}
            </Row>

            {/* Config Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Yeni Bileşen Oluştur</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Cihaz Seçin</Form.Label>
                            <Form.Select onChange={e => handleDeviceSelect(e.target.value)}>
                                <option value="">Seçiniz...</option>
                                {devices.map(d => <option key={d.id} value={d.id}>{d.name} ({d.serialNumber})</option>)}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Veri Kaynağı (Sensör)</Form.Label>
                            <Form.Select onChange={e => setNewWidget({ ...newWidget, sensorCode: e.target.value })}>
                                <option value="">Seçiniz...</option>
                                {selectedDeviceSensors.map(s => <option key={s} value={s}>{s}</option>)}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Görünüm Tipi</Form.Label>
                            <Form.Select onChange={e => setNewWidget({ ...newWidget, type: e.target.value })}>
                                <option value="chart">Zaman Grafiği (Line Chart)</option>
                                <option value="card">Sayı Kartı (Card)</option>
                                <option value="gauge">İbreli Gösterge (Gauge)</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Başlık (Opsiyonel)</Form.Label>
                            <Form.Control type="text" placeholder="Örn: Sera Sıcaklığı"
                                onChange={e => setNewWidget({ ...newWidget, title: e.target.value })} />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button>
                    <Button variant="primary"
                        disabled={!newWidget.deviceId || !newWidget.sensorCode}
                        onClick={handleAddWidget}>Ekle</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default CustomDashboard;
