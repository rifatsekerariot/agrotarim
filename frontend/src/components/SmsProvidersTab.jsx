import React from 'react';
import { Card, Table, Button, Badge, Modal, Form, Row, Col, Alert } from 'react-bootstrap';
import { Plus, Pencil, Trash2, Send } from 'lucide-react';

const SmsProvidersTab = ({
    providers,
    onEdit,
    onDelete,
    onTest,
    loading,
    onAdd
}) => {
    const [showTestModal, setShowTestModal] = React.useState(false);
    const [testPhone, setTestPhone] = React.useState('');
    const [testingProvider, setTestingProvider] = React.useState(null);
    const [testResult, setTestResult] = React.useState(null);

    const handleTestClick = (provider) => {
        setTestingProvider(provider);
        setShowTestModal(true);
        setTestResult(null);
    };

    const handleSendTest = async () => {
        try {
            setTestResult({ loading: true });
            await onTest(testingProvider.id, testPhone);
            setTestResult({ success: true, message: 'Test SMS gönderildi!' });
        } catch (error) {
            setTestResult({ success: false, message: error.message || 'Test başarısız!' });
        }
    };

    const getPriorityBadge = (priority) => {
        if (priority >= 90) return <Badge bg="success">Yüksek</Badge>;
        if (priority >= 70) return <Badge bg="info">Orta</Badge>;
        return <Badge bg="secondary">Düşük</Badge>;
    };

    return (
        <>
            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-bottom py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="mb-0 fw-bold">SMS Providers</h5>
                            <small className="text-muted">SMS servis sağlayıcı yönetimi</small>
                        </div>
                        <Button variant="success" size="sm" onClick={onAdd}>
                            <Plus size={16} className="me-1" />
                            Provider Ekle
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Yükleniyor...</span>
                            </div>
                        </div>
                    ) : providers.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <p>Henüz SMS provider tanımlanmamış</p>
                            <Button variant="outline-primary" size="sm" onClick={onAdd}>
                                İlk Provider'ı Ekle
                            </Button>
                        </div>
                    ) : (
                        <Table hover responsive className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>Provider</th>
                                    <th>Durum</th>
                                    <th>Öncelik</th>
                                    <th>Endpoint</th>
                                    <th className="text-end">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {providers.map(provider => (
                                    <tr key={provider.id}>
                                        <td>
                                            <div className="fw-bold">{provider.displayName}</div>
                                            <small className="text-muted">{provider.name}</small>
                                        </td>
                                        <td>
                                            {provider.isActive ? (
                                                <Badge bg="success">Aktif</Badge>
                                            ) : (
                                                <Badge bg="secondary">Pasif</Badge>
                                            )}
                                        </td>
                                        <td>{getPriorityBadge(provider.priority)}</td>
                                        <td>
                                            <small className="text-muted font-monospace">
                                                {provider.config?.baseUrl}
                                            </small>
                                        </td>
                                        <td className="text-end">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="me-1"
                                                onClick={() => handleTestClick(provider)}
                                                disabled={!provider.isActive}
                                            >
                                                <Send size={14} />
                                            </Button>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                className="me-1"
                                                onClick={() => onEdit(provider)}
                                            >
                                                <Pencil size={14} />
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => onDelete(provider.id)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Test SMS Modal */}
            <Modal show={showTestModal} onHide={() => setShowTestModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Test SMS Gönder</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {testResult && (
                        <Alert variant={testResult.success ? 'success' : 'danger'}>
                            {testResult.message}
                        </Alert>
                    )}
                    <Form.Group>
                        <Form.Label>Telefon Numarası</Form.Label>
                        <Form.Control
                            type="tel"
                            placeholder="05xxxxxxxxx"
                            value={testPhone}
                            onChange={(e) => setTestPhone(e.target.value)}
                            disabled={testResult?.loading}
                        />
                        <Form.Text className="text-muted">
                            Test SMS'i "{testingProvider?.displayName}" ile gönderilecek
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowTestModal(false)}>
                        İptal
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSendTest}
                        disabled={!testPhone || testResult?.loading}
                    >
                        {testResult?.loading ? 'Gönderiliyor...' : 'Test SMS Gönder'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default SmsProvidersTab;
