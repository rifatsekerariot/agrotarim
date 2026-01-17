import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Badge } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet Marker Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
        if (!deviceSerial) return;
        fetchHistory();
        const interval = setInterval(fetchHistory, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, [deviceSerial, sensorCode]);

    const fetchHistory = async () => {
        try {
            const res = await fetch(`/api/telemetry/history/${deviceSerial}?hours=24`);
            const json = await res.json();

            if (json[sensorCode]) {
                const formatted = json[sensorCode].map(apiPoint => ({
                    time: new Date(apiPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    value: apiPoint.value,
                    timestamp: new Date(apiPoint.timestamp).getTime()
                })).reverse();

                formatted.sort((a, b) => a.timestamp - b.timestamp);
                setData(formatted);
            }
        } catch (error) {
            console.error("Chart data fetch error", error);
        } finally {
            setLoading(false);
        }
    };

    let strokeColor = '#8884d8';
    if (sensorCode.includes('temp') || sensorCode.includes('sicaklik') || (title && title.toLowerCase().includes('sıcaklık'))) strokeColor = '#dc3545';
    else if (sensorCode.includes('hum') || sensorCode.includes('nem')) strokeColor = '#0dcaf0';
    else if (sensorCode.includes('soil') || sensorCode.includes('toprak')) strokeColor = '#198754';

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

// Helper for Map Clicks
const MapClickHandler = ({ onMapClick }) => {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng);
        },
    });
    return null;
};

