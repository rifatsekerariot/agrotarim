import React, { useState } from 'react';
import { Card, Button, Modal, ListGroup, Badge } from 'react-bootstrap';
import { AlertTriangle, Thermometer, Calendar, Zap, Info, ShieldCheck, Snowflake, Wind, Flame } from 'lucide-react';

const MeteoWarning = ({ data, dailyData }) => {
    const [showMeasures, setShowMeasures] = useState(false);

    // 1. Check for Local Frost Risk (Data-Driven from Daily Forecast)
    let frostRisk = null;

    if (dailyData && dailyData.length > 0) {
        const forecast = dailyData[0];
        const risks = [];

        // Check next 3 days
        for (let i = 1; i <= 3; i++) {
            const minTemp = forecast[`enDusukGun${i} `];
            if (minTemp !== undefined && minTemp <= 0) {
                risks.push({ day: i, temp: minTemp });
            }
        }

        if (risks.length > 0) {
            const minVal = Math.min(...risks.map(r => r.temp));
            const severe = minVal <= -4;

            // Calculte Date Range
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + risks[0].day);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + risks[risks.length - 1].day);

            frostRisk = {
                type: severe ? 'Kuvvetli Zirai Don' : 'Zirai Don Riski',
                minTemp: minVal,
                severity: severe ? 'Yüksek' : 'Orta',
                dates: `${startDate.getDate()} - ${endDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} `
            };
        }
    }

    const measures = [
        {
            title: "Pasif Önlemler (Önceden)",
            items: [
                "Soğuk havanın birikebileceği çukur alanlardan kaçının.",
                "Toprağı nemli ve düzgün tutun (ısı transferini artırır).",
                "Ağaç diplerini ot ve çalıdan temizleyin (güneş emilimini artırır)."
            ],
            icon: ShieldCheck,
            variant: "info"
        },
        {
            title: "Aktif Önlemler (Don Anında)",
            items: [
                "Yağmurlama sistemi varsa don başlangıcından itibaren çalıştırın. (Buz tabakası bitkiyi yalıtır).",
                "Saman/balya yakarak dumanlama yapın (ısı kaybını azaltır).",
                "Don pervaneleri kullanarak havayı karıştırın (inversiyonu kırar)."
            ],
            icon: Flame,
            variant: "danger"
        }
    ];

    // Prioritize Frost Risk for this MVP view
    if (!frostRisk) {
        return (
            <Card className="mgm-card mb-4 border-success border-start border-4">
                <Card.Body className="p-4 d-flex align-items-center">
                    <div className="bg-success bg-opacity-10 p-3 rounded-circle me-3 text-success">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h6 className="fw-bold mb-1 text-success">Risk Bulunmuyor</h6>
                        <small className="text-muted">Önümüzdeki günlerde zirai don riski beklenmiyor.</small>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    return (
        <>
            <Card className="mgm-card warning-card-compact mb-4">
                <Card.Body className="p-4">
                    <div className="d-flex align-items-center mb-3">
                        <AlertTriangle size={24} className="text-danger me-2" />
                        <h5 className="fw-bold text-danger mb-0">{frostRisk.type}!</h5>
                    </div>

                    <div className="d-flex flex-column gap-3 mb-4">
                        <div className="d-flex align-items-center">
                            <Thermometer className="text-muted me-3" size={20} />
                            <div>
                                <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>En Düşük</small>
                                <span className="fs-5 fw-bold text-dark">{frostRisk.minTemp}°C</span>
                            </div>
                        </div>

                        <div className="d-flex align-items-center">
                            <Calendar className="text-muted me-3" size={20} />
                            <div>
                                <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Tarih</small>
                                <span className="fs-6 fw-medium text-dark">{frostRisk.dates}</span>
                            </div>
                        </div>

                        <div className="d-flex align-items-center">
                            <Zap className="text-muted me-3" size={20} />
                            <div>
                                <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Etki Seviyesi</small>
                                <span className={`fs - 6 fw - bold ${frostRisk.severity === 'Yüksek' ? 'text-danger' : 'text-warning'} `}>
                                    {frostRisk.severity} ({frostRisk.minTemp}°C)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="d-grid gap-2">
                        <Button
                            variant="danger"
                            className="border-0 shadow-sm"
                            style={{ background: '#ef4444' }}
                            onClick={() => setShowMeasures(true)}
                        >
                            Koruyucu Önlemler →
                        </Button>
                    </div>

                    <div className="mt-3 pt-3 border-top d-flex align-items-start gap-2">
                        <Info size={14} className="text-muted mt-1 flex-shrink-0" />
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                            MGM tahmin verilerine dayalı otomatik analizdir. Resmi uyarı niteliği taşımaz.
                        </small>
                    </div>
                </Card.Body>
            </Card>

            <Modal show={showMeasures} onHide={() => setShowMeasures(false)} centered size="lg">
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title><ShieldCheck className="me-2" /> Zirai Don Korunma Yöntemleri</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <p className="lead mb-4">
                        Bölgenizde <strong>{frostRisk.dates}</strong> tarihleri arasında <strong>{frostRisk.minTemp}°C</strong> sıcaklık beklenmektedir.
                        Ürün kaybını en aza indirmek için aşağıdaki Bakanlık onaylı yöntemleri uygulayabilirsiniz.
                    </p>

                    {measures.map((m, idx) => (
                        <Card key={idx} className={`mb - 3 border - ${m.variant} shadow - sm`}>
                            <Card.Header className={`bg - ${m.variant} bg - opacity - 10 fw - bold text - ${m.variant} d - flex align - items - center`}>
                                <m.icon className="me-2" size={20} /> {m.title}
                            </Card.Header>
                            <ListGroup variant="flush">
                                {m.items.map((item, i) => (
                                    <ListGroup.Item key={i} className="py-3">
                                        <i className="bi bi-check2-circle text-success me-2"></i> {item}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card>
                    ))}

                    <div className="alert alert-secondary d-flex align-items-center mt-4">
                        <Info size={24} className="me-3" />
                        <div>
                            <strong>Önemli Not:</strong> Don hadisesi geçtikten sonra bitkilerinizi kontrol edin. Hasar gören dalları hemen budamayın, don riskinin tamamen geçtiğinden emin olun.
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowMeasures(false)}>Kapat</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default MeteoWarning;
