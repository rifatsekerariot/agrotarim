import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Badge, Button, Form, Card, Spinner } from 'react-bootstrap';
import axios from 'axios';

const DownlinkLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        deviceId: '',
        status: 'all',
        limit: 50
    });
    const [stats, setStats] = useState({});

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchDevices();
        fetchLogs();
        // Polling her 10 saniyede
        const interval = setInterval(fetchLogs, 10000);
        return () => clearInterval(interval);
    }, [filters]);

    const fetchDevices = async () => {
        try {
            const res = await axios.get('/api/devices', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDevices(res.data);
        } catch (error) {
            console.error('Error fetching devices:', error);
        }
    };

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.deviceId) params.append('deviceId', filters.deviceId);
            if (filters.status !== 'all') params.append('status', filters.status);
            params.append('limit', filters.limit);

            const res = await axios.get(`/api/lora/downlink-logs?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setLogs(res.data.logs || []);
            setStats(res.data.stats || {});
        } catch (error) {
            console.error('Error fetching downlink logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            pending: 'warning',
            sent: 'success',
            failed: 'danger',
            acknowledged: 'info'
        };
        return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('tr-TR');
    };

    return (
        <Container fluid className="p-4">
            <Row className="mb-4">
                <Col>
                    <h2>📡 LoRa Downlink Logları</h2>
                    <p className="text-muted">Cihazlara gönderilen komutların geçmişi</p>
                </Col>
            </Row>

            {/* Stats */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <h6 className="text-muted mb-2">Toplam</h6>
                            <h3>{logs.length}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm bg-success text-white">
                        <Card.Body>
                            <h6 className="mb-2">Gönderilen</h6>
                            <h3>{stats.sent || 0}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm bg-warning">
                        <Card.Body>
                            <h6 className="mb-2">Bekleyen</h6>
                            <h3>{stats.pending || 0}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="border-0 shadow-sm bg-danger text-white">
                        <Card.Body>
                            <h6 className="mb-2">Başarısız</h6>
                            <h3>{stats.failed || 0}</h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    <Row>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Cihaz</Form.Label>
                                <Form.Select
                                    value={filters.deviceId}
                                    onChange={e => setFilters({ ...filters, deviceId: e.target.value })}
                                >
                                    <option value="">Tüm Cihazlar</option>
                                    {devices.filter(d => d.loraServerId).map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Durum</Form.Label>
                                <Form.Select
                                    value={filters.status}
                                    onChange={e => setFilters({ ...filters, status: e.target.value })}
                                >
                                    <option value="all">Tümü</option>
                                    <option value="pending">Bekleyen</option>
                                    <option value="sent">Gönderilen</option>
                                    <option value="failed">Başarısız</option>
                                    <option value="acknowledged">Onaylandı</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Limit</Form.Label>
                                <Form.Select
                                    value={filters.limit}
                                    onChange={e => setFilters({ ...filters, limit: parseInt(e.target.value) })}
                                >
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                    <option value="200">200</option>
                                    <option value="500">500</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3} className="d-flex align-items-end">
                            <Button variant="primary" onClick={fetchLogs} className="w-100">
                                <i className="bi bi-arrow-clockwise me-2"></i>
                                Yenile
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Logs Table */}
            <Card className="border-0 shadow-sm">
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3 text-muted">Loglar yükleniyor...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-inbox fs-1 opacity-50"></i>
                            <p className="mt-3">Henüz downlink komutu yok</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover>
                                <thead className="bg-light">
                                    <tr>
                                        <th>#</th>
                                        <th>Zaman</th>
                                        <th>Cihaz</th>
                                        <th>Komut</th>
                                        <th>HEX</th>
                                        <th>Port</th>
                                        <th>Durum</th>
                                        <th>Tetikleyen</th>
                                        <th>Gönderim</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log, idx) => (
                                        <tr key={log.id}>
                                            <td>{idx + 1}</td>
                                            <td className="small">{formatDate(log.createdAt)}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <i className="bi bi-hdd-network text-primary me-2"></i>
                                                    <span>{log.device?.name || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td>{log.command}</td>
                                            <td>
                                                <code className="bg-light px-2 py-1 rounded">
                                                    {log.hexData}
                                                </code>
                                            </td>
                                            <td>{log.port}</td>
                                            <td>{getStatusBadge(log.status)}</td>
                                            <td>
                                                <Badge bg={log.triggeredBy === 'MANUAL' ? 'secondary' : 'info'}>
                                                    {log.triggeredBy}
                                                </Badge>
                                            </td>
                                            <td className="small text-muted">
                                                {log.sentAt ? formatDate(log.sentAt) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default DownlinkLogsPage;
