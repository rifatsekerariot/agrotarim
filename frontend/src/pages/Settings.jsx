import React, { useState, useEffect } from 'react';
import { Container, Tabs, Tab, Card, Table, Button, Form, Row, Col, Badge, Modal, Spinner, Dropdown, InputGroup } from 'react-bootstrap';
import { Server, Cpu, Radio, Plus, Pencil, Trash2, RefreshCw, Check, X, Wifi, WifiOff, MoreVertical, Search, Filter, ChevronLeft, ChevronRight, Copy, MessageSquare } from 'lucide-react';
import SmsProvidersTab from '../components/SmsProvidersTab';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('devices');

    // Devices State
    const [devices, setDevices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'online', 'offline'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [loraServers, setLoraServers] = useState([]);
    const [loading, setLoading] = useState(true);

    // SMS Providers State
    const [smsProviders, setSmsProviders] = useState([]);
    const [showSmsModal, setShowSmsModal] = useState(false);
    const [smsForm, setSmsForm] = useState({ name: '', displayName: '', priority: 0, isActive: false, config: {} });
    const [editingSmsId, setEditingSmsId] = useState(null);
    const [testSmsPhone, setTestSmsPhone] = useState('');
    const [smsTestResult, setSmsTestResult] = useState(null);

    // Modal States
    const [showDeviceModal, setShowDeviceModal] = useState(false);
    const [showServerModal, setShowServerModal] = useState(false);

    // Form States
    const [deviceForm, setDeviceForm] = useState({ name: '', serialNumber: '', devEui: '', deviceModelId: '', loraServerId: '', latitude: '', longitude: '' });
    const [serverForm, setServerForm] = useState({ name: '', serverType: 'chirpstack_v4', host: '', port: 8080, apiKey: '', tenantId: '', mqttEnabled: true, mqttHost: '', mqttTopic: 'application/+/device/+/event/up', httpEnabled: false });

    const [editingId, setEditingId] = useState(null);
    const [testResult, setTestResult] = useState(null);

    // Toast State (Simple Alert for copy)
    // In a real app, use a Toast component. For now, window.alert or console is used for copy feedback.

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [devRes, serverRes, smsRes] = await Promise.all([
                fetch('/api/devices'),
                fetch('/api/lora/servers'),
                fetch('/api/sms/providers', { headers })
            ]);

            if (devRes.ok) {
                const devData = await devRes.json();
                setDevices(Array.isArray(devData) ? devData : []);
            } else { setDevices([]); }

            if (serverRes.ok) {
                const serverData = await serverRes.json();
                setLoraServers(Array.isArray(serverData) ? serverData : []);
            } else { setLoraServers([]); }

            if (smsRes.ok) {
                const smsData = await smsRes.json();
                setSmsProviders(Array.isArray(smsData) ? smsData : []);
            } else { setSmsProviders([]); }
        } catch (e) {
            console.error('Fetch error:', e);
            setDevices([]);
            setLoraServers([]);
            setSmsProviders([]);
        }
        setLoading(false);
    };

    // --- Helpers for Device List ---
    const handleCopyDevEui = (eui) => {
        navigator.clipboard.writeText(eui);
        // Could show a toast here
    };

    const getFilteredDevices = () => {
        return devices.filter(d => {
            const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (d.devEui || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (d.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    };

    const filteredDevices = getFilteredDevices();
    const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
    const paginatedDevices = filteredDevices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const onlineCount = devices.filter(d => d.status === 'online').length;
    const offlineCount = devices.filter(d => d.status !== 'online').length;


    // ========== DEVICES TAB ACTIONS ==========
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

    // ========== LORA SERVERS ACTIONS (Unchanged logic) ==========
    const handleSaveServer = async (e) => {
        // ... existing save logic ...
        e.preventDefault();
        const url = editingId ? `/api/lora/servers/${editingId}` : '/api/lora/servers';
        const method = editingId ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(serverForm)
            });
            if (res.ok) {
                alert(editingId ? '✅ Sunucu güncellendi!' : '✅ Sunucu eklendi!');
                setShowServerModal(false); setEditingId(null);
                setServerForm({ name: '', serverType: 'chirpstack_v4', host: '', port: 8080, apiKey: '', tenantId: '', mqttEnabled: true, mqttHost: '', mqttTopic: 'application/+/device/+/event/up', httpEnabled: false });
                fetchAll();
            } else {
                const error = await res.json(); alert('❌ Hata: ' + (error.error || 'Sunucu kaydedilemedi'));
            }
        } catch (e) { alert('❌ Bağlantı hatası'); }
    };
    const handleTestServer = async (id) => {
        setTestResult({ id, loading: true });
        try {
            const res = await fetch(`/api/lora/servers/${id}/test`, { method: 'POST' });
            const data = await res.json();
            setTestResult({ id, ...data });
            if (data.success) alert('✅ ' + data.message); else alert('❌ ' + (data.message || 'Test başarısız'));
        } catch (e) { setTestResult({ id, success: false }); alert('❌ Bağlantı hatası'); }
    };
    const handleDeleteServer = async (id) => {
        if (!window.confirm('Silmek istediğinize emin misiniz?')) return;
        await fetch(`/api/lora/servers/${id}`, { method: 'DELETE' });
        fetchAll();
    };
    const handleSyncServer = async (id) => {
        // ... existing sync logic ...
        if (!window.confirm("Senkronizasyon yapılsın mı?")) return;
        try {
            const res = await fetch(`/api/lora/servers/${id}/sync`, { method: 'POST' });
            const data = await res.json();
            if (data.success) { alert('✅ ' + data.message); fetchAll(); } else alert('❌ ' + data.message);
        } catch (e) { alert('❌ Hata'); }
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
                    <small className="text-muted">Cihaz Listesi ve Sunucu Yapılandırması</small>
                </div>
            </div>

            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
                {/* ========== DEVICES TAB (OVERHAULED) ========== */}
                <Tab eventKey="devices" title={<><Cpu size={16} className="me-2" />Cihazlar ({devices.length})</>}>

                    {/* 1. Stats Bar */}
                    <div className="d-flex gap-3 mb-4">
                        <div className="bg-white px-3 py-2 rounded shadow-sm border d-flex align-items-center gap-2">
                            <div className="bg-primary bg-opacity-10 p-2 rounded-circle"><Cpu size={16} className="text-primary" /></div>
                            <div><div className="small text-muted fw-bold">TOPLAM</div><div className="fw-bold">{devices.length}</div></div>
                        </div>
                        <div className="bg-white px-3 py-2 rounded shadow-sm border d-flex align-items-center gap-2">
                            <div className="bg-success bg-opacity-10 p-2 rounded-circle"><span className="status-dot online d-block m-0"></span></div>
                            <div><div className="small text-muted fw-bold">ONLINE</div><div className="fw-bold text-success">{onlineCount}</div></div>
                        </div>
                        <div className="bg-white px-3 py-2 rounded shadow-sm border d-flex align-items-center gap-2">
                            <div className="bg-secondary bg-opacity-10 p-2 rounded-circle"><span className="status-dot offline d-block m-0"></span></div>
                            <div><div className="small text-muted fw-bold">OFFLINE</div><div className="fw-bold text-secondary">{offlineCount}</div></div>
                        </div>
                    </div>

                    <Card className="border-0 shadow-sm overflow-hidden" style={{ borderRadius: '12px' }}>
                        {/* 2. Toolbar */}
                        <div className="bg-white p-3 border-bottom d-flex flex-wrap gap-3 justify-content-between align-items-center">
                            <div className="d-flex gap-2 flex-grow-1" style={{ maxWidth: '500px' }}>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light border-end-0"><Search size={16} className="text-muted" /></InputGroup.Text>
                                    <Form.Control
                                        placeholder="Cihaz ara (İsim, DevEUI, Seri No)"
                                        className="border-start-0 bg-light"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </InputGroup>
                                <Form.Select className="w-auto bg-light" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                    <option value="all">Tüm Durumlar</option>
                                    <option value="online">🟢 Online</option>
                                    <option value="offline">⚫ Offline</option>
                                </Form.Select>
                            </div>
                            <Button variant="primary" onClick={() => { setEditingId(null); setDeviceForm({ name: '', serialNumber: '', devEui: '', deviceModelId: '', loraServerId: '', latitude: '', longitude: '' }); setShowDeviceModal(true); }}>
                                <Plus size={18} className="me-1" /> Yeni Cihaz
                            </Button>
                        </div>

                        {/* 3. Modern Table */}
                        <div className="device-table-container border-0">
                            <Table responsive hover className="mb-0 device-table align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th style={{ width: '25%' }}>CİHAZ ADI</th>
                                        <th style={{ width: '20%' }}>DEVEUI</th>
                                        <th style={{ width: '20%' }}>SUNUCU</th>
                                        <th style={{ width: '15%' }}>DURUM</th>
                                        <th style={{ width: '10%' }} className="text-end">İŞLEMLER</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedDevices.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center text-muted py-5"><div className="d-flex flex-column align-items-center opacity-50"><Cpu size={48} className="mb-2" />Cihaz bulunamadı.</div></td></tr>
                                    ) : paginatedDevices.map(d => {
                                        const eui = d.devEui || d.serialNumber;
                                        const displayEui = eui && eui.length > 8 ? `${eui.substring(0, 4)}...${eui.substring(eui.length - 4)}` : eui;

                                        return (
                                            <tr key={d.id} className="device-row bg-white">
                                                <td>
                                                    <div className="fw-bold text-dark">{d.name}</div>
                                                    {d.description && <small className="text-muted">{d.description}</small>}
                                                </td>
                                                <td>
                                                    <span className="deveui-badge" title={eui} onClick={() => handleCopyDevEui(eui)}>
                                                        {displayEui} <Copy size={10} className="ms-1 opacity-50" />
                                                    </span>
                                                </td>
                                                <td className="text-muted small">
                                                    {loraServers.find(s => s.id === d.loraServerId)?.name || <span className="text-warning">-</span>}
                                                </td>
                                                <td>
                                                    {d.status === 'online' ? (
                                                        <span className="status-badge online"><span className="status-dot online"></span>Online</span>
                                                    ) : (
                                                        <span className="status-badge offline"><span className="status-dot offline"></span>Offline</span>
                                                    )}
                                                </td>
                                                <td className="text-end">
                                                    <Dropdown align="end">
                                                        <Dropdown.Toggle as="div" className="action-btn d-inline-block cursor-pointer" bsPrefix="custom-dropdown">
                                                            <MoreVertical size={16} />
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu className="shadow-sm border-0">
                                                            <Dropdown.Item onClick={() => handleEditDevice(d)} small><Pencil size={14} className="me-2 text-primary" />Düzenle</Dropdown.Item>
                                                            <Dropdown.Item onClick={() => console.log('Details', d.id)} small><span className="text-muted d-flex align-items-center"><Server size={14} className="me-2" />Detaylar</span></Dropdown.Item>
                                                            <Dropdown.Divider />
                                                            <Dropdown.Item onClick={() => handleDeleteDevice(d.id)} className="text-danger small"><Trash2 size={14} className="me-2" />Sil</Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>

                        {/* 4. Pagination */}
                        <div className="bg-white p-3 border-top d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                                Toplam {filteredDevices.length} kayıttan {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredDevices.length)} arası gösteriliyor
                            </small>
                            <div className="d-flex gap-2">
                                <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)}><ChevronLeft size={16} /></button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button key={i} className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`} onClick={() => setCurrentPage(i + 1)}>
                                        {i + 1}
                                    </button>
                                ))}
                                <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)}><ChevronRight size={16} /></button>
                            </div>
                        </div>
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

                {/* ========== SMS PROVIDERS TAB ========== */}
                <Tab eventKey="sms" title={<><MessageSquare size={16} className="me-2" />SMS Providers ({smsProviders.length})</>}>
                    <SmsProvidersTab
                        providers={smsProviders}
                        onEdit={handleEditSmsProvider}
                        onDelete={handleDeleteSmsProvider}
                        onTest={handleTestSmsProvider}
                        loading={loading}
                        onAdd={() => alert('SMS Provider ekleme özelliği yakında eklenecek')}
                    />
                </Tab>

            </Tabs>

            {/* Device Modal */}
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

            {/* Server Modal */}
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
