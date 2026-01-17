// Imports updated (removed Map-related)
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Alert, Spinner, Badge, Modal } from 'react-bootstrap';
import { RefreshCcw, Wifi, WifiOff, MapPin, Thermometer, Droplets, TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

const IoTDashboard = ({ farmId }) => {
    const [devices, setDevices] = useState([]);
    const [advice, setAdvice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Controlled Inputs State
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedCrop, setSelectedCrop] = useState('');

    // Dashboard Summary Config
    const [summaryConfig, setSummaryConfig] = useState({
        showTemp: true,
        showHum: true,
        showSoil: false,
        showCo2: false,
        showLight: false
    });
    const [showConfigModal, setShowConfigModal] = useState(false);

    const fetchData = async () => {
        // Only set loading on partial refetch if we don't have devices yet
        if (devices.length === 0) setLoading(true);

        try {
            // 1. Fetch Live Sensors
            const telRes = await fetch(`/api/telemetry/farm/${farmId}`);
            if (!telRes.ok) throw new Error("Sensör verisi alınamadı");
            const deviceData = await telRes.json();
            setDevices(deviceData);

            // 2. Fetch Expert Advice & Config
            const expRes = await fetch(`/api/expert/${farmId}`);
            if (expRes.ok) {
                const advData = await expRes.json();
                setAdvice(advData);
                // Sync dropdowns with backend state
                if (advData.city) setSelectedCity(advData.city);
                if (advData.raw_crop) setSelectedCrop(advData.raw_crop);
            }

            // 3. Fetch Dashboard Config
            const confRes = await fetch(`/api/expert/${farmId}/dashboard`);
            if (confRes.ok) {
                const confData = await confRes.json();
                if (confData.summary) {
                    setSummaryConfig(prev => ({ ...prev, ...confData.summary }));
                }
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [farmId]);

    const handleCropChange = async (e) => {
        const newCrop = e.target.value;
        setSelectedCrop(newCrop); // Immediate UI update
        try {
            await fetch(`/api/expert/${farmId}/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ crop: newCrop })
            });
            fetchData();
        } catch (err) {
            console.error("Crop update failed", err);
        }
    };

    const handleCityChange = async (e) => {
        const newCity = e.target.value;
        setSelectedCity(newCity); // Immediate UI update
        try {
            await fetch(`/api/expert/${farmId}/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city: newCity })
            });
            fetchData();
        } catch (err) {
            console.error("City update failed", err);
        }
    };

    const handleSummaryConfigSave = async () => {
        try {
            // First get existing config to not overwrite 'widgets'
            const res = await fetch(`/api/expert/${farmId}/dashboard`);
            const currentConfig = await res.json();

            const newConfig = {
                ...currentConfig,
                summary: summaryConfig
            };

            await fetch(`/api/expert/${farmId}/dashboard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            });
            setShowConfigModal(false);
        } catch (err) {
            console.error("Config save failed", err);
        }
    };

    // --- HELPER FUNCTIONS ---

    const getSensorData = (device, code) => {
        // Returns the FULL array of telemetry for sparklines
        const sensor = device.sensors.find(s => s.code === code);
        return sensor?.telemetry || [];
    };

    const getLatestValue = (device, codes) => {
        // If single code string passed, convert to array
        const codeList = Array.isArray(codes) ? codes : [codes];

        // Find first matching sensor that has data
        const sensor = device.sensors.find(s => codeList.includes(s.code));
        if (!sensor || !sensor.telemetry || sensor.telemetry.length === 0) return null;

        return sensor.telemetry[0].value;
    };

    const getTrend = (device, code) => {
        const data = getSensorData(device, code);
        if (data.length < 2) return 'stable';
        const current = data[0].value;
        const prev = data[1].value; // Previous reading
        if (current > prev) return 'up';
        if (current < prev) return 'down';
        return 'stable';
    };

    // --- KPI CALCULATIONS ---
    const calculateKPIs = () => {
        // Dynamic aggregation based on enabled metrics
        const metrics = [
            { key: 'showTemp', codes: ['t_air', 'temperature', 'temp', 'sicaklik', 'air_temp'], label: 'Ort. Sıcaklık', unit: '°C' },
            { key: 'showHum', codes: ['h_air', 'humidity', 'hum', 'nem', 'air_hum'], label: 'Ort. Nem', unit: '%' },
            { key: 'showSoil', codes: ['soil_moisture', 'soil', 'toprak_nem', 'moisture'], label: 'Toprak Nemi', unit: '%' },
            { key: 'showCo2', codes: ['co2', 'co2_level', 'karbondioksit'], label: 'CO2', unit: 'ppm' },
            { key: 'showLight', codes: ['light', 'luminosity', 'isik'], label: 'Işık', unit: 'Lux' }
        ];

        const results = {};
        let activeAlerts = 0;

        // Calculate averages for enabled metrics
        metrics.forEach(m => {
            if (summaryConfig[m.key]) {
                let total = 0;
                let count = 0;
                devices.forEach(d => {
                    const v = getLatestValue(d, m.codes);
                    if (v !== null && !isNaN(v)) {
                        total += v;
                        count++;
                    }
                });
                results[m.key] = count ? (total / count).toFixed(1) : '--';
            }
        });

        if (advice?.alerts) {
            activeAlerts = advice.alerts.length;
        }

        return { results, activeAlerts, metrics };
    };

    const kpiData = calculateKPIs();

    // --- RENDERERS ---

    const renderSparkline = (data, color) => {
        // Reverse data for chart (Backend sends DESC timestamp, Chart needs ASC time)
        const chartData = [...data].reverse().map(d => ({ v: d.value }));
        if (chartData.length < 2) return null;

        return (
            <div style={{ width: '80px', height: '30px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
                        <YAxis domain={['dataMin', 'dataMax']} hide />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    };

    if (loading && devices.length === 0) return <div className="text-center p-5"><Spinner animation="border" /></div>;

    return (
        <div className="iot-dashboard p-2">

            {/* 1. CONFIG BAR (Subtle) */}
            <div className="d-flex justify-content-end mb-3 gap-2 align-items-center">
                <small className="text-muted me-2">Konfigürasyon:</small>
                {/* City Selector */}
                <select className="form-select form-select-sm border-0 bg-light" style={{ width: '120px' }}
                    onChange={handleCityChange} value={selectedCity}>
                    <option value="" disabled>Şehir Seç</option>
                    <optgroup label="Akdeniz">
                        <option value="Adana">Adana</option>
                        <option value="Antalya">Antalya</option>
                        <option value="Mersin">Mersin</option>
                    </optgroup>
                    {/* ... Add other regions if needed, keeping it concise */}
                    <option value="Konya">Konya</option>
                    <option value="İzmir">İzmir</option>
                    <option value="Bursa">Bursa</option>
                    <option value="Şanlıurfa">Şanlıurfa</option>
                </select>

                {/* Crop Selector */}
                <select className="form-select form-select-sm border-0 bg-light" style={{ width: '120px' }}
                    onChange={handleCropChange} value={selectedCrop}>
                    <option value="" disabled>Ürün Seç</option>
                    <option value="Buğday">Buğday</option>
                    <option value="Mısır">Mısır</option>
                    <option value="Pamuk">Pamuk</option>
                    <option value="Domates">Domates</option>
                    <option value="Narenciye">Narenciye</option>
                </select>

                <button className="btn btn-light btn-sm text-secondary" onClick={() => setShowConfigModal(true)} title="Görünüm Ayarları">
                    <i className="bi bi-gear-fill"></i>
                </button>
                <button className="btn btn-light btn-sm text-secondary" onClick={fetchData} title="Yenile">
                    <RefreshCcw size={14} />
                </button>
            </div>

            {/* 2. KPI HEADER (Dynamic) */}
            <Row className="mb-4 g-3">
                {kpiData.metrics.map(m => {
                    if (!summaryConfig[m.key]) return null;

                    let icon = <Thermometer size={24} />;
                    let colorClass = 'text-primary';
                    if (m.key === 'showHum') { icon = <Droplets size={24} />; colorClass = 'text-info'; }
                    if (m.key === 'showSoil') { icon = <i className="bi bi-moisture fs-3"></i>; colorClass = 'text-success'; }
                    if (m.key === 'showCo2') { icon = <i className="bi bi-cloud-fog fs-3"></i>; colorClass = 'text-secondary'; }
                    if (m.key === 'showLight') { icon = <i className="bi bi-sun fs-3"></i>; colorClass = 'text-warning'; }

                    return (
                        <Col key={m.key} md={3} sm={6}>
                            <Card className="border-0 shadow-sm h-100 bg-white">
                                <Card.Body className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <div className="text-muted small mb-1">{m.label}</div>
                                        <div className="display-6 fw-bold text-dark">{kpiData.results[m.key]}{m.unit}</div>
                                    </div>
                                    <div className={`bg-light rounded-circle p-3 ${colorClass}`}>
                                        {icon}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}

                <Col md={3} sm={6}>
                    <Card className={`border-0 shadow-sm h-100 ${kpiData.activeAlerts > 0 ? 'bg-danger text-white' : 'bg-success text-white'}`}>
                        <Card.Body className="d-flex align-items-center justify-content-between">
                            <div>
                                <div className="text-white-50 small mb-1">Risk Durumu</div>
                                <div className="fs-3 fw-bold">
                                    {kpiData.activeAlerts > 0 ? `${kpiData.activeAlerts} Risk` : 'Stabil'}
                                </div>
                            </div>
                            <div className="bg-white bg-opacity-25 rounded-circle p-3">
                                {kpiData.activeAlerts > 0 ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* 3. HERO AI SECTION - Enhanced with Expert Data */}
            {advice && (
                <Card className="mb-4 border-0 shadow-sm overflow-hidden">
                    <div className={`p-1 ${advice.riskLevel === 'KRİTİK' || advice.riskLevel === 'YÜKSEK' ? 'bg-danger' : 'bg-success'}`} />
                    <Card.Body className="p-4">
                        <Row className="align-items-center">
                            <Col md={8}>
                                <div className="d-flex align-items-center mb-3">
                                    <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                                        <span className="fs-2">🤖</span>
                                    </div>
                                    <div>
                                        <h4 className="fw-bold mb-0 text-dark">AgroZeka Asistanı</h4>
                                        <small className="text-muted">
                                            {selectedCrop} ({selectedCity}) Analiz Raporu
                                            <Badge bg="info" className="ms-2">Kural Tabanlı Çıkarım</Badge>
                                        </small>
                                    </div>
                                </div>

                                {/* Risk Score & Growth Status Row */}
                                <Row className="mb-3">
                                    <Col>
                                        <div className="small text-muted">Risk Seviyesi</div>
                                        <Badge bg={advice.riskLevel === 'DÜŞÜK' ? 'success' : advice.riskLevel === 'ORTA' ? 'warning' : 'danger'} className="fs-6 px-3 py-2">
                                            {advice.riskLevel || 'BELİRSİZ'} ({advice.riskScore || 0} Puan)
                                        </Badge>
                                    </Col>
                                    {advice.details && (
                                        <Col>
                                            <div className="small text-muted">Büyüme Durumu</div>
                                            <Badge bg="secondary" className="fs-6 px-3 py-2">
                                                {advice.details.growthState} (GDD: {advice.details.gdd?.toFixed(1)})
                                            </Badge>
                                        </Col>
                                    )}
                                </Row>

                                <p className="lead text-dark mb-4">
                                    "{advice.summary}"
                                </p>

                                {/* Action Items as horizontal pills */}
                                <div className="d-flex flex-wrap gap-2">
                                    {advice.actions?.map((act, idx) => (
                                        <Badge key={idx} bg="light" text="dark" className="border px-3 py-2 fw-normal d-flex align-items-center gap-2">
                                            <i className="bi bi-check-circle-fill text-success"></i> {act}
                                        </Badge>
                                    ))}
                                    {advice.alerts?.map((alert, idx) => (
                                        <Badge key={`alert-${idx}`} bg={alert.level === 'critical' ? 'danger' : 'warning'} text="white" className="px-3 py-2 fw-normal d-flex align-items-center gap-2">
                                            <i className="bi bi-exclamation-triangle-fill"></i> {alert.msg}
                                        </Badge>
                                    ))}
                                </div>

                                {/* Scoring Breakdown (Optional) */}
                                {advice.details?.breakdown && (
                                    <details className="mt-3">
                                        <summary className="text-muted small" style={{ cursor: 'pointer' }}>🔍 Puanlama Detayları (Veri Kaynakları)</summary>
                                        <ul className="mt-2 mb-0 small">
                                            {advice.details.breakdown.map((b, i) => (
                                                <li key={i}><strong>{b.msg}</strong>: +{b.points} Puan (Kod: {b.code})</li>
                                            ))}
                                        </ul>
                                    </details>
                                )}
                            </Col>
                            <Col md={4} className="text-center border-start opacity-75 d-none d-md-block">
                                <Activity size={64} className="text-success mb-2" />
                                <div className="text-muted small">Deterministik Analiz Motoru</div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* 4. CONFIG MODAL */}
            <Modal show={showConfigModal} onHide={() => setShowConfigModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Özet Paneli Ayarları</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted small">Bu alanda hangi verilerin ortalamasını görmek istediğinizi seçebilirsiniz.</p>
                    <div className="d-flex flex-column gap-3">
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" checked={summaryConfig.showTemp}
                                onChange={e => setSummaryConfig({ ...summaryConfig, showTemp: e.target.checked })} />
                            <label className="form-check-label">Ortalama Sıcaklık</label>
                        </div>
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" checked={summaryConfig.showHum}
                                onChange={e => setSummaryConfig({ ...summaryConfig, showHum: e.target.checked })} />
                            <label className="form-check-label">Ortalama Nem</label>
                        </div>
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" checked={summaryConfig.showSoil}
                                onChange={e => setSummaryConfig({ ...summaryConfig, showSoil: e.target.checked })} />
                            <label className="form-check-label">Toprak Nemi</label>
                        </div>
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" checked={summaryConfig.showCo2}
                                onChange={e => setSummaryConfig({ ...summaryConfig, showCo2: e.target.checked })} />
                            <label className="form-check-label">CO2 Seviyesi</label>
                        </div>
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" checked={summaryConfig.showLight}
                                onChange={e => setSummaryConfig({ ...summaryConfig, showLight: e.target.checked })} />
                            <label className="form-check-label">Işık Şiddeti</label>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <button className="btn btn-secondary" onClick={() => setShowConfigModal(false)}>İptal</button>
                    <button className="btn btn-success" onClick={handleSummaryConfigSave}>Kaydet</button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default IoTDashboard;
