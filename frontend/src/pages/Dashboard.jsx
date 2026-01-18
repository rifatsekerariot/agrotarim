import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Settings, RefreshCw, Server, Activity, Thermometer } from 'lucide-react';
import IoTDashboard from '../components/IoTDashboard';
import CustomDashboard from './CustomDashboard';

const Dashboard = () => {
    // Data States
    const [lastUpdated, setLastUpdated] = useState(null);

    // Tab State
    const [activeTab, setActiveTab] = useState('iot'); // Default to IoT

    const navigate = useNavigate();
    const farmId = 1;

    useEffect(() => {
        // Simple timestamp update on mount
        setLastUpdated(new Date());
    }, []);

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <Container fluid className="p-4 dashboard-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1 fw-bold text-dark">
                        <Activity className="me-2 text-success" size={32} />
                        Sera İzleme Paneli
                    </h2>
                    <p className="text-muted mb-0">
                        {lastUpdated ? `Son Güncelleme: ${lastUpdated.toLocaleTimeString()}` : 'Yükleniyor...'}
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-primary" onClick={handleRefresh}>
                        <RefreshCw size={20} className="me-2" /> Yenile
                    </Button>
                    <Button variant="outline-secondary" onClick={() => navigate('/settings')}>
                        <Settings size={20} className="me-2" /> Ayarlar
                    </Button>
                </div>
            </div>

            {/* Tab Navigation */}
            <Card className="shadow-sm border-0 mb-4 bg-white">
                <Card.Body className="p-2">
                    <Nav variant="pills" className="nav-pills-custom" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                        <Nav.Item>
                            <Nav.Link eventKey="iot" className="d-flex align-items-center px-4 py-2 fw-medium">
                                <Server size={18} className="me-2" />
                                Canlı Veriler (IoT)
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="custom" className="d-flex align-items-center px-4 py-2 fw-medium">
                                <Thermometer size={18} className="me-2" />
                                Özel Panel
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Card.Body>
            </Card>

            {/* Tab Content */}
            <div className="fade-in">
                {activeTab === 'iot' && <IoTDashboard />}
                {activeTab === 'custom' && <CustomDashboard />}
            </div>

            <style>{`
                .nav-pills-custom .nav-link {
                    color: #555;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                .nav-pills-custom .nav-link.active {
                    background-color: #198754; /* Success Green */
                    color: white;
                    box-shadow: 0 4px 12px rgba(25, 135, 84, 0.3);
                }
                .fade-in {
                    animation: fadeIn 0.4s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </Container>
    );
};

export default Dashboard;
