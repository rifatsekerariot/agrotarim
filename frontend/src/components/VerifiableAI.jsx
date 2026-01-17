import React, { useEffect, useState } from 'react';
import { Card, Button, Alert, Row, Col, Badge, ListGroup } from 'react-bootstrap';
import { generateExpertAdvice } from '../utils/expertSystem';

const VerifiableAI = ({ riskData, dailyData, cropType = 'Genel' }) => {
    const [advice, setAdvice] = useState(null);
    const [showProof, setShowProof] = useState(false);

    useEffect(() => {
        if (riskData && riskData.raw_data && riskData.risk_report) {
            const result = generateExpertAdvice(riskData.raw_data, riskData.risk_report, cropType, dailyData);
            setAdvice(result);
        }
    }, [riskData, cropType]);

    if (!advice) return null;

    return (
        <Card className="shadow-sm mt-4 border-success">
            <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
                <span><i className="bi bi-robot"></i> AgroMeta Dijital Asistan</span>
                <Badge bg="light" text="dark" className="small">Hızlı & Güvenilir</Badge>
            </Card.Header>
            <Card.Body>
                {/* 1. Özet */}
                <Card.Text className="lead fs-6 text-dark">
                    {advice.summary}
                </Card.Text>

                <hr className="my-2" />

                {/* 2. Uyarılar */}
                {advice.alerts.length > 0 ? (
                    <div className="mb-3">
                        <h6 className="text-muted small fw-bold">RİSK ANALİZİ</h6>
                        {advice.alerts.map((alert, idx) => (
                            <Alert key={idx} variant={alert.level} className="py-2 px-3 mb-2 small fw-bold">
                                {alert.text}
                            </Alert>
                        ))}
                    </div>
                ) : (
                    <Alert variant="success" className="py-2 px-3 mb-3 small">
                        <i className="bi bi-check-circle"></i> Şu an için aktif bir meteorolojik risk (Don, Fırtına vb.) tespit edilmedi.
                    </Alert>
                )}

                {/* 3. Tavsiyeler */}
                <div>
                    <h6 className="text-muted small fw-bold">ÇİFTÇİ TAVSİYELERİ</h6>
                    <ListGroup variant="flush" className="small">
                        {advice.actionable.map((item, idx) => (
                            <ListGroup.Item key={idx} className="px-0 py-1">
                                {item}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>

                {/* Proof Toggle */}
                <div className="mt-3 text-end">
                    <Button variant="link" size="sm" className="text-muted p-0 text-decoration-none" onClick={() => setShowProof(!showProof)}>
                        {showProof ? 'Veri Kaynaklarını Gizle' : 'Veri Kaynaklarını Göster'}
                    </Button>
                </div>

                {showProof && (
                    <Alert variant="secondary" className="mt-2 bg-light">
                        <h6 className="small fw-bold"><i className="bi bi-code-slash"></i> Analiz Edilen Ham Veri</h6>
                        <pre className="small mb-0" style={{ maxHeight: '150px', overflow: 'auto', fontSize: '10px' }}>
                            {JSON.stringify(riskData, null, 2)}
                        </pre>
                    </Alert>
                )}
            </Card.Body>
        </Card>
    );
};

export default VerifiableAI;
