import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Card, Button, Spinner, Navbar, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getProvinces, getCenters, getAnalysis } from '../utils/api';
import VerifiableAI from '../components/VerifiableAI';

const Dashboard = () => {
    const [provinces, setProvinces] = useState([]);
    const [centers, setCenters] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedCenter, setSelectedCenter] = useState('');
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        loadProvinces();
    }, []);

    const loadProvinces = async () => {
        try {
            const data = await getProvinces();
            setProvinces(data.sort((a, b) => a.il.localeCompare(b.il)));
        } catch (err) {
            console.error("Error loading provinces:", err);
        }
    };

    const handleProvinceChange = async (e) => {
        const il = e.target.value;
        setSelectedProvince(il);
        setCenters([]);
        setSelectedCenter('');
        setAnalysisData(null);
        if (il) {
            const data = await getCenters(il);
            setCenters(data);
        }
    };

    const handleCenterChange = (e) => {
        setSelectedCenter(e.target.value);
        setAnalysisData(null);
    };

    const handleAnalyze = async () => {
        if (!selectedCenter) return;
        setLoading(true);
        try {
            // Find the full center object to get the station ID (merkezId)
            // Note: The structure from MGM might vary, using 'merkezId' as per previous analysis
            const centerObj = centers.find(c => c.ilce === selectedCenter || c.merkezId.toString() === selectedCenter);
            const stationId = centerObj ? centerObj.merkezId : selectedCenter;

            const data = await getAnalysis(stationId);
            setAnalysisData(data);
        } catch (err) {
            console.error("Analysis Error:", err);
            alert("Veri çekilemedi: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <>
            <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
                <Container>
                    <Navbar.Brand href="#home">AgroMeta</Navbar.Brand>
                    <Nav className="ms-auto">
                        <Nav.Link disabled>Merhaba, {user.username}</Nav.Link>
                        <Button variant="outline-light" size="sm" onClick={handleLogout}>Çıkış</Button>
                    </Nav>
                </Container>
            </Navbar>

            <Container>
                <Row className="mb-4">
                    <Col md={12}>
                        <Card>
                            <Card.Body>
                                <Card.Title>Konum Seçimi</Card.Title>
                                <Row>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>İl</Form.Label>
                                            <Form.Select value={selectedProvince} onChange={handleProvinceChange}>
                                                <option value="">Seçiniz...</option>
                                                {provinces.map(p => (
                                                    <option key={p.il} value={p.il}>{p.il}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>İlçe / İstasyon</Form.Label>
                                            <Form.Select value={selectedCenter} onChange={handleCenterChange} disabled={!selectedProvince}>
                                                <option value="">Seçiniz...</option>
                                                {centers.map(c => (
                                                    <option key={c.merkezId} value={c.merkezId}>{c.ilce || c.il}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4} className="d-flex align-items-end">
                                        <Button
                                            variant="primary"
                                            onClick={handleAnalyze}
                                            disabled={!selectedCenter || loading}
                                            className="w-100 mb-3"
                                        >
                                            {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Analiz Et'}
                                        </Button>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {analysisData && (
                    <Row>
                        <Col md={12}>
                            <VerifiableAI riskData={analysisData} />
                        </Col>
                    </Row>
                )}
            </Container>
        </>
    );
};

export default Dashboard;
