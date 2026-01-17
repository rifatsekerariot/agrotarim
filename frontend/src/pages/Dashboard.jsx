import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Spinner, Tabs, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getProvinces, getCenters, getAnalysis, getDailyForecast, getHourlyForecast, getAgriculturalForecast, getMeteoWarnings } from '../utils/api';
import VerifiableAI from '../components/VerifiableAI';
import DailyForecast from '../components/DailyForecast';
import HourlyForecast from '../components/HourlyForecast';
import AgriculturalForecast from '../components/AgriculturalForecast';
import MeteoWarning from '../components/MeteoWarning';
import IoTDashboard from '../components/IoTDashboard'; // New IoT Component
import { Activity } from 'lucide-react';

const Dashboard = () => {
    const [provinces, setProvinces] = useState([]);
    const [centers, setCenters] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedCenter, setSelectedCenter] = useState('');

    const [loading, setLoading] = useState(false);

    // Data States
    const [analysisData, setAnalysisData] = useState(null);
    const [dailyData, setDailyData] = useState(null);
    const [hourlyData, setHourlyData] = useState(null);
    const [agriData, setAgriData] = useState(null);
    const [warnings, setWarnings] = useState(null);

    // Tab State
    const [activeTab, setActiveTab] = useState('iot'); // Default to IoT for the new product

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // For MVP, assuming User has Farm ID 1
    const farmId = 1;

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const data = await getProvinces();
                // Sort provinces alphabetically with Turkish locale support
                data.sort((a, b) => a.il.localeCompare(b.il, 'tr'));
                setProvinces(data);
            } catch (error) {
                console.error('Error fetching provinces:', error);
            }
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
            } catch (error) {
                console.error('Error fetching centers:', error);
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleAnalyze = async () => {
        if (!selectedCenter) return;
        setLoading(true);

        // Reset previous data
        setAnalysisData(null);
        setDailyData(null);
        setHourlyData(null);
        setAgriData(null);
        setWarnings(null);

        try {
            const centerObj = centers.find(c => c.merkezId.toString() === selectedCenter);
            if (!centerObj) {
                alert("Merkez bilgisi bulunamadı!");
                setLoading(false);
                return;
            }

            // Fetch all data in parallel
            // Note: Use specific station IDs available in centerObj
            // gunlukTahminIstNo, saatlikTahminIstNo, sondurumIstNo (using sondurum for analysis usually)

            const stationId = centerObj.sondurumIstNo;
            const dailyStationId = centerObj.gunlukTahminIstNo;
            const hourlyStationId = centerObj.saatlikTahminIstNo;
            const centerId = centerObj.merkezId;

            const [analysis, daily, hourly, agri, warn] = await Promise.all([
                // Analysis (Latest Status) uses merkezId in MGM API
                getAnalysis(centerId),
                getDailyForecast(dailyStationId),
                getHourlyForecast(hourlyStationId),
                // Agricultural forecast uses merkezId (passed as istNo)
                getAgriculturalForecast(centerId),
                getMeteoWarnings(centerId)
            ]);

            setAnalysisData(analysis);
            setDailyData(daily);
            setHourlyData(hourly);
            setAgriData(agri);
            setWarnings(warn);

        } catch (error) {
            console.error('Error fetching analysis:', error);
            alert('Veri çekilemedi. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-4">


            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
                variant="pills"
            >
                <Tab eventKey="iot" title={<><Activity size={18} className="me-2" />Genel Durum</>}>
                    <IoTDashboard farmId={farmId} />
                </Tab>

                <Tab eventKey="forecast" title="🌦️ MGM Tahminleri">
                    <Row className="mb-4">
                        <Col md={12}>
                            <Card className="shadow-sm border-0">
                                <Card.Body className="bg-light">
                                    <h5 className="mb-3">Konum Seçimi</h5>
                                    <Row>
                                        <Col md={6} sm={12}>
                                            <Form.Select value={selectedProvince} onChange={handleProvinceChange} className="mb-2">
                                                <option value="">İl Seçiniz</option>
                                                {provinces.map(p => (
                                                    <option key={p.il} value={p.il}>{p.il}</option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                        <Col md={6} sm={12}>
                                            <Form.Select value={selectedCenter} onChange={(e) => setSelectedCenter(e.target.value)} disabled={!selectedProvince} className="mb-2">
                                                <option value="">İlçe/Merkez Seçiniz</option>
                                                {centers.map(c => (
                                                    <option key={c.merkezId} value={c.merkezId}>{c.ilce || c.il}</option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                        <Col md={12} className="mt-2">
                                            <Button
                                                variant="success"
                                                className="w-100"
                                                onClick={handleAnalyze}
                                                disabled={!selectedCenter || loading}
                                            >
                                                {loading ? <Spinner size="sm" animation="border" /> : 'Analiz Et'}
                                            </Button>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Main Content Area */}
                    {(analysisData || dailyData || hourlyData) && (
                        <Row>
                            {/* Left Column: Warnings & AI & Agricultural Data */}
                            <Col lg={4} className="mb-4">
                                <MeteoWarning data={warnings} dailyData={dailyData} />
                                <AgriculturalForecast data={agriData} />

                                {analysisData && (
                                    <VerifiableAI riskData={analysisData} dailyData={dailyData} cropType="Genel" />
                                )}
                            </Col>

                            {/* Right Column: Detailed Graphic Forecasts */}
                            <Col lg={8}>
                                <Tabs defaultActiveKey="daily" id="forecast-tabs" className="mb-3 custom-tabs">
                                    <Tab eventKey="daily" title="5 Günlük Tahmin">
                                        <DailyForecast data={dailyData} />
                                    </Tab>
                                    <Tab eventKey="hourly" title="Saatlik Tahmin & İlaçlama">
                                        <HourlyForecast data={hourlyData} />
                                    </Tab>
                                </Tabs>
                            </Col>
                        </Row>
                    )}
                </Tab>
            </Tabs>
        </Container>
    );
};

export default Dashboard;
