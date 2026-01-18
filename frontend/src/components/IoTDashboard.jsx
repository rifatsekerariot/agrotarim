import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spinner, Badge, Button, Table } from 'react-bootstrap';
import { RefreshCcw, Thermometer, Droplets, Wind, Activity, Zap, Wifi } from 'lucide-react';

const KPICard = ({ label, value, unit, icon: Icon, colorClass }) => (
    <Card className={`border-0 shadow-sm h-100 text-white ${colorClass}`} style={{ borderRadius: '16px' }}>
        <div className="card-body p-4 d-flex flex-column justify-content-between">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="bg-white bg-opacity-25 p-2 rounded-circle">
                    <Icon size={24} className="text-white" />
                </div>
                <Activity size={18} className="opacity-75" />
            </div>
            <div>
                <h2 className="display-4 fw-bold mb-0">{value}<span className="fs-4 fw-normal opacity-75">{unit}</span></h2>
                <div className="text-white-50 fw-medium small text-uppercase">{label}</div>
            </div>
        </div>
    </Card>
);

const IoTDashboard = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const farmId = 1;

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/telemetry/farm/${farmId}`);
            if (res.ok) {
                const data = await res.json();
                setDevices(data);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error('Error fetching telemetry:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // 10 sn update
        return () => clearInterval(interval);
    }, []);

    // Calculate Averages
    const calculateAverage = (sensorCode) => {
        let total = 0;
        let count = 0;
        devices.forEach(d => {
            const sensor = d.sensors?.find(s => s.code === sensorCode || s.code.includes(sensorCode));
            if (sensor && sensor.telemetry?.[0]) {
                total += Number(sensor.telemetry[0].value);
                count++;
            }
        });
        return count > 0 ? (total / count).toFixed(1) : '--';
    };

    const avgTemp = calculateAverage('temp'); // covers t_air, temperature
    const avgHum = calculateAverage('hum');   // covers h_air, humidity

    return (
        <div className="iot-dashboard pb-5">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 px-4 pt-4">
                <div>
                    <h3 className="fw-bold text-dark mb-0">Canlı Sensör Verileri</h3>
                    <small className="text-muted">
                        Toplam {devices.length} cihaz izleniyor • Son Güncelleme: {lastUpdated?.toLocaleTimeString()}
                    </small>
                </div>
                <Button variant="light" className="shadow-sm rounded-circle p-2 text-primary" onClick={fetchData}>
                    <RefreshCcw size={20} />
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="container-fluid px-4">
                <Row className="g-4 mb-5">
                    <Col md={6}>
                        <KPICard
                            label="Ortalama Sıcaklık"
                            value={avgTemp}
                            unit="°C"
                            icon={Thermometer}
                            colorClass="bg-primary bg-gradient"
                        />
                    </Col>
                    <Col md={6}>
                        <KPICard
                            label="Ortalama Nem"
                            value={avgHum}
                            unit="%"
                            icon={Droplets}
                            colorClass="bg-success bg-gradient"
                        />
                    </Col>
                </Row>

                {/* Device List Table */}
                <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                    <Card.Header className="bg-white py-3 px-4 border-bottom">
                        <h5 className="mb-0 fw-bold text-secondary">Aktif Cihaz Listesi</h5>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Table hover responsive className="mb-0 align-middle">
                            <thead className="bg-light text-secondary">
                                <tr>
                                    <th className="px-4 py-3">Cihaz Adı</th>
                                    <th>Model</th>
                                    <th>Son Görülme</th>
                                    <th>Sensör Değerleri</th>
                                    <th>Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {devices.length > 0 ? devices.map(device => (
                                    <tr key={device.id}>
                                        <td className="px-4 fw-medium text-dark">
                                            <div className="d-flex align-items-center gap-2">
                                                <Wifi size={16} className="text-primary" />
                                                {device.name}
                                            </div>
                                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>{device.serialNumber}</small>
                                        </td>
                                        <td><Badge bg="light" text="dark" className="border">{device.model}</Badge></td>
                                        <td className="text-muted small">
                                            {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Hiç görülmedi'}
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2 flex-wrap">
                                                {device.sensors?.map(s => (
                                                    <Badge key={s.id} bg="info" className="bg-opacity-10 text-info border border-info">
                                                        {s.name}: {s.telemetry?.[0]?.value || '--'} {s.unit}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <Badge bg="success" className="rounded-pill">Online</Badge>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-muted">
                                            {loading ? <Spinner animation="border" size="sm" /> : 'Henüz cihaz eklenmemiş.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
};

export default IoTDashboard;
