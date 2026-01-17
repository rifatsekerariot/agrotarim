import React, { useState, useEffect } from 'react';
import { Container, Tabs, Tab, Card, Table, Button, Form, Row, Col, Badge, Modal, Alert, Spinner } from 'react-bootstrap';
import { Server, Cpu, Radio, Plus, Pencil, Trash2, RefreshCw, Check, X, Wifi, WifiOff } from 'lucide-react';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('devices');

    // Devices State
    const [devices, setDevices] = useState([]);
    const [deviceModels, setDeviceModels] = useState([]);
    const [loraServers, setLoraServers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [showDeviceModal, setShowDeviceModal] = useState(false);
    const [showServerModal, setShowServerModal] = useState(false);
    const [showModelModal, setShowModelModal] = useState(false);

    // Form States
    const [deviceForm, setDeviceForm] = useState({ name: '', serialNumber: '', devEui: '', deviceModelId: '', loraServerId: '', latitude: '', longitude: '' });
    const [serverForm, setServerForm] = useState({ name: '', serverType: 'chirpstack_v4', host: '', port: 8080, apiKey: '', tenantId: '', mqttEnabled: true, mqttHost: '', mqttTopic: 'application/+/device/+/event/up', httpEnabled: false });
    const [modelForm, setModelForm] = useState({ brand: '', model: '', category: '', decoderType: 'milesight', sensorTemplate: [] });

    const [editingId, setEditingId] = useState(null);
    const [testResult, setTestResult] = useState(null);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [devRes, modelRes, serverRes] = await Promise.all([
                fetch('/api/devices'),
                fetch('/api/device-models'),
                fetch('/api/lora/servers')
            ]);

            // Check if responses are OK before parsing
            if (devRes.ok) {
                const devData = await devRes.json();
                setDevices(Array.isArray(devData) ? devData : []);
            } else {
                console.error('Devices API error:', devRes.status);
                setDevices([]);
            }

            if (modelRes.ok) {
                const modelData = await modelRes.json();
                setDeviceModels(Array.isArray(modelData) ? modelData : []);
            } else {
                console.error('Device models API error:', modelRes.status);
                setDeviceModels([]);
            }

            if (serverRes.ok) {
                const serverData = await serverRes.json();
                setLoraServers(Array.isArray(serverData) ? serverData : []);
            } else {
                console.error('LoRa servers API error:', serverRes.status);
                setLoraServers([]);
            }
        } catch (e) {
            console.error('Fetch error:', e);
            setDevices([]);
            setDeviceModels([]);
            setLoraServers([]);
        }
        setLoading(false);
    };

    // ========== DEVICES TAB ==========
    const handleSaveDevice = async (e) => {
        e.preventDefault();
        const url = editingId ? `/api/devices/${editingId}` : '/api/devices';
        const method = editingId ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...deviceForm,
                deviceModelId: deviceForm.deviceModelId ? parseInt(deviceForm.deviceModelId) : null,
                loraServerId: deviceForm.loraServerId ? parseInt(deviceForm.loraServerId) : null
            })
        });
        setShowDeviceModal(false);
        setEditingId(null);
        setDeviceForm({ name: '', serialNumber: '', devEui: '', deviceModelId: '', loraServerId: '', latitude: '', longitude: '' });
        fetchAll();
    };

    const handleEditDevice = (d) => {
        setDeviceForm({
            name: d.name,
            serialNumber: d.serialNumber,
            devEui: d.devEui || '',
            deviceModelId: d.deviceModelId || '',
            loraServerId: d.loraServerId || '',
            latitude: d.latitude || '',
            longitude: d.longitude || ''
        });
        setEditingId(d.id);
        setShowDeviceModal(true);
    };

    const handleDeleteDevice = async (id) => {
        if (!window.confirm('Bu cihazı silmek istediğinize emin misiniz?')) return;
        await fetch(`/api/devices/${id}`, { method: 'DELETE' });
        fetchAll();
    };

    // ========== LORA SERVERS TAB ==========
    const handleSaveServer = async (e) => {
        e.preventDefault();
        const url = editingId ? `/api/lora/servers/${editingId}` : '/api/lora/servers';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serverForm)
            });

            if (res.ok) {
                alert(editingId ? '✅ Sunucu güncellendi!' : '✅ Sunucu eklendi!');
                setShowServerModal(false);
                setEditingId(null);
                setServerForm({ name: '', serverType: 'chirpstack_v4', host: '', port: 8080, apiKey: '', tenantId: '', mqttEnabled: true, mqttHost: '', mqttTopic: 'application/+/device/+/event/up', httpEnabled: false });
                fetchAll();
            } else {
                const error = await res.json();
                alert('❌ Hata: ' + (error.error || 'Sunucu kaydedilemedi'));
            }
        } catch (e) {
            console.error('Save server error:', e);
            alert('❌ Bağlantı hatası: Sunucu kaydedilemedi');
        }
    };

    const handleTestServer = async (id) => {
        setTestResult({ id, loading: true });
        try {
            const res = await fetch(`/api/lora/servers/${id}/test`, { method: 'POST' });
            const data = await res.json();
            setTestResult({ id, ...data });

            // Show alert with result
            if (data.success) {
                alert('✅ ' + data.message);
            } else {
                alert('❌ ' + (data.message || data.error || 'Test başarısız'));
            }
        } catch (e) {
            setTestResult({ id, success: false, message: 'Bağlantı hatası' });
            alert('❌ Bağlantı hatası: Sunucuya ulaşılamadı');
        }
    };

    const handleDeleteServer = async (id) => {
        if (!window.confirm('Bu sunucuyu silmek istediğinize emin misiniz?')) return;
        await fetch(`/api/lora/servers/${id}`, { method: 'DELETE' });
        fetchAll();
    };

    const handleSyncServer = async (id) => {
        const server = loraServers.find(s => s.id === id);
        if (!window.confirm(`${server?.name || 'Sunucu'} üzerinden cihazlar senkronize edilecek. Devam?`)) return;

        try {
            const res = await fetch(`/api/lora/servers/${id}/sync`, { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                alert('✅ ' + data.message);
                fetchAll();
            } else {
                alert('❌ ' + (data.message || data.error || 'Senkronizasyon başarısız'));
            }
        } catch (e) {
            alert('❌ Bağlantı hatası: Senkronizasyon başarısız');
        }
    };

    // ========== DEVICE MODELS TAB ==========
    const handleSeedModels = async () => {
        const res = await fetch('/api/device-models/seed', { method: 'POST' });
        const data = await res.json();
        alert(data.message);
        fetchAll();
    };

    const handleDeleteModel = async (id) => {
        if (!window.confirm('Bu modeli silmek istediğinize emin misiniz?')) return;
        await fetch(`/api/device-models/${id}`, { method: 'DELETE' });
        fetchAll();
    };

    if (loading) {
        return (
            <Container className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Yükleniyor...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="p-4">
            <div className="d-flex align-items-center gap-3 mb-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                    <Server size={32} className="text-primary" />
                </div>
                <div>
                    <h2 className="mb-0">Sistem Ayarları</h2>
                    <small className="text-muted">Cihazlar, LoRa Sunucuları ve Model Şablonları</small>
                </div>
            </div>

            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
                {/* ========== DEVICES TAB ========== */}
                <Tab eventKey="devices" title={<><Cpu size={16} className="me-2" />Cihazlar ({devices.length})</>}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                            <span className="fw-bold">Kayıtlı Cihazlar</span>
                            <Button size="sm" variant="success" onClick={() => { setEditingId(null); setDeviceForm({ name: '', serialNumber: '', devEui: '', deviceModelId: '', loraServerId: '', latitude: '', longitude: '' }); setShowDeviceModal(true); }}>
                                <Plus size={16} className="me-1" /> Yeni Cihaz
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive hover className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Cihaz Adı</th>
                                        <th>DevEUI</th>
                                        <th>Model</th>
                                        <th>Sunucu</th>
                                        <th>Durum</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {devices.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center text-muted py-4">Henüz cihaz eklenmemiş.</td></tr>
                                    ) : devices.map(d => (
                                        <tr key={d.id}>
                                            <td className="fw-medium">{d.name}</td>
                                            <td><code className="small">{d.devEui || d.serialNumber}</code></td>
                                            <td><Badge bg="secondary">{d.deviceModel?.model || d.model || '-'}</Badge></td>
                                            <td>{loraServers.find(s => s.id === d.loraServerId)?.name || '-'}</td>
                                            <td>
                                                {d.status === 'online' ? (
                                                    <Badge bg="success"><Wifi size={12} /> Online</Badge>
                                                ) : (
                                                    <Badge bg="secondary"><WifiOff size={12} /> Offline</Badge>
                                                )}
                                            </td>
                                            <td>
                                                <Button size="sm" variant="outline-primary" className="me-1" onClick={() => handleEditDevice(d)}><Pencil size={14} /></Button>
                                                <Button size="sm" variant="outline-danger" onClick={() => handleDeleteDevice(d.id)}><Trash2 size={14} /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                {/* ========== LORA SERVERS TAB ========== */}
                <Tab eventKey="servers" title={<><Radio size={16} className="me-2" />LoRa Sunucuları ({loraServers.length})</>}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                            <span className="fw-bold">ChirpStack / LoRaWAN Sunucuları</span>
                            <Button size="sm" variant="success" onClick={() => { setEditingId(null); setServerForm({ name: '', serverType: 'chirpstack_v4', host: '', port: 8080, apiKey: '', tenantId: '', mqttEnabled: true, mqttHost: '', mqttTopic: 'application/+/device/+/event/up', httpEnabled: false }); setShowServerModal(true); }}>
                                <Plus size={16} className="me-1" /> Yeni Sunucu
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive hover className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Sunucu Adı</th>
                                        <th>Tip</th>
                                        <th>Adres</th>
                                        <th>Bağlantı</th>
                                        <th>Cihaz Sayısı</th>
                                        <th>Durum</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loraServers.length === 0 ? (
                                        <tr><td colSpan="7" className="text-center text-muted py-4">Henüz sunucu eklenmemiş.</td></tr>
                                    ) : loraServers.map(s => (
                                        <tr key={s.id}>
                                            <td className="fw-medium">{s.name}</td>
                                            <td><Badge bg="info">{s.serverType}</Badge></td>
                                            <td><code>{s.host}:{s.port}</code></td>
                                            <td>
                                                {s.mqttEnabled && <Badge bg="success" className="me-1">MQTT</Badge>}
                                                {s.httpEnabled && <Badge bg="warning">HTTP</Badge>}
                                            </td>
                                            <td>{s._count?.devices || 0}</td>
                                            <td>
                                                {testResult?.id === s.id ? (
                                                    testResult.loading ? <Spinner size="sm" /> :
                                                        testResult.success ? <Badge bg="success"><Check size={12} /> Bağlı</Badge> :
                                                            <Badge bg="danger"><X size={12} /> Hata</Badge>
                                                ) : (
                                                    <Badge bg={s.isActive ? 'success' : 'secondary'}>{s.isActive ? 'Aktif' : 'Pasif'}</Badge>
                                                )}
                                            </td>
                                            <td>
                                                <Button size="sm" variant="outline-success" className="me-1" onClick={() => handleSyncServer(s.id)} title="ChirpStack'ten Senkronize Et"><RefreshCw size={14} /></Button>
                                                <Button size="sm" variant="outline-info" className="me-1" onClick={() => handleTestServer(s.id)} title="Bağlantı Test"><Check size={14} /></Button>
                                                <Button size="sm" variant="outline-primary" className="me-1" onClick={() => { setServerForm(s); setEditingId(s.id); setShowServerModal(true); }}><Pencil size={14} /></Button>
                                                <Button size="sm" variant="outline-danger" onClick={() => handleDeleteServer(s.id)}><Trash2 size={14} /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                {/* ========== DEVICE MODELS TAB ========== */}
                <Tab eventKey="models" title={<><Cpu size={16} className="me-2" />Cihaz Modelleri ({deviceModels.length})</>}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                            <span className="fw-bold">Cihaz Model Şablonları (Milesight, vb.)</span>
                            <div className="d-flex gap-2">
                                <Button size="sm" variant="outline-primary" onClick={handleSeedModels}>
                                    <RefreshCw size={14} className="me-1" /> Varsayılan Modelleri Yükle
                                </Button>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive hover className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Marka</th>
                                        <th>Model</th>
                                        <th>Kategori</th>
                                        <th>Sensörler</th>
                                        <th>Kullanılan</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deviceModels.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center text-muted py-4">
                                            Henüz model eklenmemiş.
                                            <Button variant="link" onClick={handleSeedModels}>Varsayılanları yükle</Button>
                                        </td></tr>
                                    ) : deviceModels.map(m => (
                                        <tr key={m.id}>
                                            <td><Badge bg="dark">{m.brand}</Badge></td>
                                            <td className="fw-medium">{m.model}</td>
                                            <td>{m.category}</td>
                                            <td>
                                                {m.sensorTemplate?.map((s, i) => (
                                                    <Badge key={i} bg="light" text="dark" className="me-1 border">{s.code}</Badge>
                                                ))}
                                            </td>
                                            <td>{m._count?.devices || 0} cihaz</td>
                                            <td>
                                                <Button size="sm" variant="outline-danger" onClick={() => handleDeleteModel(m.id)}><Trash2 size={14} /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            {/* ========== DEVICE MODAL ========== */}
            <Modal show={showDeviceModal} onHide={() => setShowDeviceModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingId ? 'Cihaz Düzenle' : 'Yeni Cihaz Ekle'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveDevice}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Cihaz Adı *</Form.Label>
                                    <Form.Control required value={deviceForm.name} onChange={e => setDeviceForm({ ...deviceForm, name: e.target.value })} placeholder="Kuzey Tarla İstasyonu" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>DevEUI (LoRaWAN) *</Form.Label>
                                    <Form.Control required value={deviceForm.devEui || deviceForm.serialNumber} onChange={e => setDeviceForm({ ...deviceForm, devEui: e.target.value, serialNumber: e.target.value })} placeholder="A1B2C3D4E5F6G7H8" />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Cihaz Modeli</Form.Label>
                                    <Form.Select value={deviceForm.deviceModelId} onChange={e => setDeviceForm({ ...deviceForm, deviceModelId: e.target.value })}>
                                        <option value="">Model Seç...</option>
                                        {deviceModels.map(m => (
                                            <option key={m.id} value={m.id}>{m.brand} - {m.model}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>LoRa Sunucu</Form.Label>
                                    <Form.Select value={deviceForm.loraServerId} onChange={e => setDeviceForm({ ...deviceForm, loraServerId: e.target.value })}>
                                        <option value="">Sunucu Seç...</option>
                                        {loraServers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.host})</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Enlem (Latitude)</Form.Label>
                                    <Form.Control type="number" step="any" value={deviceForm.latitude} onChange={e => setDeviceForm({ ...deviceForm, latitude: e.target.value })} placeholder="36.8" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Boylam (Longitude)</Form.Label>
                                    <Form.Control type="number" step="any" value={deviceForm.longitude} onChange={e => setDeviceForm({ ...deviceForm, longitude: e.target.value })} placeholder="35.5" />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowDeviceModal(false)}>İptal</Button>
                        <Button variant="primary" type="submit">{editingId ? 'Güncelle' : 'Kaydet'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* ========== SERVER MODAL ========== */}
            <Modal show={showServerModal} onHide={() => setShowServerModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingId ? 'Sunucu Düzenle' : 'Yeni LoRa Sunucu Ekle'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveServer}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Sunucu Adı *</Form.Label>
                                    <Form.Control required value={serverForm.name} onChange={e => setServerForm({ ...serverForm, name: e.target.value })} placeholder="Ana ChirpStack" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Sunucu Tipi</Form.Label>
                                    <Form.Select value={serverForm.serverType} onChange={e => setServerForm({ ...serverForm, serverType: e.target.value })}>
                                        <option value="chirpstack_v4">ChirpStack v4</option>
                                        <option value="ttn_v3">TTN v3</option>
                                        <option value="custom">Özel</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Host *</Form.Label>
                                    <Form.Control required value={serverForm.host} onChange={e => setServerForm({ ...serverForm, host: e.target.value })} placeholder="chirpstack.example.com" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Port</Form.Label>
                                    <Form.Control type="number" value={serverForm.port} onChange={e => setServerForm({ ...serverForm, port: parseInt(e.target.value) })} />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>API Key (Token)</Form.Label>
                                    <Form.Control value={serverForm.apiKey || ''} onChange={e => setServerForm({ ...serverForm, apiKey: e.target.value })} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp..." />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Tenant ID</Form.Label>
                                    <Form.Control value={serverForm.tenantId || ''} onChange={e => setServerForm({ ...serverForm, tenantId: e.target.value })} placeholder="v4 UUID" />
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr />
                        <h6>Bağlantı Ayarları</h6>

                        <Form.Check type="switch" id="mqtt-switch" label="MQTT Bağlantısı" checked={serverForm.mqttEnabled} onChange={e => setServerForm({ ...serverForm, mqttEnabled: e.target.checked })} className="mb-2" />
                        {serverForm.mqttEnabled && (
                            <Row className="mb-3">
                                <Col md={8}>
                                    <Form.Control value={serverForm.mqttHost || ''} onChange={e => setServerForm({ ...serverForm, mqttHost: e.target.value })} placeholder="tcp://chirpstack.example.com:1883" />
                                </Col>
                                <Col md={4}>
                                    <Form.Control value={serverForm.mqttTopic || ''} onChange={e => setServerForm({ ...serverForm, mqttTopic: e.target.value })} placeholder="Topic pattern" />
                                </Col>
                            </Row>
                        )}

                        <Form.Check type="switch" id="http-switch" label="HTTP Webhook" checked={serverForm.httpEnabled} onChange={e => setServerForm({ ...serverForm, httpEnabled: e.target.checked })} />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowServerModal(false)}>İptal</Button>
                        <Button variant="primary" type="submit">{editingId ? 'Güncelle' : 'Kaydet'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default Settings;