const WidgetMap = ({ widget, devices, telemetry, onUpdate }) => {
    const [markers, setMarkers] = useState(widget.markers || []);
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [pendingLoc, setPendingLoc] = useState(null);
    const [newMarker, setNewMarker] = useState({ deviceId: '', sensorCode: '' });

    // Devices with GPS (optional background reference)
    const validDevices = devices.filter(d => d.latitude && d.longitude);
    const center = markers.length > 0 ? [markers[0].lat, markers[0].lng] :
        (validDevices.length > 0 ? [validDevices[0].latitude, validDevices[0].longitude] : [39.92, 32.85]);

    const handleMapClick = (latlng) => {
        if (!isEditing) return;
        setPendingLoc(latlng);
        setNewMarker({ deviceId: '', sensorCode: '' });
        setShowModal(true);
    };

    const saveMarker = () => {
        const updatedMarkers = [...markers, { ...newMarker, lat: pendingLoc.lat, lng: pendingLoc.lng, id: Date.now() }];
        setMarkers(updatedMarkers);
        onUpdate({ ...widget, markers: updatedMarkers });
        setShowModal(false);
    };

    const removeMarker = (e, markerId) => {
        e.stopPropagation();
        if (!window.confirm("Bu işareti kaldırmak istiyor musunuz?")) return;
        const updatedMarkers = markers.filter(m => m.id !== markerId);
        setMarkers(updatedMarkers);
        onUpdate({ ...widget, markers: updatedMarkers });
    };

    // Helper to get sensors for selected device in Modal
    const getSensorsForDevice = (devId) => {
        const dev = devices.find(d => d.id == devId);
        if (!dev) return [];
        const mapped = dev.telemetryMappings ? Object.values(dev.telemetryMappings) : [];
        const dbSensors = dev.sensors ? dev.sensors.map(s => s.code) : [];
        return [...new Set([...mapped, ...dbSensors])];
    };

    return (
        <Card className="h-100 shadow-sm border-0">
            <Card.Body className="p-0 d-flex flex-column" style={{ height: '100%' }}>
                <div className="p-2 border-bottom d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="mb-0 text-muted">{widget.title || "İnteraktif Harita"}</h6>
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {isEditing ? 'Haritaya tıklayarak sensör ekleyin.' : 'Verileri görmek için işaretlere tıklayın.'}
                        </small>
                    </div>
                    <BSButton size="sm" variant={isEditing ? "warning" : "outline-primary"} onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? <i className="bi bi-check-lg"></i> : <i className="bi bi-pencil-fill"></i>}
                    </BSButton>
                </div>
                <div style={{ flex: 1, minHeight: '300px' }}>
                    <MapContainer center={center} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; OpenStreetMap contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickHandler onMapClick={handleMapClick} />

                        {/* Configured Custom Markers */}
                        {markers.map(m => {
                            const devTel = telemetry[m.deviceId] || {};
                            const sensData = devTel[m.sensorCode];
                            const val = sensData ? sensData.value : '-';
                            const unit = sensData ? sensData.unit : '';
                            const devName = devices.find(d => d.id == m.deviceId)?.name || 'Unknown';

                            return (
                                <Marker key={m.id} position={[m.lat, m.lng]}>
                                    <Popup>
                                        <div className="text-center">
                                            <strong>{devName}</strong>
                                            <div className="text-muted small">{m.sensorCode}</div>
                                            <h4 className="my-2 text-primary">{val} <small>{unit}</small></h4>
                                            {isEditing && (
                                                <BSButton size="sm" variant="danger" onClick={(e) => removeMarker(e, m.id)}>Sil</BSButton>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>

                {/* Local Modal for Marker Adding */}
                {showModal && (
                    <div className="position-absolute top-50 start-50 translate-middle bg-white p-3 shadow rounded"
                        style={{ zIndex: 9999, width: '300px', border: '1px solid #ddd' }}>
                        <h6>Noktaya Sensör Ata</h6>
                        <Form.Select className="mb-2"
                            onChange={e => setNewMarker({ ...newMarker, deviceId: e.target.value, sensorCode: '' })}>
                            <option value="">Cihaz Seç...</option>
                            {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </Form.Select>
                        <Form.Select className="mb-2" disabled={!newMarker.deviceId}
                            onChange={e => setNewMarker({ ...newMarker, sensorCode: e.target.value })}>
                            <option value="">Sensör Seç...</option>
                            {getSensorsForDevice(newMarker.deviceId).map(s => <option key={s} value={s}>{s}</option>)}
                        </Form.Select>
                        <div className="d-flex justify-content-end gap-2">
                            <BSButton size="sm" variant="secondary" onClick={() => setShowModal(false)}>İptal</BSButton>
                            <BSButton size="sm" variant="success"
                                disabled={!newMarker.deviceId || !newMarker.sensorCode}
                                onClick={saveMarker}>Ekle</BSButton>
                        </div>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

const CustomDashboard = () => {
    const [widgets, setWidgets] = useState([]);
    const [devices, setDevices] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const farmId = 1;

    const [newWidget, setNewWidget] = useState({ deviceId: '', sensorCode: '', type: 'card', title: '', width: 4 });
    const [selectedDeviceSensors, setSelectedDeviceSensors] = useState([]);
    const [telemetry, setTelemetry] = useState({});

    useEffect(() => {
        fetchConfig();
        fetchDevices();
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

    const handleWidgetUpdate = (updatedWidget) => {
        const newWidgets = widgets.map(w => w.id === updatedWidget.id ? updatedWidget : w);
        saveConfig(newWidgets);
    };

    const resizeWidget = (id, direction) => {
        const sizes = [3, 4, 6, 8, 12];
        const currentWidgets = [...widgets];
        const widget = currentWidgets.find(w => w.id === id);
        if (widget) {
            const currentSize = widget.width || 4;
            const currentIndex = sizes.indexOf(currentSize) !== -1 ? sizes.indexOf(currentSize) : 1;
            let newIndex = currentIndex + direction;
            if (newIndex < 0) newIndex = 0;
            if (newIndex >= sizes.length) newIndex = sizes.length - 1;

            widget.width = sizes[newIndex];
            saveConfig(currentWidgets);
        }
    };

    const handleAddWidget = () => {
        const widget = { ...newWidget, id: Date.now() };

        if (widget.type === 'map') {
            widget.deviceId = 'all';
            widget.sensorCode = 'location';
            saveConfig([...widgets, widget]);
            setShowModal(false);
            return;
        }

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
        setNewWidget({ ...newWidget, deviceId: devId, sensorCode: '', width: 4 });
        const dev = devices.find(d => d.id == devId);
        if (dev) {
            const mapped = dev.telemetryMappings ? Object.values(dev.telemetryMappings) : [];
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

                    const colWidth = w.width || 4;

                    return (
                        <Col key={w.id} md={colWidth} className="mb-4">
                            <div style={{ position: 'relative', height: '100%' }}>
                                <div style={{ position: 'absolute', right: 5, top: 5, zIndex: 1000, opacity: 0.8 }} className="d-flex gap-1">
                                    <Button size="sm" variant="light" className="border shadow-sm p-0 px-2" title="Küçült"
                                        onClick={() => resizeWidget(w.id, -1)} disabled={colWidth <= 3}>
                                        <i className="bi bi-dash-lg"></i>
                                    </Button>
                                    <Button size="sm" variant="light" className="border shadow-sm p-0 px-2" title="Büyüt"
                                        onClick={() => resizeWidget(w.id, 1)} disabled={colWidth >= 12}>
                                        <i className="bi bi-plus-lg"></i>
                                    </Button>
                                    <Button size="sm" variant="danger" className="shadow-sm p-0 px-2"
                                        onClick={() => removeWidget(w.id)}>
                                        <i className="bi bi-x-lg"></i>
                                    </Button>
                                </div>

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
                                {w.type === 'map' && (
                                    <WidgetMap
                                        widget={w}
                                        devices={devices}
                                        telemetry={telemetry}
                                        onUpdate={handleWidgetUpdate}
                                    />
                                )}
                            </div>
                        </Col>
                    );
                })}
            </Row>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Yeni Bileşen Oluştur</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Görünüm Tipi</Form.Label>
                            <Form.Select onChange={e => setNewWidget({ ...newWidget, type: e.target.value })}>
                                <option value="card">Sayı Kartı (Card)</option>
                                <option value="gauge">İbreli Gösterge (Gauge)</option>
                                <option value="chart">Zaman Grafiği (Line Chart)</option>
                                <option value="map">Harita (Map)</option>
                            </Form.Select>
                        </Form.Group>

                        {newWidget.type !== 'map' && (
                            <>
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
                            </>
                        )}

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
                        disabled={newWidget.type !== 'map' && (!newWidget.deviceId || !newWidget.sensorCode)}
                        onClick={handleAddWidget}>Ekle</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default CustomDashboard;
