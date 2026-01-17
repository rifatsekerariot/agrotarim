import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Button as BSButton, Modal, Form, Badge } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'leaflet/dist/leaflet.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import L from 'leaflet';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Fix Leaflet Marker Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Widget Components ---

const WidgetCard = ({ data, unit, title, lastUpdate }) => (
    <div className="h-100 d-flex flex-column justify-content-center align-items-center text-center p-3">
        <h6 className="text-muted mb-2">{title}</h6>
        <h2 className="display-4 fw-bold text-primary">
            {data !== null ? data : '-'} <span className="fs-5 text-secondary">{unit}</span>
        </h2>
        <small className="text-muted">Güncelleme: {lastUpdate || 'Bekleniyor...'}</small>
    </div>
);

const WidgetGauge = ({ data, min = 0, max = 100, unit, title }) => {
    // Simple SVG Gauge
    const value = data || 0;
    const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1);
    const rotation = -90 + (percentage * 180);

    return (
        <div className="h-100 d-flex flex-column justify-content-center align-items-center text-center p-3">
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
        </div>
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
        <div className="h-100 d-flex flex-column p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="text-muted mb-0">{title || sensorCode} ({unit})</h6>
                <Badge bg="light" text="dark">Son 24 Saat</Badge>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
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
        </div>
    );
};

// Map Resize Fix Component
const ResizeMap = () => {
    const map = useMap();
    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        const container = map.getContainer();
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, [map]);
    return null;
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
        e.stopPropagation(); // Stop drag propagation
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
        <div className="h-100 d-flex flex-column">
            <div className="p-2 border-bottom d-flex justify-content-between align-items-center bg-light rounded-top">
                <div>
                    <h6 className="mb-0 text-muted">{widget.title || "İnteraktif Harita"}</h6>
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {isEditing ? 'Haritaya tıklayarak sensör ekleyin.' : 'Verileri görmek için işaretlere tıklayın.'}
                    </small>
                </div>
                <BSButton size="sm" variant={isEditing ? "warning" : "outline-primary"}
                    onMouseDown={(e) => e.stopPropagation()} // Prevent drag start on click
                    onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? <i className="bi bi-check-lg"></i> : <i className="bi bi-pencil-fill"></i>}
                </BSButton>
            </div>
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <MapContainer center={center} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                    <ResizeMap />
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
                    style={{ zIndex: 9999, width: '300px', border: '1px solid #ddd' }}
                    onMouseDown={(e) => e.stopPropagation()}>
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
        </div>
    );
};

