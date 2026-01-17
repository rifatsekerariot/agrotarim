// Imports
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spinner, Badge, Modal, ProgressBar, Button } from 'react-bootstrap';
import { RefreshCcw, Thermometer, Droplets, TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle, Wind, AlertOctagon, Sun, CloudRain, CloudSun } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

// --- SUB-COMPONENTS ---

const WeatherStrip = () => (
    <div className="d-flex justify-content-center align-items-center gap-4 bg-dark text-white py-2 px-4 rounded-bottom shadow-sm mx-auto mb-4" style={{ maxWidth: '600px', fontSize: '0.9rem' }}>
        <div className="d-flex align-items-center gap-2">
            <Sun size={18} className="text-warning" />
            <span className="fw-bold">Bugün</span> 28°
        </div>
        <div className="vr bg-secondary opacity-50"></div>
        <div className="d-flex align-items-center gap-2 opacity-75">
            <CloudSun size={18} />
            <span className="fw-medium">Yarın</span> 25°
        </div>
        <div className="vr bg-secondary opacity-50"></div>
        <div className="d-flex align-items-center gap-2 opacity-75">
            <CloudRain size={18} />
            <span className="fw-medium">Pazartesi</span> 22°
        </div>
    </div>
);

const RiskGauge = ({ value }) => {
    // Circular Progress Visualization
    const radius = 30;
    const stroke = 6;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    let color = '#198754';
    if (value > 30) color = '#ffc107';
    if (value > 60) color = '#dc3545';

    return (
        <div className="d-flex flex-column align-items-center justify-content-center position-relative" style={{ width: '80px', height: '80px' }}>
            <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
                <circle
                    stroke="#e9ecef"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
            </svg>
            <div className="position-absolute d-flex flex-column align-items-center" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <span className="fw-bold small" style={{ lineHeight: '1' }}>{value}</span>
            </div>
        </div>
    );
};

const KPICard = ({ label, value, unit, icon: Icon, trend, idealRange, gradientClass, delay }) => (
    <Card className={`border-0 shadow h-100 text-white overflow-hidden slide-in ${delay}`} style={{ borderRadius: '16px' }}>
        <div className={`card-body p-4 d-flex flex-column justify-content-between ${gradientClass}`}>
            <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-white bg-opacity-25 p-2 rounded-circle backdrop-blur">
                    <Icon size={24} className="text-white" />
                </div>
                {trend && (
                    <Badge bg="light" text="dark" className="d-flex align-items-center gap-1 shadow-sm">
                        {trend === 'up' ? <TrendingUp size={12} className="text-danger" /> : <TrendingDown size={12} className="text-success" />}
                        {trend === 'up' ? 'Yükselişte' : 'Düşüşte'}
                    </Badge>
                )}
            </div>
            <div>
                <h2 className="display-4 fw-bold mb-0 font-display text-shadow">{value}<span className="fs-4 fw-normal opacity-75">{unit}</span></h2>
                <div className="text-white-50 fw-medium small text-uppercase letter-spacing-1">{label}</div>
                {idealRange && (
                    <div className="mt-2 pt-2 border-top border-white border-opacity-25 small text-white-75 d-flex align-items-center gap-1">
                        <CheckCircle size={12} /> İdeal: {idealRange}
                    </div>
                )}
            </div>
        </div>
    </Card>
);

const RiskCard = ({ count, delay }) => (
    <Card className={`border-0 h-100 bg-gradient-risk text-white overflow-hidden slide-in ${delay} ${count > 0 ? 'animate-pulse-red' : ''}`} style={{ borderRadius: '16px' }}>
        <div className="card-body p-4 d-flex flex-column justify-content-center align-items-center text-center position-relative">
            {count > 0 && (
                <div className="position-absolute top-0 end-0 p-3">
                    <span className="badge bg-white text-danger fw-bold shadow-sm">ACİL EYLEM</span>
                </div>
            )}
            <AlertOctagon size={48} className="mb-3 opacity-90" />
            <h2 className="display-4 fw-bold mb-1 font-display">{count > 0 ? `${count} RİSK` : 'GÜVENLİ'}</h2>
            <p className="text-white opacity-90 mb-0 fw-medium">
                {count > 0 ? 'Hemen Kontrol Edin!' : 'Sistem Stabil'}
            </p>
            {count > 0 && <Button variant="light" size="sm" className="mt-3 text-danger fw-bold rounded-pill px-4 shadow-sm">Görüntüle</Button>}
        </div>
    </Card>
);

// --- MAIN DASHBOARD ---

