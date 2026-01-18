
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Tabs, Tab, Dropdown, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getProvinces, getCenters, getAnalysis, getDailyForecast, getHourlyForecast, getAgriculturalForecast, getMeteoWarnings } from '../utils/api';
import VerifiableAI from '../components/VerifiableAI';
import DailyForecast from '../components/DailyForecast';
import HourlyForecast from '../components/HourlyForecast';
import AgriculturalForecast from '../components/AgriculturalForecast';
import MeteoWarning from '../components/MeteoWarning';
import IoTDashboard from '../components/IoTDashboard';
import { Activity, MapPin, Calendar, RefreshCcw, Settings } from 'lucide-react';

const Dashboard = () => {
    const [provinces, setProvinces] = useState([]);
    const [centers, setCenters] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedCenter, setSelectedCenter] = useState('');
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [showLocationModal, setShowLocationModal] = useState(false);

    // Data States
    const [analysisData, setAnalysisData] = useState(null);
    const [dailyData, setDailyData] = useState(null);
    const [hourlyData, setHourlyData] = useState(null);
    const [agriData, setAgriData] = useState(null);
    const [warnings, setWarnings] = useState(null);
    const [expertAdvice, setExpertAdvice] = useState(null);

    // Tab State
    const [activeTab, setActiveTab] = useState('iot');

    const navigate = useNavigate();
    const farmId = 1;

    useEffect(() => {
        const fetchProvinces = async () => {
            // ... existing logic ...
            try {
                const data = await getProvinces();
                data.sort((a, b) => a.il.localeCompare(b.il, 'tr'));
                setProvinces(data);
            } catch (error) { console.error('Error fetching provinces:', error); }
        };
        fetchProvinces();
    }, []);

    const handleProvinceChange = async (e) => {
        const province = e.target.value;
        setSelectedProvince(province);
        setCenters([]);
        setSelectedCenter('');
        if (province) {
            try {
                const data = await getCenters(province);
                setCenters(data);
            } catch (error) { console.error('Error fetching centers:', error); }
        }
    };

    const handleAnalyze = async () => {
        if (!selectedCenter) return;
        setLoading(true);
        // ... Reset data states ...
        setAnalysisData(null); setDailyData(null); setHourlyData(null); setAgriData(null); setWarnings(null);

        try {
            const centerObj = centers.find(c => c.merkezId.toString() === selectedCenter);
            if (!centerObj) { alert("Merkez bilgisi bulunamadı!"); setLoading(false); return; }

            const [analysis, daily, hourly, agri, warn] = await Promise.all([
                getAnalysis(centerObj.merkezId),
                getDailyForecast(centerObj.gunlukTahminIstNo),
                getHourlyForecast(centerObj.saatlikTahminIstNo),
                getAgriculturalForecast(centerObj.merkezId),
                getMeteoWarnings(centerObj.merkezId)
            ]);

            setAnalysisData(analysis);
            setDailyData(daily);
            setHourlyData(hourly);
            setAgriData(agri);
            setWarnings(warn);
            setLastUpdated(new Date());
            setShowLocationModal(false); // Close modal if open

        } catch (error) {
            console.error('Error fetching analysis:', error);
            alert('Veri çekilemedi. Lütfen tekrar deneyin.');
        } finally { setLoading(false); }
    };

    // Helper to get location name
    const getLocationName = () => {
        if (!selectedProvince) return 'Konum Seçilmedi';
        const center = centers.find(c => c.merkezId.toString() === selectedCenter);
        return `${selectedProvince}${center ? `, ${center.ilce}` : ''}`;
    };

    return (
        <Container fluid className="py-4 px-4 bg-light min-vh-100">
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4 custom-tabs border-bottom-0">
                <Tab eventKey="iot" title={<><Activity size={18} className="me-2" />Eyleme Geçilebilir Analiz</>}>
                    <IoTDashboard farmId={farmId} dailyData={dailyData} />
                </Tab>

                <Tab eventKey="forecast" title="🌦️ MGM Resmi Tahminler">
                    <Container fluid className="px-0">
                        {/* 1. Sleek Header Bar */}
                        <div className="mgm-header-bar mb-4">
                            <div className="d-flex align-items-center">
                                <div className="bg-danger bg-opacity-10 p-3 rounded-circle me-3">
                                    <MapPin size={24} className="text-danger" />
                                </div>
                                <div>
                                    <h4 className="fw-bold text-dark mb-0">{getLocationName()}</h4>
                                    {lastUpdated && (
                                        <small className="text-muted d-flex align-items-center">
                                            <Calendar size={14} className="me-1" />
                                            Son Analiz: {lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </small>
                                    )}
                                </div>
                            </div>

                            <div className="d-flex gap-2">
                                <Button variant="outline-primary" onClick={handleAnalyze} disabled={!selectedCenter || loading} className="border-0 shadow-sm bg-white text-primary">
                                    <RefreshCcw size={18} className={`me-2 ${loading ? 'spin-anim' : ''}`} />
                                    {loading ? 'Yenileniyor...' : 'Yenile'}
                                </Button>
                                <Button variant="dark" onClick={() => setShowLocationModal(true)} className="shadow-sm">
                                    <Settings size={18} className="me-2" /> Konum Değiştir
                                </Button>
                            </div>
                        </div>

                        {/* Location Selection Modal (Hidden by default now) */}
                        <Modal show={showLocationModal} onHide={() => setShowLocationModal(false)} centered>
                            <Modal.Header closeButton>
                                <Modal.Title>Konum Seçimi</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <Form.Group className="mb-3">
                                    <Form.Label>İl</Form.Label>
                                    <Form.Select value={selectedProvince} onChange={handleProvinceChange}>
                                        <option value="">İl Seçiniz</option>
                                        {provinces.map(p => <option key={p.il} value={p.il}>{p.il}</option>)}
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>İlçe/Merkez</Form.Label>
                                    <Form.Select value={selectedCenter} onChange={(e) => setSelectedCenter(e.target.value)} disabled={!selectedProvince}>
                                        <option value="">İlçe Seçiniz</option>
                                        {centers.map(c => <option key={c.merkezId} value={c.merkezId}>{c.ilce || c.il}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="success" onClick={handleAnalyze} disabled={!selectedCenter || loading} className="w-100">
                                    Analiz Et ve Kaydet
                                </Button>
                            </Modal.Footer>
                        </Modal>

                        {/* Main Content: Balanced 2-Column Layout */}
                        {(analysisData || dailyData || hourlyData) ? (
                            <Row>
                                {/* Left Column: Official Warnings & Agri Data */}
                                <Col lg={6} className="mb-4">
                                    <h6 className="text-uppercase text-muted fw-bold mb-3 small">Meteorolojik Uyarılar ve Tarım</h6>
                                    <MeteoWarning data={warnings} dailyData={dailyData} alerts={expertAdvice?.alerts} />
                                    <AgriculturalForecast data={agriData} />

                                    {/* AI Insight Card (Mock) */}
                                    {analysisData && (
                                        <VerifiableAI riskData={analysisData} dailyData={dailyData} cropType="Genel" />
                                    )}
                                </Col>

                                {/* Right Column: Detailed Graphic Forecasts */}
                                <Col lg={6}>
                                    <h6 className="text-uppercase text-muted fw-bold mb-3 small">Hava Tahmin Raporları</h6>

                                    <DailyForecast data={dailyData} />

                                    <div className="mt-4">
                                        <Tabs defaultActiveKey="hourly" className="custom-tabs mb-3">
                                            <Tab eventKey="hourly" title="Saatlik Tahmin & İlaçlama">
                                                <HourlyForecast data={hourlyData} />
                                            </Tab>
                                        </Tabs>
                                    </div>
                                </Col>
                            </Row>
                        ) : (
                            <div className="text-center py-5 text-muted">
                                <div className="mb-3 opacity-50"><MapPin size={48} /></div>
                                <h5>Konum Seçimi Yapın</h5>
                                <p>Detaylı hava durumu ve zirai analiz için lütfen konum seçin.</p>
                                <Button variant="primary" onClick={() => setShowLocationModal(true)}>Konum Seç</Button>
                            </div>
                        )}
                    </Container>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default Dashboard;