const CustomDashboard = () => {
    const [widgets, setWidgets] = useState([]);
    const [devices, setDevices] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [viewMode, setViewMode] = useState('device'); // 'device' or 'custom'

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
            // Transform legacy widgets if needed or use as is if already RGL compatible
            if (config.widgets) {
                // Ensure every widget has layout properties
                const rglWidgets = config.widgets.map((w, index) => ({
                    ...w,
                    // If legacy (has width), convert to w/h/x/y. 
                    // width 4 cols (bootstrap) -> w: 4 (RGL 12 cols total)
                    w: w.w || (w.width ? w.width : 4),
                    h: w.h || 4,
                    x: w.x !== undefined ? w.x : (index * 4) % 12,
                    y: w.y !== undefined ? w.y : Math.floor(index / 3) * 4,
                    i: w.i || w.id.toString()
                }));
                setWidgets(rglWidgets);
            }
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
        setDevices(data);
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

    const onLayoutChange = (layout) => {
        // Sync RGL layout changes back to widget state
        const updatedWidgets = widgets.map(w => {
            const layoutItem = layout.find(l => l.i === w.i);
            if (layoutItem) {
                return { ...w, x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h };
            }
            return w;
        });
        saveConfig(updatedWidgets);
    };

    const handleAddWidget = () => {
        const id = Date.now().toString();
        const widget = {
            ...newWidget,
            id: parseInt(id),
            i: id,
            x: 0,
            y: Infinity, // Put at bottom
            w: 4,
            h: 4
        };

        if (widget.type === 'map') {
            widget.deviceId = 'all';
            widget.sensorCode = 'location';
            widget.w = 6;
            widget.h = 6;
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

    // Calculate time since last seen
    const getTimeSince = (lastSeen) => {
        if (!lastSeen) return 'Hiç bağlanmadı';
        const diff = Date.now() - new Date(lastSeen).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Şimdi';
        if (mins < 60) return `${mins} dk önce`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} saat önce`;
        return `${Math.floor(hours / 24)} gün önce`;
    };

    // Device Card Component for Device View
    const DeviceCard = ({ device }) => {
        const deviceTelemetry = telemetry[device.id] || {};
        const isOnline = device.status === 'online';

        return (
            <Card className={`h-100 shadow-sm border-0 ${isOnline ? '' : 'opacity-75'}`}>
                <Card.Header className={`d-flex justify-content-between align-items-center py-2 ${isOnline ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
                    <div className="d-flex align-items-center gap-2">
                        <i className={`bi ${device.deviceModel?.category === 'soil' ? 'bi-moisture' : device.deviceModel?.category === 'weather' ? 'bi-cloud-sun' : 'bi-thermometer-half'}`}></i>
                        <span className="fw-medium">{device.name}</span>
                    </div>
                    <Badge bg={isOnline ? 'light' : 'dark'} text={isOnline ? 'success' : 'white'} className="small">
                        {isOnline ? '● Online' : '○ Offline'}
                    </Badge>
                </Card.Header>
                <Card.Body className="p-3">
                    {device.sensors.length === 0 ? (
                        <div className="text-center text-muted small py-3">
                            <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                            Sensör verisi yok
                        </div>
                    ) : (
                        <div className="row g-2">
                            {device.sensors.map(sensor => {
                                const data = deviceTelemetry[sensor.code];
                                return (
                                    <div key={sensor.id} className="col-6">
                                        <div className="bg-light rounded p-2 text-center">
                                            <div className="small text-muted text-truncate">{sensor.name || sensor.code}</div>
                                            <div className="fs-5 fw-bold text-primary">
                                                {data ? data.value.toFixed(1) : '--'}
                                                <span className="fs-6 text-secondary ms-1">{sensor.unit}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card.Body>
                <Card.Footer className="bg-light border-0 py-2 d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                        <i className="bi bi-clock me-1"></i>{getTimeSince(device.lastSeen)}
                    </small>
                    {device.batteryLevel && (
                        <Badge bg={device.batteryLevel > 20 ? 'success' : 'danger'}>
                            <i className="bi bi-battery-half me-1"></i>{device.batteryLevel}%
                        </Badge>
                    )}
                </Card.Footer>
            </Card>
        );
    };

    return (
        <Container fluid className="p-4">
            {/* Modern Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary bg-opacity-10 p-3 rounded">
                        <i className="bi bi-grid-1x2-fill text-primary fs-4"></i>
                    </div>
                    <div>
                        <h2 className="mb-0">IoT Dashboard</h2>
                        <small className="text-muted">{devices.length} cihaz • Canlı veri</small>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="btn-group" role="group">
                        <Button
                            variant={viewMode === 'device' ? 'primary' : 'outline-primary'}
                            onClick={() => setViewMode('device')}
                            className="d-flex align-items-center gap-1"
                        >
                            <i className="bi bi-cpu"></i> Cihazlar
                        </Button>
                        <Button
                            variant={viewMode === 'custom' ? 'primary' : 'outline-primary'}
                            onClick={() => setViewMode('custom')}
                            className="d-flex align-items-center gap-1"
                        >
                            <i className="bi bi-grid-3x3"></i> Özel Panel
                        </Button>
                    </div>

                    {viewMode === 'custom' && (
                        <Button variant="success" onClick={() => setShowModal(true)}>
                            <i className="bi bi-plus-lg me-1"></i> Widget Ekle
                        </Button>
                    )}
                </div>
            </div>

            {/* Device View Mode */}
            {viewMode === 'device' && (
                <Row>
                    {devices.length === 0 ? (
                        <div className="text-center text-muted p-5">
                            <i className="bi bi-cpu fs-1 d-block mb-3 opacity-50"></i>
                            <h4>Henüz cihaz eklenmemiş</h4>
                            <p>Ayarlar sayfasından yeni cihaz ekleyin.</p>
                        </div>
                    ) : devices.map(device => (
                        <Col key={device.id} lg={4} md={6} className="mb-4">
                            <DeviceCard device={device} />
                        </Col>
                    ))}
                </Row>
            )}

            {/* Custom Widget View Mode (React Grid Layout) */}
            {viewMode === 'custom' && (
                <>
                    {widgets.length === 0 && (
                        <div className="text-center text-muted p-5">
                            <h4>Henüz bir bileşen eklemediniz.</h4>
                            <p>Sağ üstteki butonu kullanarak göstergeler eklemeye başlayın.</p>
                        </div>
                    )}

                    <ResponsiveGridLayout
                        className="layout"
                        layouts={{ lg: widgets }}
                        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                        rowHeight={50} // 60px height per row unit
                        onLayoutChange={(layout) => onLayoutChange(layout)}
                        isDraggable={true}
                        isResizable={true}
                        draggableHandle=".drag-handle"
                    >
                        {widgets.map(w => {
                            const devData = telemetry[w.deviceId] || {};
                            const sensorData = devData[w.sensorCode];
                            const val = sensorData ? sensorData.value : null;
                            const ts = sensorData ? sensorData.ts : null;
                            const unit = sensorData ? sensorData.unit : '';

                            return (
                                <div key={w.i} className="bg-white shadow-sm rounded border overflow-hidden" style={{ position: 'relative' }}>
                                    {/* Drag Handle & Controls */}
                                    <div className="drag-handle bg-light border-bottom d-flex justify-content-between align-items-center px-2 py-1"
                                        style={{ cursor: 'move', height: '30px' }}>
                                        <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>
                                            {w.type === 'map' ? 'Harita' : (w.deviceName || 'Widget')}
                                        </small>
                                        <div onMouseDown={e => e.stopPropagation()}>
                                            <i className="bi bi-x-lg text-danger small" style={{ cursor: 'pointer' }} onClick={() => removeWidget(w.id)}></i>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div style={{ height: 'calc(100% - 30px)', overflow: 'hidden' }}>
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
                                </div>
                            );
                        })}
                    </ResponsiveGridLayout>
                </>
            )}

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
