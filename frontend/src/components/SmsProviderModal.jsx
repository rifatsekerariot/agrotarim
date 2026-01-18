import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Badge } from 'react-bootstrap';

const SmsProviderModal = ({ show, onHide, provider, onSave }) => {
    const isEdit = !!provider;
    const [formData, setFormData] = useState({
        name: provider?.name || 'netgsm',
        displayName: provider?.displayName || '',
        priority: provider?.priority || 50,
        isActive: provider?.isActive || false,
        username: '',
        password: '',
        apiKey: ''
    });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const providerTemplates = {
        netgsm: {
            name: 'netgsm',
            displayName: 'NetGSM',
            config: {
                baseUrl: 'https://api.netgsm.com.tr',
                authType: 'basic',
                credentialsInPayload: true,
                sendEndpoint: '/sms/send/get',
                httpMethod: 'GET',
                payloadFormat: 'form',
                fieldMappings: {
                    sender: 'header',
                    recipient: 'gsmno',
                    message: 'message'
                },
                successPattern: '^00'
            }
        },
        mutlucell: {
            name: 'mutlucell',
            displayName: 'Mutlucell SMS',
            config: {
                baseUrl: 'https://smsgw.mutlucell.com.tr',
                authType: 'basic',
                sendEndpoint: '/smsgw/api/sendsms',
                httpMethod: 'POST',
                contentType: 'application/json',
                payloadFormat: 'json',
                fieldMappings: {
                    sender: 'originator',
                    recipient: 'recipients',
                    message: 'body'
                },
                countryCode: '+90'
            }
        },
        verimor: {
            name: 'verimor',
            displayName: 'Verimor',
            config: {
                baseUrl: 'https://sms.verimor.com.tr/v2',
                authType: 'basic',
                sendEndpoint: '/send.json',
                httpMethod: 'POST',
                contentType: 'application/json',
                payloadFormat: 'json',
                fieldMappings: {
                    sender: 'source_addr',
                    recipient: 'messages[0].dest',
                    message: 'messages[0].msg'
                },
                countryCode: '90'
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.displayName) {
            setError('Provider adı gerekli');
            return;
        }

        if (!isEdit && !formData.username) {
            setError('Kullanıcı adı gerekli');
            return;
        }

        setSaving(true);
        try {
            const template = providerTemplates[formData.name] || providerTemplates.netgsm;

            const payload = {
                name: formData.name,
                displayName: formData.displayName,
                priority: parseInt(formData.priority),
                isActive: formData.isActive,
                config: {
                    ...template.config,
                    credentials: {
                        username: formData.username || undefined,
                        password: formData.password || undefined,
                        apiKey: formData.apiKey || undefined
                    }
                }
            };

            await onSave(payload);
            onHide();
        } catch (err) {
            setError(err.message || 'Kaydetme başarısız');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEdit ? 'SMS Provider Düzenle' : 'Yeni SMS Provider'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Row className="g-3">
                        {!isEdit && (
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Provider Seç</Form.Label>
                                    <Form.Select
                                        value={formData.name}
                                        onChange={(e) => {
                                            const selected = e.target.value;
                                            const template = providerTemplates[selected];
                                            setFormData({
                                                ...formData,
                                                name: selected,
                                                displayName: template.displayName
                                            });
                                        }}
                                    >
                                        <option value="netgsm">NetGSM</option>
                                        <option value="mutlucell">Mutlucell</option>
                                        <option value="verimor">Verimor</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        )}

                        <Col md={8}>
                            <Form.Group>
                                <Form.Label>Provider Adı</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    placeholder="Örn: NetGSM Ana Hesap"
                                    required
                                />
                            </Form.Group>
                        </Col>

                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Öncelik</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    min="0"
                                    max="100"
                                />
                                <Form.Text className="text-muted">
                                    Yüksek = Öncelikli
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={12}>
                            <hr />
                            <h6 className="mb-3">Kimlik Bilgileri</h6>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Kullanıcı Adı</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder={isEdit ? "Değiştirmek için girin" : "Kullanıcı adı"}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Şifre</Form.Label>
                                <Form.Control
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={isEdit ? "Değiştirmek için girin" : "Şifre"}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>API Key (Opsiyonel)</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.apiKey}
                                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                    placeholder="Bazı providerlar için gerekli"
                                />
                            </Form.Group>
                        </Col>

                        <Col md={12}>
                            <Form.Check
                                type="switch"
                                label={<><Badge bg={formData.isActive ? 'success' : 'secondary'}>
                                    {formData.isActive ? 'Aktif' : 'Pasif'}
                                </Badge> Bu provider'ı kullan</>}
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            />
                            <Form.Text className="text-muted">
                                Aktif provider'lar SMS göndermek için kullanılır
                            </Form.Text>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={saving}>
                        İptal
                    </Button>
                    <Button variant="primary" type="submit" disabled={saving}>
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default SmsProviderModal;
