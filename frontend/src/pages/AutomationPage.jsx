import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { Wifi, Thermometer, Droplets, Activity, Bell, Trash2, Plus } from 'lucide-react';

const AutomationPage = () => {
    const token = localStorage.getItem('token') || '';
    const [devices, setDevices] = useState([]);
    const [rules, setRules] = useState([]);
    const [logs, setLogs] = useState([]);
    const [farmId, setFarmId] = useState(1); // Default farm ID 1
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        deviceId: '',
        sensorCode: 'temperature',
        condition: 'GREATER_THAN',
        threshold: '',
        actionType: 'NOTIFICATION',
        actionTarget: ''
    });

    useEffect(() => {
        if (token) {
            fetchData();
            const interval = setInterval(fetchData, 10000); // Poll logs
            return () => clearInterval(interval);
        }
    }, [token, farmId]);

    const fetchData = async () => {
        try {
            // Fetch Devices
            const devicesRes = await axios.get('/api/devices', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDevices(devicesRes.data);

            const rulesRes = await axios.get(`/api/automation/rules/${farmId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRules(rulesRes.data);

            const logsRes = await axios.get(`/api/automation/logs/${farmId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(logsRes.data);
        } catch (error) {
            console.error("Error fetching automation data:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bu kuralı silmek istediğinize emin misiniz?")) return;
        try {
            await axios.delete(`/api/automation/rules/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            alert("Silinemedi: " + error.message);
        }
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.deviceId || !formData.threshold) {
            alert("Lütfen tüm zorunlu alanları (Ad, Cihaz, Eşik Değer) doldurun.");
            return;
        }

        try {
            const payload = {
                farmId,
                name: formData.name,
                deviceId: formData.deviceId,
                sensorCode: formData.sensorCode,
                condition: formData.condition,
                threshold: formData.threshold,
                actions: [
                    { type: formData.actionType, target: formData.actionTarget }
                ]
            };

            await axios.post('http://localhost:3000/api/automation/rules', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowModal(false);
            fetchData();
            // Reset form
            setFormData({ ...formData, name: '', threshold: '' });
        } catch (error) {
            alert("Oluşturulamadı: " + error.message);
        }
    };

    return (
        <Container fluid className="p-4">
            <h2 className="mb-4 d-flex align-items-center gap-2">
                <Activity className="text-primary" /> Otomasyon Merkezi
            </h2>

            <Row>
                <Col md={8}>
                    <Card className="shadow-sm mb-4">
                        <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
                            <h5 className="mb-0">Aktif Kurallar</h5>
                            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                                <Plus size={18} className="me-1" /> Yeni Kural Ekle
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table hover responsive className="mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th>Kural Adı</th>
                                        <th>Cihaz / Sensör</th>
                                        <th>Koşul</th>
                                        <th>Aksiyon</th>
                                        <th>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rules.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center py-4 text-muted">Henüz kural tanımlanmamış.</td></tr>
                                    ) : rules.map(rule => (
                                        <tr key={rule.id}>
                                            <td className="fw-medium">{rule.name}</td>
                                            <td>
                                                <Badge bg="light" text="dark" className="border px-2 py-1">
                                                    {rule.device?.name || 'Cihaz'} / {rule.sensorCode}
                                                </Badge>
                                            </td>
                                            <td>
                                                {rule.condition === 'GREATER_THAN' && <span className="text-danger fw-bold">{`> ${rule.threshold}`}</span>}
                                                {rule.condition === 'LESS_THAN' && <span className="text-primary fw-bold">{`< ${rule.threshold}`}</span>}
                                                {rule.condition === 'EQUALS' && <span className="text-info fw-bold">{`= ${rule.threshold}`}</span>}
                                            </td>
                                            <td>
                                                {rule.actions.map((act, i) => (
                                                    <span key={i} className="small d-block">
                                                        {act.type === 'NOTIFICATION' ? '🔔 Bildirim' : `📩 ${act.type}`}
                                                    </span>
                                                ))}
                                            </td>
                                            <td>
                                                <Button variant="link" className="text-danger p-0" onClick={() => handleDelete(rule.id)}>
                                                    <Trash2 size={18} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className="shadow-sm border-0 bg-light">
                        <Card.Header className="bg-transparent border-0 d-flex align-items-center">
                            <Bell size={18} className="me-2 text-warning" />
                            <h6 className="mb-0">Son Tetiklenmeler</h6>
                        </Card.Header>
                        <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {logs.length === 0 ? <small className="text-muted">Kayıt yok.</small> : logs.map(log => (
                                <div key={log.id} className="bg-white p-3 rounded mb-2 shadow-sm border-start border-4 border-warning">
                                    <div className="d-flex justify-content-between mb-1">
                                        <small className="fw-bold">{log.rule.name}</small>
                                        <small className="text-muted">{new Date(log.createdAt).toLocaleTimeString()}</small>
                                    </div>
                                    <div className="text-dark small">{log.message}</div>
                                </div>
                            ))}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Create Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Yeni Otomasyon Kuralı</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Kural Adı</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Örn: Sera 1 Don Uyarısı"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Cihaz Seçin</Form.Label>
                                    <Form.Select
                                        value={formData.deviceId}
                                        onChange={e => setFormData({ ...formData, deviceId: e.target.value })}
                                    >
                                        <option value="">Cihaz Seç...</option>
                                        {devices.map(d => (
                                            <option key={d.id} value={d.id}>{d.name} ({d.serialNumber})</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Sensör Tipi</Form.Label>
                                    <Form.Select
                                        value={formData.sensorCode}
                                        onChange={e => setFormData({ ...formData, sensorCode: e.target.value })}
                                    >
                                        <option value="temperature">Sıcaklık (°C)</option>
                                        <option value="humidity">Nem (%)</option>
                                        <option value="battery">Batarya (%)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Koşul</Form.Label>
                                    <Form.Select
                                        value={formData.condition}
                                        onChange={e => setFormData({ ...formData, condition: e.target.value })}
                                    >
                                        <option value="GREATER_THAN">Büyüktür (&gt;)</option>
                                        <option value="LESS_THAN">Küçüktür (&lt;)</option>
                                        <option value="EQUALS">Eşittir (=)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Değer</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Örn: 30"
                                        value={formData.threshold}
                                        onChange={e => setFormData({ ...formData, threshold: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr />
                        <h6>Aksiyon</h6>
                        <Row>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Aksiyon Tipi</Form.Label>
                                    <Form.Select
                                        value={formData.actionType}
                                        onChange={e => setFormData({ ...formData, actionType: e.target.value })}
                                    >
                                        <option value="NOTIFICATION">Sadece Bildirim</option>
                                        <option value="SMS">SMS Gönder</option>
                                        <option value="EMAIL">E-posta Gönder</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Hedef (Tel/Email)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Opsiyonel"
                                        value={formData.actionTarget}
                                        onChange={e => setFormData({ ...formData, actionTarget: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button>
                    <Button variant="success" onClick={handleCreate}>Kuralı Oluştur</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AutomationPage;