// Metric Definitions used for Config & KPI logic
const METRICS = [
    { key: 'showTemp', codes: ['t_air', 'temperature', 'temp', 'sicaklik', 'air_temp'], label: 'Ort. Sıcaklık', unit: '°C' },
    { key: 'showHum', codes: ['h_air', 'humidity', 'hum', 'nem', 'air_hum'], label: 'Ort. Nem', unit: '%' },
    { key: 'showSoil', codes: ['soil_moisture', 'soil', 'toprak_nem', 'moisture'], label: 'Toprak Nemi', unit: '%' },
    { key: 'showCo2', codes: ['co2', 'co2_level', 'karbondioksit'], label: 'CO2', unit: 'ppm' },
    { key: 'showLight', codes: ['light', 'luminosity', 'isik'], label: 'Işık', unit: 'Lux' }
];

const IoTDashboard = ({ farmId }) => {
    const [devices, setDevices] = useState([]);
    const [advice, setAdvice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Inputs
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedCrop, setSelectedCrop] = useState('');
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [summaryConfig, setSummaryConfig] = useState({
        showTemp: true, tempSensors: [], showHum: true, humSensors: [], showSoil: false, showCo2: false, showLight: false
    });

    const fetchData = async () => {
        if (devices.length === 0) setLoading(true);
        try {
            const [telRes, expRes, confRes] = await Promise.all([
                fetch(`/api/telemetry/farm/${farmId}`),
                fetch(`/api/expert/${farmId}`),
                fetch(`/api/expert/${farmId}/dashboard`)
            ]);

            if (telRes.ok) setDevices(await telRes.json());
            if (expRes.ok) {
                const adv = await expRes.json();
                setAdvice(adv);
                if (adv.city) setSelectedCity(adv.city);
                if (adv.raw_crop) setSelectedCrop(adv.raw_crop);
            }
            if (confRes.ok) {
                const conf = await confRes.json();
                if (conf.summary) setSummaryConfig(prev => ({ ...prev, ...conf.summary }));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [farmId]);

    const handleConfigSave = async (field, value) => {
        // Optimistic UI update
        if (field === 'city') setSelectedCity(value);
        if (field === 'crop') setSelectedCrop(value);

        await fetch(`/api/expert/${farmId}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value })
        });
        fetchData();
    };

    const handleSummaryConfigSave = async () => {
        try {
            // 1. Get current config to merge
            const res = await fetch(`/api/expert/${farmId}/dashboard`);
            const currentConfig = await res.json();

            // 2. Update summary part
            const newConfig = {
                ...currentConfig,
                summary: summaryConfig
            };

            // 3. Save back
            await fetch(`/api/expert/${farmId}/dashboard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            });
            setShowConfigModal(false);
            fetchData();
        } catch (err) {
            console.error("Config save failed", err);
            // Optionally set error state here
        }
    };

    // Helper: Calculate Avg & Trend
    const computeMetric = (keys, codes) => {
        if (!summaryConfig[keys.show]) return null;
        let total = 0, count = 0, values = [];
        const selected = summaryConfig[keys.list] || [];

        devices.forEach(d => {
            const sensor = d.sensors.find(s => codes.includes(s.code));
            if (sensor?.telemetry?.[0]) {
                const val = sensor.telemetry[0].value;
                if ((selected.length === 0 || selected.includes(sensor.id.toString())) && val !== null) {
                    total += val;
                    count++;
                    values.push(val);
                }
            }
        });

        if (count === 0) return null;
        return (total / count).toFixed(1);
    };

    const tempVal = computeMetric({ show: 'showTemp', list: 'tempSensors' }, ['t_air', 'temperature', 'temp']);
    const humVal = computeMetric({ show: 'showHum', list: 'humSensors' }, ['h_air', 'humidity', 'hum']);
    const riskCount = advice?.alerts?.length || 0;

    if (loading && devices.length === 0) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <div className="iot-dashboard pb-5" style={{ minHeight: '100vh' }}>
            {/* 1. Header & Controls */}
            <div className="container-fluid px-4 pt-3">
                <WeatherStrip />

                <div className="d-flex justify-content-between align-items-center mb-4 slide-in delay-1">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-success text-white p-2 rounded shadow-sm">
                            <Wind size={24} />
                        </div>
                        <div>
                            <h3 className="fw-bold mb-0 text-dark">Genel Özet</h3>

                            <div className="d-flex gap-2 mt-1">
                                <select className="form-select form-select-sm border-0 bg-transparent fw-bold text-secondary p-0 w-auto shadow-none cursor-pointer"
                                    value={selectedCity} onChange={(e) => handleConfigSave('city', e.target.value)}>
                                    <option value="Adana">Adana</option>
                                    <option value="Antalya">Antalya</option>
                                    <option value="Konya">Konya</option>
                                </select>
                                <span className="text-muted">•</span>
                                <select className="form-select form-select-sm border-0 bg-transparent fw-bold text-secondary p-0 w-auto shadow-none cursor-pointer"
                                    value={selectedCrop} onChange={(e) => handleConfigSave('crop', e.target.value)}>
                                    <option value="Narenciye">Narenciye</option>
                                    <option value="Domates">Domates</option>
                                    <option value="Mısır">Mısır</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex gap-2">
                        <button className="btn btn-white shadow-sm rounded-circle p-2 text-primary" onClick={fetchData}>
                            <RefreshCcw size={20} />
                        </button>
                    </div>
                </div>

                {/* 2. KPI GRID */}
                <Row className="g-4 mb-4">
                    <Col lg={4} md={6}>
                        {tempVal ? (
                            <KPICard
                                label="Ortalama Sıcaklık"
                                value={tempVal}
                                unit="°C"
                                icon={Thermometer}
                                trend="stable" // Todo: Real trend logic
                                idealRange="18-28°C"
                                gradientClass="bg-gradient-temp"
                                delay="delay-1"
                            />
                        ) : <KPICard label="Sıcaklık" value="--" unit="°C" icon={Thermometer} gradientClass="bg-secondary" />}
                    </Col>
                    <Col lg={4} md={6}>
                        {humVal ? (
                            <KPICard
                                label="Ortalama Nem"
                                value={humVal}
                                unit="%"
                                icon={Droplets}
                                trend="up"
                                idealRange="40-60%"
                                gradientClass="bg-gradient-hum"
                                delay="delay-2"
                            />
                        ) : <KPICard label="Nem" value="--" unit="%" icon={Droplets} gradientClass="bg-secondary" />}
                    </Col>
                    <Col lg={4} md={12}>
                        <RiskCard count={riskCount} delay="delay-3" />
                    </Col>
                </Row>

                {/* 3. ANALYSIS & ALERTS */}
                <Row className="g-4 slide-in delay-4">
                    {/* Left: Detailed Analysis */}
                    <Col lg={8}>
                        <Card className="border-0 shadow-sm h-100 rounded-4 overflow-hidden">
                            <Card.Header className="bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                    <Activity size={20} className="text-primary" />
                                    <h5 className="fw-bold mb-0">AgroZeka® Analiz</h5>
                                </div>
                                <small className="text-muted">Son analiz: 2 dakika önce</small>
                            </Card.Header>
                            <Card.Body className="p-4">
                                <div className="d-flex align-items-center mb-4 p-3 bg-light bg-opacity-50 rounded-3">
                                    <div className="me-4 pe-4 border-end d-flex align-items-center gap-3">
                                        <RiskGauge value={advice?.riskScore || 55} />
                                        <div>
                                            <div className="small text-muted fw-bold text-uppercase">Yapay Zeka Risk Puanı</div>
                                            <div className="fw-bold text-dark">{advice?.riskScore || 55}/100</div>
                                            <small className="text-success fw-medium">Durum Stabil</small>
                                        </div>
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between mb-1">
                                            <span className="small fw-bold text-muted">Fenolojik Gelişim</span>
                                            <Badge bg="success" className="rounded-pill">NORMAL</Badge>
                                        </div>
                                        <ProgressBar now={advice?.details?.gdd ? Math.min(advice.details.gdd / 20, 100) : 45} variant="success" style={{ height: '8px' }} />
                                        <small className="text-muted mt-1 d-block">Sera döngüsünün %45'i tamamlandı</small>
                                    </div>
                                </div>

                                <p className="text-secondary lead fs-6 mb-4">{advice?.summary || 'Veriler toplanıyor...'}</p>

                                {/* Dinamik 'Tamamlanan İşlemler' (Backend eklendiğinde açılacak) */}
                                {advice?.actions && advice.actions.length > 0 && (
                                    <>
                                        <h6 className="text-muted fw-bold small text-uppercase mb-3">Tamamlanan İşlemler</h6>
                                        <div className="d-flex gap-3 overflow-auto pb-2">
                                            {advice.actions.map((action, idx) => (
                                                <div key={idx} className="d-flex align-items-center gap-2 px-3 py-2 bg-light rounded-pill border text-muted small text-nowrap">
                                                    <CheckCircle size={14} className="text-success" /> {action}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Right: Urgent Alerts */}
                    <Col lg={4}>
                        <div className="h-100 d-flex flex-column gap-3">
                            <h6 className="text-muted fw-bold small text-uppercase mb-0 ps-1">⚠ Acil Uyarılar</h6>

                            {advice?.alerts?.length > 0 ? advice.alerts.map((alert, idx) => (
                                <Card key={idx} className="border-0 shadow-sm rounded-3 overflow-hidden">
                                    <div className={`d-flex align-items-stretch ${alert.level === 'critical' ? 'border-start border-4 border-danger' : 'border-start border-4 border-warning'}`}>
                                        <div className="p-3 bg-white w-100">
                                            <div className="d-flex justify-content-between align-items-start mb-1">
                                                <span className={`badge ${alert.level === 'critical' ? 'bg-danger' : 'bg-warning text-dark'} `}>
                                                    {alert.level === 'critical' ? 'KRİTİK' : 'UYARI'}
                                                </span>
                                                <small className="text-muted d-flex align-items-center gap-1">
                                                    <div className="spinner-grow spinner-grow-sm text-danger" style={{ width: '0.5rem', height: '0.5rem' }}></div>
                                                    Canlı
                                                </small>
                                            </div>
                                            <h6 className="fw-bold mb-1 mt-2">{alert.msg}</h6>
                                            <p className="small text-muted mb-0">Önerilen aksiyon: {alert.action || 'Kontrol sağlayın.'}</p>
                                        </div>
                                    </div>
                                </Card>
                            )) : (
                                <Card className="border-0 shadow-sm rounded-3 p-4 text-center text-muted">
                                    <CheckCircle size={32} className="text-success mb-2 mx-auto" />
                                    <h6>Şu an aktif uyarı yok</h6>
                                    <small>Sistem optimum değerlerde çalışıyor.</small>
                                </Card>
                            )}

                            {/* Determine Engine Status Box */}
                            <div className="mt-auto p-4 rounded-3 text-white bg-dark position-relative overflow-hidden">
                                <div className="position-relative z-1">
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <Activity size={18} className="text-success" />
                                        <span className="fw-bold small text-uppercase text-success">Deterministik Motor</span>
                                    </div>
                                    <h5 className="mb-1">Analiz Aktif</h5>
                                    <small className="opacity-75">Tüm sensörler ve API verileri anlık olarak işleniyor.</small>
                                </div>
                                <div className="position-absolute top-0 end-0 p-3 opacity-10">
                                    <Activity size={100} />
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* Config Modal (Hidden but functional) */}
            <Modal show={showConfigModal} onHide={() => setShowConfigModal(false)} centered>
                {/* Re-implementing the config modal content that was part of the original requirement */}
                <Modal.Header closeButton>
                    <Modal.Title>Özet Paneli Ayarları</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted small">Bu alanda hangi verilerin ortalamasını görmek istediğinizi seçebilirsiniz.</p>
                    <div className="d-flex flex-column gap-3">
                        {METRICS.map(m => {
                            const configKey = m.key;
                            const listKey = m.key.replace('show', '').toLowerCase() + 'Sensors';
                            const selectedList = summaryConfig[listKey] || [];

                            const availableSensors = [];
                            devices.forEach(d => {
                                d.sensors.forEach(s => {
                                    if (m.codes.includes(s.code)) {
                                        availableSensors.push({
                                            id: s.id,
                                            name: s.name || s.code,
                                            devName: d.name
                                        });
                                    }
                                });
                            });

                            return (
                                <div key={m.key} className="border p-2 rounded bg-light">
                                    <div className="form-check form-switch mb-2">
                                        <input className="form-check-input" type="checkbox" checked={summaryConfig[configKey]}
                                            onChange={e => setSummaryConfig({ ...summaryConfig, [configKey]: e.target.checked })} />
                                        <label className="form-check-label fw-bold">{m.label}</label>
                                    </div>
                                    {summaryConfig[configKey] && availableSensors.length > 0 && (
                                        <div className="ms-4 small">
                                            <div className="text-muted mb-1 fst-italic">Veri Kaynakları:</div>
                                            {availableSensors.map(s => (
                                                <div key={s.id} className="form-check">
                                                    <input className="form-check-input" type="checkbox"
                                                        checked={selectedList.length === 0 || selectedList.includes(s.id.toString())}
                                                        onChange={e => {
                                                            const idStr = s.id.toString();
                                                            let newList = [...selectedList];
                                                            if (newList.length === 0) {
                                                                const allIds = availableSensors.map(as => as.id.toString());
                                                                newList = allIds.filter(id => id !== idStr);
                                                            } else {
                                                                if (newList.includes(idStr)) {
                                                                    newList = newList.filter(id => id !== idStr);
                                                                } else {
                                                                    newList.push(idStr);
                                                                }
                                                            }
                                                            setSummaryConfig({ ...summaryConfig, [listKey]: newList });
                                                        }}
                                                    />
                                                    <label className="form-check-label text-truncate" style={{ maxWidth: '200px' }}>
                                                        {s.devName} - {s.name}
                                                    </label>
                                                </div>
                                            ))}
                                            <div className="form-text" style={{ fontSize: '0.7em' }}>
                                                *(Hiçbiri seçilmezse veya hepsi seçilirse otomatik belirlenir)*
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
