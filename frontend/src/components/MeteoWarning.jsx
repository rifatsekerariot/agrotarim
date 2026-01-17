import React from 'react';
import { Alert, Card } from 'react-bootstrap';

const MeteoWarning = ({ data }) => {
    // data is array of warnings. If empty, no warning.

    if (!data || data.length === 0) {
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
                {data.map((warning, idx) => (
                    <Alert key={idx} variant={getColor(warning.renkKod)} className="mb-2">
                        <Alert.Heading className="fs-6">Uyarı No: {warning.uyariNo}</Alert.Heading>
                        <p className="mb-0 small">
                            {warning.hadiseAdi} - <strong>{warning.derece}</strong>
                        </p>
                        <hr />
                        <p className="mb-0 small">
                            Başlangıç: {new Date(warning.baslangicZamani).toLocaleString()}<br />
                            Bitiş: {new Date(warning.bitisZamani).toLocaleString()}
                        </p>
                    </Alert>
                ))}
            </Card.Body>
        </Card>
    );
};

export default MeteoWarning;
