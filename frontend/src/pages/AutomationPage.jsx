import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form, Alert, Toast, ToastContainer } from 'react-bootstrap';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { Wifi, Thermometer, Droplets, Activity, Bell, Trash2, Plus, Edit } from 'lucide-react';

const AutomationPage = () => {
    const token = localStorage.getItem('token') || '';
    const [devices, setDevices] = useState([]);
    const [rules, setRules] = useState([]);
    const [logs, setLogs] = useState([]);
    const [farmId, setFarmId] = useState(1); // Default farm ID 1
    const [showModal, setShowModal] = useState(false);

    // Edit & Notification State
    const [editId, setEditId] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [lastLogId, setLastLogId] = useState(0);
    const [toastMessage, setToastMessage] = useState({ title: '', msg: '', variant: 'info' });

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        deviceId: '',
        sensorCode: 'temperature',
        condition: 'GREATER_THAN',
        threshold: '',
        threshold2: '',
        coolDownMinutes: '60',
        repeatIntervalMinutes: '5',
        maxRepeatMinutes: '10',
        autoResolve: true,
        normalCheckEnabled: true,
        // ELSE actions
        elseActionType: 'NOTIFICATION',
        elseActionTarget: '',
        elseHexCommand: '',
        elseCommandName: '',
        elseCommandPort: '1'
    });

    // Multiple THEN actions (array)
    const [actions, setActions] = useState([{
        type: 'NOTIFICATION',
        target: '',
        hexCommand: '',
        commandName: '',
        commandPort: '1'
    }]);

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
            const newLogs = logsRes.data;
            setLogs(newLogs);

            // Toast Notification Logic
            if (newLogs.length > 0) {
                const latest = newLogs[0];
                // If we have a new log (ID is different/larger)
                if (lastLogId !== 0 && latest.id !== lastLogId) {
                    setToastMessage({
                        title: latest.rule.name,
                        msg: `${latest.message} (${new Date(latest.createdAt).toLocaleTimeString()})`,
                        variant: 'danger'
                    });
                    setShowToast(true);
                }
                // Update tracking ID
                if (latest.id !== lastLogId) setLastLogId(latest.id);
            }
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

    const handleEdit = (rule) => {
        setEditId(rule.id);
        const action = rule.actions[0] || { type: 'NOTIFICATION', target: '' };

        // Parse payload for CONTROL_DEVICE
        let hexCommand = '', commandName = '', commandPort = '1';
        if (action.type === 'CONTROL_DEVICE' && action.payload) {
            const payload = typeof action.payload === 'string' ? JSON.parse(action.payload) : action.payload;
            hexCommand = payload.hexData || '';
            commandName = payload.command || '';
            commandPort = String(payload.port || 1);
        }

        setFormData({
            name: rule.name,
            deviceId: rule.deviceId,
            sensorCode: rule.sensorCode,
            condition: rule.condition,
            threshold: rule.threshold,
            threshold2: rule.threshold2 || '',
            coolDownMinutes: String(rule.coolDownMinutes || 60),
            actionType: action.type,
            actionTarget: action.target || '',
            hexCommand,
            commandName,
            commandPort
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.deviceId || !formData.threshold) {
            alert("Lütfen tüm zorunlu alanları (Ad, Cihaz, Eşik Değer) doldurun.");
            return;
        }

        // Validate CONTROL_DEVICE
        if (formData.actionType === 'CONTROL_DEVICE') {
            if (!formData.actionTarget) {
                alert("Lütfen hedef cihaz seçin.");
                return;
            }
            if (!formData.hexCommand || !/^[0-9A-Fa-f]+$/.test(formData.hexCommand)) {
                alert("Lütfen geçerli bir HEX komut girin (örn: 01FF3A).");
                return;
            }
        }

        try {
            // Prepare actions array with optional payload
            const preparedActions = actions.map(action => {
                const preparedAction = {
                    type: action.type,
                    target: action.target
                };

                // Add payload for CONTROL_DEVICE
                if (action.type === 'CONTROL_DEVICE') {
                    preparedAction.payload = {
                        command: action.commandName || 'Custom Command',
                        hexData: action.hexCommand.toUpperCase(),
                        port: parseInt(action.commandPort) || 1
                    };
                }

                return preparedAction;
            });

            // Prepare ELSE action
            let elseAction = null;
            if (formData.normalCheckEnabled && formData.elseActionType) {
                elseAction = {
                    type: formData.elseActionType,
                    target: formData.elseActionTarget
                };

                // Add payload for ELSE CONTROL_DEVICE
                if (formData.elseActionType === 'CONTROL_DEVICE') {
                    elseAction.payload = {
                        command: formData.elseCommandName || 'Else Command',
                        hexData: formData.elseHexCommand.toUpperCase(),
                        port: parseInt(formData.elseCommandPort) || 1
                    };
                }
            }

            const payload = {
                farmId,
                name: formData.name,
                deviceId: formData.deviceId,
                sensorCode: formData.sensorCode,
                condition: formData.condition,
                threshold: parseFloat(formData.threshold),
                threshold2: formData.threshold2 ? parseFloat(formData.threshold2) : null,
                coolDownMinutes: parseInt(formData.coolDownMinutes) || 60,
                repeatIntervalMinutes: parseInt(formData.repeatIntervalMinutes) || 5,
                maxRepeatMinutes: parseInt(formData.maxRepeatMinutes) || 10,
                autoResolve: formData.autoResolve,
                normalCheckEnabled: formData.normalCheckEnabled,
                actions: preparedActions,
                elseActions: elseAction ? [elseAction] : []
            };

            if (editId) {
                await axios.put(`/api/automation/rules/${editId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/automation/rules', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            setShowModal(false);
            setEditId(null);
            fetchData();

            // Reset form
            setFormData({
                name: '',
                deviceId: '',
                sensorCode: 'temperature',
                condition: 'GREATER_THAN',
                threshold: '',
                threshold2: '',
                coolDownMinutes: '60',
                repeatIntervalMinutes: '5',
                maxRepeatMinutes: '10',
                autoResolve: true,
                normalCheckEnabled: true,
                elseActionType: 'NOTIFICATION',
                elseActionTarget: '',
                elseHexCommand: '',
                elseCommandName: '',
                elseCommandPort: '1'
            });

            // Reset actions array
            setActions([{
                type: 'NOTIFICATION',
                target: '',
                hexCommand: '',
                commandName: '',
                commandPort: '1'
            }]);
        } catch (error) {
            console.error("Rule Save Error Details:", error);
            const serverError = error.response?.data?.error || error.response?.data?.details || error.message;
            alert("İşlem Başarısız: " + JSON.stringify(serverError));
        }
    };

    // Action array helpers
    const handleAddAction = () => {
        setActions([...actions, {
            type: 'NOTIFICATION',
            target: '',
            hexCommand: '',
            commandName: '',
            commandPort: '1'
        }]);
    };

    const handleRemoveAction = (index) => {
        if (actions.length > 1) {
            setActions(actions.filter((_, i) => i !== index));
        }
    };

    const handleUpdateAction = (index, field, value) => {
        const newActions = [...actions];
        newActions[index][field] = value;
        setActions(newActions);
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
                            <Button variant="primary" size="sm" onClick={() => {
                                setEditId(null);
                                setFormData({
                                    name: '',
                                    deviceId: '',
                                    sensorCode: 'temperature',
                                    condition: 'GREATER_THAN',
                                    threshold: '',
                                    actionType: 'NOTIFICATION',
                                    actionTarget: ''
                                });
                                setShowModal(true);
                            }}>
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
                                                <Button variant="link" className="text-primary p-0 me-2" onClick={() => handleEdit(rule)}>
                                                    <Edit size={18} />
                                                </Button>
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

            {/* Create/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editId ? 'Kuralı Düzenle' : 'Yeni Otomasyon Kuralı'}</Modal.Title>
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
                                        <option value="">Sensör Seç...</option>
                                        {(() => {
                                            const selectedDevice = devices.find(d => d.id == formData.deviceId);
                                            if (selectedDevice && selectedDevice.sensors && selectedDevice.sensors.length > 0) {
                                                return selectedDevice.sensors.map(s => (
                                                    <option key={s.id} value={s.code}>
                                                        {s.name} ({s.type} - {s.unit})
                                                    </option>
                                                ));
                                            } else {
                                                // Fallback defaults if no sensors defined (e.g. for simple devices)
                                                return (
                                                    <>
                                                        <option value="temperature">Sıcaklık (°C)</option>
                                                        <option value="humidity">Nem (%)</option>
                                                        <option value="battery">Batarya (%)</option>
                                                    </>
                                                );
                                            }
                                        })()}
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
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0">⚡ THEN: Aksiyonlar ({actions.length})</h6>
                            <Button size="sm" variant="success" onClick={handleAddAction}>
                                <i className="bi bi-plus-circle me-1"></i>
                                Aksiyon Ekle
                            </Button>
                        </div>

                        {/* Actions Loop */}
                        {actions.map((action, index) => (
                            <Card key={index} className="mb-3 border-primary">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="text-primary mb-0">Aksiyon #{index + 1}</h6>
                                        {actions.length > 1 && (
                                            <Button
                                                size="sm"
                                                variant="outline-danger"
                                                onClick={() => handleRemoveAction(index)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        )}
                                    </div>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Aksiyon Tipi</Form.Label>
                                                <Form.Select
                                                    value={action.type}
                                                    onChange={e => handleUpdateAction(index, 'type', e.target.value)}
                                                >
                                                    <option value="NOTIFICATION">Sadece Bildirim</option>
                                                    <option value="SMS">SMS Gönder</option>
                                                    <option value="EMAIL">E-posta Gönder</option>
                                                    <option value="CONTROL_DEVICE">🚀 Cihaz Kontrol (Lo Ra)</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>

                                        {/* Conditional Target Field */}
                                        {action.type === 'CONTROL_DEVICE' ? (
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Hedef Cihaz *</Form.Label>
                                                    <Form.Select
                                                        value={action.target}
                                                        onChange={e => handleUpdateAction(index, 'target', e.target.value)}
                                                    >
                                                        <option value="">Cihaz Seç...</option>
                                                        {devices.map(d => (
                                                            <option key={d.id} value={d.id}>{d.name}</option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                        ) : (
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        {action.type === 'SMS' ? 'Telefon Numarası' :
                                                            action.type === 'EMAIL' ? 'E-posta Adresi' :
                                                                'Hedef (Opsiyonel)'}
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder={action.type === 'SMS' ? '5XX...' : 'ornek@email.com'}
                                                        disabled={action.type === 'NOTIFICATION'}
                                                        value={action.target}
                                                        onChange={e => handleUpdateAction(index, 'target', e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        )}
                                    </Row>

                                    {/* CONTROL_DEVICE Extended UI */}
                                    {action.type === 'CONTROL_DEVICE' && (
                                        <div className="bg-light p-3 rounded mt-3">
                                            <h6 className="text-primary mb-3">⚡ LoRa Komut Ayarları</h6>

                                            <Row className="mb-3">
                                                <Col md={8}>
                                                    <Form.Group>
                                                        <Form.Label>Komut Template (Opsiyonel)</Form.Label>
                                                        <Form.Select onChange={e => {
                                                            const templates = {
                                                                '01FF01': 'Vana Aç',
                                                                '01FF00': 'Vana Kapat',
                                                                '02FF01': 'LED Aç',
                                                                '02FF00': 'LED Kapat'
                                                            };
                                                            if (e.target.value) {
                                                                const newActions = [...actions];
                                                                newActions[index].hexCommand = e.target.value;
                                                                newActions[index].commandName = templates[e.target.value];
                                                                setActions(newActions);
                                                            }
                                                        }}>
                                                            <option value="">Manuel gir...</option>
                                                            <option value="01FF01">🟢 Vana Aç (01FF01)</option>
                                                            <option value="01FF00">🔴 Vana Kapat (01FF00)</option>
                                                            <option value="02FF01">💡 LED Aç (02FF01)</option>
                                                            <option value="02FF00">🌙 LED Kapat (02FF00)</option>
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={4}>
                                                    <Form.Group>
                                                        <Form.Label>Port</Form.Label>
                                                        <Form.Control
                                                            type="number"
                                                            value={action.commandPort}
                                                            onChange={e => handleUpdateAction(index, 'commandPort', e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md={8}>
                                                    <Form.Group>
                                                        <Form.Label>HEX Komut *</Form.Label>
                                                        <Form.Control
                                                            style={{ fontFamily: 'monospace', fontSize: '1.1em', letterSpacing: '2px' }}
                                                            placeholder="01FF3A"
                                                            value={action.hexCommand}
                                                            onChange={e => handleUpdateAction(index, 'hexCommand', e.target.value.toUpperCase())}
                                                        />
                                                        <Form.Text className="text-muted">
                                                            Hex format (örn: 01FF3A). Sadece 0-9, A-F karakterleri.
                                                        </Form.Text>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={4}>
                                                    <Form.Group>
                                                        <Form.Label>Komut Adı</Form.Label>
                                                        <Form.Control
                                                            placeholder="Sulama Aç"
                                                            value={action.commandName}
                                                            onChange={e => handleUpdateAction(index, 'commandName', e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        ))}

                        {/* ELSE Actions Section */}
                        <hr />
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h6 className="mb-0">🔄 ELSE: Normal Durunda (İsteğe Bağlı)</h6>
                            <Form.Check
                                type="switch"
                                label="Aktif"
                                checked={formData.normalCheckEnabled}
                                onChange={e => setFormData({ ...formData, normalCheckEnabled: e.target.checked })}
                            />
                        </div>

                        {formData.normalCheckEnabled && (
                            <div className="bg-light p-3 rounded mb-3">
                                <p className="text-muted small mb-3">
                                    Sensör değeri normale döndüğünde (koşul sağlanmadığında) bu aksiyonlar çalışacak.
                                </p>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>ELSE Aksiyon Tipi</Form.Label>
                                            <Form.Select
                                                value={formData.elseActionType}
                                                onChange={e => setFormData({ ...formData, elseActionType: e.target.value })}
                                            >
                                                <option value="NOTIFICATION">Platform Bildirimi</option>
                                                <option value="SMS">SMS Gönder</option>
                                                <option value="EMAIL">E-posta Gönder</option>
                                                <option value="CONTROL_DEVICE">🚀 Cihaz Kontrol (LoRa)</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    {formData.elseActionType === 'CONTROL_DEVICE' ? (
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Hedef Cihaz</Form.Label>
                                                <Form.Select
                                                    value={formData.elseActionTarget}
                                                    onChange={e => setFormData({ ...formData, elseActionTarget: e.target.value })}
                                                >
                                                    <option value="">Cihaz Seç...</option>
                                                    {devices.map(d => (
                                                        <option key={d.id} value={d.id}>{d.name}</option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    ) : (
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>
                                                    {formData.elseActionType === 'SMS' ? 'Telefon Numarası' :
                                                        formData.elseActionType === 'EMAIL' ? 'E-posta Adresi' : 'Hedef'}
                                                </Form.Label>
                                                <Form.Control
                                                    placeholder={formData.elseActionType === 'SMS' ? '+905551234567' : 'admin@example.com'}
                                                    value={formData.elseActionTarget}
                                                    onChange={e => setFormData({ ...formData, elseActionTarget: e.target.value })}
                                                />
                                            </Form.Group>
                                        </Col>
                                    )}
                                </Row>

                                {/* ELSE CONTROL_DEVICE HEX */}
                                {formData.elseActionType === 'CONTROL_DEVICE' && (
                                    <Row>
                                        <Col md={8}>
                                            <Form.Group>
                                                <Form.Label>ELSE HEX Komut *</Form.Label>
                                                <Form.Control
                                                    style={{ fontFamily: 'monospace', fontSize: '1.1em', letterSpacing: '2px' }}
                                                    placeholder="01FF00"
                                                    value={formData.elseHexCommand}
                                                    onChange={e => setFormData({ ...formData, elseHexCommand: e.target.value.toUpperCase() })}
                                                />
                                                <Form.Text className="text-muted">
                                                    Normal durumda gönderilecek komut (örn: Vana Kapat = 01FF00)
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Komut Adı</Form.Label>
                                                <Form.Control
                                                    placeholder="Vana Kapat"
                                                    value={formData.elseCommandName}
                                                    onChange={e => setFormData({ ...formData, elseCommandName: e.target.value })}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                )}
                            </div>
                        )}

                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button>
                    <Button variant="success" onClick={handleSave}>{editId ? 'Güncelle' : 'Kuralı Oluştur'}</Button>
                </Modal.Footer>
            </Modal>

            {/* Notification Toast */}
            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
                <Toast onClose={() => setShowToast(false)} show={showToast} delay={5000} autohide bg={toastMessage.variant}>
                    <Toast.Header>
                        <Bell size={18} className="me-2 text-danger" />
                        <strong className="me-auto">{toastMessage.title}</strong>
                        <small>Şimdi</small>
                    </Toast.Header>
                    <Toast.Body className={toastMessage.variant === 'danger' ? 'text-white' : ''}>
                        {toastMessage.msg}
                    </Toast.Body>
                </Toast>
            </ToastContainer>
        </Container>
    );
};

export default AutomationPage;
