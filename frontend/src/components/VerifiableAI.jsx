import React, { useEffect, useState } from 'react';
import { Card, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useWebLLM } from '../hooks/useWebLLM';

const VerifiableAI = ({ riskData }) => {
    const { initEngine, generate, output, progress, isLoading, isReady } = useWebLLM();
    const [showProof, setShowProof] = useState(false);

    useEffect(() => {
        if (!riskData) return;
        // Auto-generate if engine is ready, or prompt user to load
        if (isReady) {
            runAnalysis();
        }
    }, [riskData, isReady]);

    // Helper to remove -9999 values to avoid confusing the AI
    const filterInvalidValues = (obj) => {
        const clean = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== -9999 && value !== "-9999" && value !== null) {
                if (typeof value === 'object' && !Array.isArray(value)) {
                    clean[key] = filterInvalidValues(value);
                } else {
                    clean[key] = value;
                }
            }
        }
        return clean;
    };

    const runAnalysis = () => {
        // Clean the data first
        const cleanData = {
            weather: filterInvalidValues(riskData.raw_data),
            risks: riskData.risk_report
        };

        const messages = [
            {
                role: "system",
                content: `Sen deneyimli bir Ziraat Mühendisisin. Adın 'AgroMeta'.
Görevin: Aşağıdaki hava durumu verilerini inceleyerek çiftçiye samimi, anlaşılır ve Türkçe tavsiyeler vermek.

Kurallar:
1. ASLA "-9999" veya "null" gibi teknik hata kodlarından bahsetme. Bu verileri görmezden gel.
2. Çiftçi diliyle konuş (Örn: "Nem oranı iyi", "Rüzgar biraz sert" gibi).
3. "Risk Raporu"ndaki (risks) uyarılara mutlaka dikkat et.
4. "spraying_suitable" (İlaçlama) true ise "İlaçlama yapabilirsiniz", false ise "İlaçlama için uygun değil" de.
5. Cevabın kısa, öz olsun ve maddeler halinde ver.`
            },
            {
                role: "user",
                content: `İşte sahadan gelen güncel veriler:
${JSON.stringify(cleanData, null, 2)}

Bu duruma göre çiftçiye ne tavsiye edersin?`
            }
        ];
        generate(messages);
    };

    return (
        <Card className="shadow-sm mt-4">
            <Card.Header className="bg-success text-white">
                <i className="bi bi-robot"></i> Yapay Zeka Ziraat Mühendisi
            </Card.Header>
            <Card.Body>
                {!isReady && (
                    <div className="text-center p-3">
                        <p>Yapay Zeka Modeli tarayıcınıza yüklenmeli (sadece ilk seferde).</p>
                        <Button onClick={initEngine} disabled={isLoading}>
                            {isLoading ? 'Model Yükleniyor...' : 'AI Modelini Yükle (Local WebGPU)'}
                        </Button>
                        {progress && <div className="mt-2 text-muted small">{progress}</div>}
                    </div>
                )}

                {isReady && (
                    <>
                        <div className="mb-3">
                            {output ? (
                                <div className="p-3 bg-light rounded border-start border-4 border-success">
                                    {output}
                                </div>
                            ) : (
                                <div className="text-muted">Analiz bekleniyor...</div>
                            )}
                        </div>

                        <div className="d-flex justify-content-between align-items-center">
                            <Button variant="outline-secondary" size="sm" onClick={() => setShowProof(!showProof)}>
                                {showProof ? 'Ham Veri Kanıtını Gizle' : 'Ham Veri Kanıtını Göster (İspat)'}
                            </Button>
                            {!output && <Button onClick={runAnalysis} size="sm">Analiz Et</Button>}
                        </div>

                        {showProof && (
                            <Alert variant="warning" className="mt-3">
                                <h6><i className="bi bi-shield-lock"></i> Doğrulama Katmanı (Proof of Truth)</h6>
                                <p className="small mb-1">
                                    Aşağıdaki veriler Meteoroloji Genel Müdürlüğü'nden (MGM) alınmış ve sunucuda işlenmiştir.
                                    Yapay Zekanın yukarıdaki yorumu bu kesin verilere dayanmalıdır.
                                </p>
                                <pre className="bg-white p-2 border rounded small" style={{ maxHeight: '200px', overflow: 'auto' }}>
                                    {JSON.stringify(riskData, null, 2)}
                                </pre>
                            </Alert>
                        )}
                    </>
                )}
            </Card.Body>
        </Card>
    );
};

export default VerifiableAI;
