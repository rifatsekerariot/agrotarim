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
        tempSensors: [],
        showHum: true,
        humSensors: [],
        showSoil: false,
        soilSensors: [],
        showCo2: false,
        co2Sensors: [],
        showLight: false,
        lightSensors: []
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

        return { value: sensor.telemetry[0].value, sensorId: sensor.id };
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
        // Calculate averages for enabled metrics
        metrics.forEach(m => {
            if (summaryConfig[m.key]) {
                let total = 0;
                let count = 0;

                // Determine source: Specific selection or Smart Auto-detect
                const selectedIds = summaryConfig[m.key.replace('show', '').toLowerCase() + 'Sensors'] || [];

                devices.forEach(d => {
                    const data = getLatestValue(d, m.codes);
                    if (data && data.value !== null && !isNaN(data.value)) {
                        // If user selected specific sensors, filter by ID
                        if (selectedIds.length > 0) {
                            if (selectedIds.includes(data.sensorId.toString())) {
                                total += data.value;
                                count++;
                            }
                        } else {
                            // Default: Include all matching
                            total += data.value;
                            count++;
                        }
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

            {/* 3. HERO AI SECTION - Corporate Redesign */}
            {advice && (
                <Card className="mb-4 border-0 shadow-sm overflow-hidden bg-white">
                    <Card.Header className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <div className="bg-light p-2 rounded-circle me-3">
                                <span className="fs-4">🤖</span>
                            </div>
                            <div>
                                <h5 className="fw-bold mb-0 text-dark">AgroZeka Analiz Raporu</h5>
                                <small className="text-muted">
                                    {selectedCrop} ({selectedCity}) • {new Date().toLocaleDateString('tr-TR')}
                                </small>
                            </div>
                        </div>
                        {advice.riskLevel && (
                            <div className={`px-3 py-1 rounded-pill small fw-bold ${advice.riskLevel === 'DÜŞÜK' ? 'bg-success bg-opacity-10 text-success' : advice.riskLevel === 'ORTA' ? 'bg-warning bg-opacity-10 text-warning' : 'bg-danger bg-opacity-10 text-danger'}`}>
                                {advice.riskLevel} RİSK
                            </div>
                        )}
                    </Card.Header>

                    <Card.Body className="p-4">
                        <Row>
                            <Col lg={8}>
                                {/* Summary Text */}
                                <div className="mb-4">
                                    <h6 className="text-secondary text-uppercase small fw-bold mb-2" style={{ fontSize: '0.75rem' }}>Analiz Özeti</h6>
                                    <p className="lead fs-6 text-dark" style={{ lineHeight: '1.6' }}>
                                        {advice.summary}
                                    </p>
                                </div>

                                {/* Status Attributes Grid */}
                                <div className="row g-3 mb-4 border-top border-bottom py-3 bg-light bg-opacity-25 rounded">
                                    <div className="col-md-6 border-end">
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-shield-check fs-4 text-secondary me-3"></i>
                                            <div>
                                                <div className="small text-muted">Risk Puanı</div>
                                                <div className="fw-bold text-dark">{advice.riskScore || 0}/100</div>
                                            </div>
                                        </div>
                                    </div>
                                    {advice.details && (
                                        <div className="col-md-6">
                                            <div className="d-flex align-items-center">
                                                <i className="bi bi-flower1 fs-4 text-secondary me-3"></i>
                                                <div>
                                                    <div className="small text-muted">Fenolojik Gelişim</div>
                                                    <div className="fw-bold text-dark">{advice.details.growthState} <span className="fw-normal text-muted ms-1">(GDD: {advice.details.gdd?.toFixed(1)})</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Items List (Clean Vertical) */}
                                {(advice.actions?.length > 0 || advice.alerts?.length > 0) && (
                                    <div>
                                        <h6 className="text-secondary text-uppercase small fw-bold mb-3" style={{ fontSize: '0.75rem' }}>Önerilen Aksiyonlar & Uyarılar</h6>
                                        <div className="d-flex flex-column gap-2">
                                            {advice.alerts?.map((alert, idx) => (
                                                <div key={`alert-${idx}`} className={`alert p-2 d-flex align-items-center mb-0 ${alert.level === 'critical' ? 'alert-danger' : 'alert-warning'}`}>
                                                    <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                                                    <span className="small fw-medium">{alert.msg}</span>
                                                </div>
                                            ))}
                                            {advice.actions?.map((act, idx) => (
                                                <div key={idx} className="d-flex align-items-start p-2 border rounded bg-white">
                                                    <i className="bi bi-check-circle-fill text-success me-2 mt-1"></i>
                                                    <span className="text-dark small">{act}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Sources Metadata */}
                                {advice.details?.breakdown && (
                                    <div className="mt-3">
                                        <small className="text-muted fst-italic cursor-pointer" style={{ fontSize: '0.7rem' }}>
                                            * Bu analiz, seçili sensörlerinizden alınan canlı veriler ve MGM tahminleri kullanılarak oluşturulmuştur.
                                        </small>
                                    </div>
                                )}
                            </Col>

                            {/* Sidebar / Visual */}
                            <Col lg={4} className="d-none d-lg-block ps-4 border-start">
                                <div className="text-center h-100 d-flex flex-column justify-content-center opacity-75">
                                    <Activity size={80} className="text-success mx-auto mb-3 opacity-50" />
                                    <h6 className="text-secondary fw-bold">Deterministik Motor</h6>
                                    <p className="small text-muted px-3">
                                        AgroZeka, karmaşık tarımsal verileri işleyerek eyleme geçirilebilir içgörüler sunar.
                                    </p>
                                </div>
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
                        {kpiData.metrics.map(m => {
                            const configKey = m.key; // e.g., showTemp
                            const listKey = m.key.replace('show', '').toLowerCase() + 'Sensors'; // e.g., tempSensors
                            const selectedList = summaryConfig[listKey] || [];

                            // Find valid sensors for this metric type
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

                                    {/* Sensor Selection List (Only if enabled) */}
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

                                                            // If list was empty (implies ALL), populate it with all others first then toggle this one
                                                            // Actually simpler logic: Empty = All. When checking one, we must decide behavior.
                                                            // Better UX: If Empty, it means Auto. If user clicks one, they start building manual list.

                                                            if (newList.length === 0) {
                                                                // Was Auto/All. Now unchecking this specific one? Or checking it?
                                                                // Let's assume user wants to SELECT specific ones.
                                                                // If All are seemingly checked, and I click one, what happens?
                                                                // Implementation: Checkbox is CHECKED if list is empty OR id is in list.

                                                                // To make it intuitive:
                                                                // If list is empty (All), clicking a checkbox should probably switch to "Only this one" or "All except this".
                                                                // Let's go with: Click adds to AllowList.
                                                                // BUT current UI shows them checked.
                                                                // Let's init list with ALL IDs if it was empty, then toggle.
                                                                const allIds = availableSensors.map(as => as.id.toString());
                                                                newList = allIds.filter(id => id !== idStr); // Uncheck this one
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
        </div >
    );
};

export default IoTDashboard;
