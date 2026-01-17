// Imports updated (removed Map-related)
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
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

    // --- HELPER FUNCTIONS ---

    const getSensorData = (device, code) => {
        // Returns the FULL array of telemetry for sparklines
        const sensor = device.sensors.find(s => s.code === code);
        return sensor?.telemetry || [];
    };

    const getLatestValue = (device, code) => {
        const data = getSensorData(device, code);
        return data.length > 0 ? data[0].value : null;
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
        let totalTemp = 0, tempCount = 0;
        let totalHum = 0, humCount = 0;
        let activeAlerts = 0;

        devices.forEach(d => {
            const t = getLatestValue(d, 't_air');
            const h = getLatestValue(d, 'h_air');
            if (t !== null) { totalTemp += t; tempCount++; }
            if (h !== null) { totalHum += h; humCount++; }
        });

        if (advice?.alerts) {
            activeAlerts = advice.alerts.length;
        }

        return {
            avgTemp: tempCount ? (totalTemp / tempCount).toFixed(1) : '--',
            avgHum: humCount ? (totalHum / humCount).toFixed(0) : '--',
            activeAlerts
        };
    };

    const kpis = calculateKPIs();

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

                <button className="btn btn-light btn-sm text-secondary" onClick={fetchData}>
                    <RefreshCcw size={14} />
                </button>
            </div>

            {/* 2. KPI HEADER */}
            <Row className="mb-4 g-3">
                <Col md={4}>
                    <Card className="border-0 shadow-sm h-100 bg-white">
                        <Card.Body className="d-flex align-items-center justify-content-between">
                            <div>
                                <div className="text-muted small mb-1">Ortalama Sıcaklık</div>
                                <div className="display-6 fw-bold text-dark">{kpis.avgTemp}°C</div>
                            </div>
                            <div className="bg-light rounded-circle p-3 text-primary">
                                <Thermometer size={24} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm h-100 bg-white">
                        <Card.Body className="d-flex align-items-center justify-content-between">
                            <div>
                                <div className="text-muted small mb-1">Ortalama Nem</div>
                                <div className="display-6 fw-bold text-dark">%{kpis.avgHum}</div>
                            </div>
                            <div className="bg-light rounded-circle p-3 text-info">
                                <Droplets size={24} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className={`border-0 shadow-sm h-100 ${kpis.activeAlerts > 0 ? 'bg-danger text-white' : 'bg-success text-white'}`}>
                        <Card.Body className="d-flex align-items-center justify-content-between">
                            <div>
                                <div className="text-white-50 small mb-1">Risk Durumu</div>
                                <div className="fs-3 fw-bold">
                                    {kpis.activeAlerts > 0 ? `${kpis.activeAlerts} Risk Var` : 'Her Şey Yolunda'}
                                </div>
                            </div>
                            <div className="bg-white bg-opacity-25 rounded-circle p-3">
                                {kpis.activeAlerts > 0 ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
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

            {/* 4. DEVICES GRID REMOVED (As per request) */}
        </div>
    );
};

export default IoTDashboard;
