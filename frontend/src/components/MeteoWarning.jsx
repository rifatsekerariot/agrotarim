import React from 'react';
import { Alert, Card } from 'react-bootstrap';

const MeteoWarning = ({ data, dailyData }) => {
    // 1. Check for Official Warnings
    let allWarnings = data ? [...data] : [];

    // 2. Check for Local Frost Risk (Data-Driven)
    if (dailyData && dailyData.length > 0) {
        // Check next 3 days
        const nextFewDays = dailyData.slice(0, 3);
        const frostDays = nextFewDays.filter(day => day.enDusukSicaklik <= 0);

        if (frostDays.length > 0) {
            const minTemp = Math.min(...frostDays.map(d => d.enDusukSicaklik));
            const severe = minTemp <= -4;

            allWarnings.push({
                isLocal: true,
                renkKod: severe ? 'kirm' : 'tur',
                uyariNo: 'YEREL-DON',
                hadiseAdi: severe ? 'Kuvvetli Zirai Don' : 'Zirai Don Riski',
                derece: `Sıcaklık ${minTemp}°C seviyesine düşecek.`,
                baslangicZamani: new Date().toISOString(),
                bitisZamani: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString()
            });
        }
    }

    if (allWarnings.length === 0) {
        return (
            <Card className="mb-3 shadow-sm border-0">
                <Card.Body className="bg-light text-center rounded">
                    <span className="text-success fw-bold">
                        <i className="bi bi-check-circle-fill me-2"></i>
                        Şu an için bölgede meteorolojik uyarı bulunmuyor.
                    </span>
                </Card.Body>
            </Card>
        );
    }

    // Map warning levels to colors often used by MGM
    const getColor = (level) => {
        if (level === 'sar') return 'warning'; // Sari
        if (level === 'tur') return 'warning'; // Turuncu (Orange not stardand bs class, using warning)
        if (level === 'kirm') return 'danger'; // Kirmizi
        return 'info';
    };

    return (
        <Card className="mb-3 shadow-sm border-danger">
            <Card.Header className="bg-danger text-white">
                <i className="bi bi-exclamation-triangle-fill me-2"></i> Meteorolojik Uyarılar
            </Card.Header>
            <Card.Body>
                {allWarnings.map((warning, idx) => (
                    <Alert key={idx} variant={getColor(warning.renkKod)} className="mb-2">
                        {warning.isLocal && <span className="badge bg-danger mb-1">DATA ANALİZİ</span>}
                        {!warning.isLocal && <Alert.Heading className="fs-6">Uyarı No: {warning.uyariNo}</Alert.Heading>}

                        <p className="mb-0 small">
                            <strong>{warning.hadiseAdi}</strong> - {warning.derece}
                        </p>
                        <hr />
                        {!warning.isLocal && (
                            <p className="mb-0 small">
                                Başlangıç: {new Date(warning.baslangicZamani).toLocaleString()}<br />
                                Bitiş: {new Date(warning.bitisZamani).toLocaleString()}
                            </p>
                        )}
                        {warning.isLocal && (
                            <p className="mb-0 small text-muted">
                                * MGM resmi uyarısı değildir. Tahmin verilerine göre hesaplanmıştır.
                            </p>
                        )}
                    </Alert>
                ))}
            </Card.Body>
        </Card>
    );
};

export default MeteoWarning;
