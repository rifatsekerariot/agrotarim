import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Thermometer, Droplets, Wind } from 'lucide-react';
import api from '../utils/api';

const DeviceDetail = () => {
    const { serial } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // ✅ FIX: Use api instance for automatic auth headers
                const res = await api.get(`/telemetry/history/${serial}`);
                setData(res.data);
            } catch (err) {
                setError(err.response?.data?.error || "Veri çekilemedi.");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [serial]);

    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!data) return <Alert variant="warning">Veri bulunamadı.</Alert>;

    const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <Container className="py-4">
            <Button variant="outline-secondary" className="mb-3" onClick={() => navigate(-1)}>
                <ArrowLeft size={16} /> Geri Dön
            </Button>

            <h2 className="mb-4 text-success fw-bold">
                {data.deviceName} <span className="text-muted fs-5">({serial})</span>
            </h2>

            {/* AIR TEMPERATURE */}
            <Row className="mb-4">
                <Col md={12}>
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-white fw-bold text-danger">
                            <Thermometer size={18} /> Sıcaklık (°C) - Son 24 Saat
                        </Card.Header>
                        <Card.Body style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.history.t_air}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="timestamp" tickFormatter={formatTime} />
                                    <YAxis domain={['auto', 'auto']} />
                                    <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} />
                                    <Legend />
                                    <Line type="monotone" dataKey="value" stroke="#dc3545" name="Sıcaklık" dot={false} strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* HUMIDITY & MOISTURE */}
            <Row>
                <Col md={6} className="mb-4">
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Header className="bg-white fw-bold text-info">
                            <Wind size={18} /> Hava Nemi (%)
                        </Card.Header>
                        <Card.Body style={{ height: 250 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.history.h_air}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="timestamp" tickFormatter={formatTime} />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} />
                                    <Line type="monotone" dataKey="value" stroke="#0dcaf0" name="Nem" dot={false} strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} className="mb-4">
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Header className="bg-white fw-bold text-success">
                            <Droplets size={18} /> Toprak Nemi (%)
                        </Card.Header>
                        <Card.Body style={{ height: 250 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.history.m_soil}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="timestamp" tickFormatter={formatTime} />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} />
                                    <Line type="monotone" dataKey="value" stroke="#198754" name="T. Nemi" dot={false} strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default DeviceDetail;
