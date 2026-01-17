import React from 'react';
import { Card, Table } from 'react-bootstrap';

const HourlyForecast = ({ data }) => {
    if (!data || data.length === 0 || !data[0].tahmin) return null;

    const forecasts = data[0].tahmin;

    // Helper to format time
    const formatTime = (dateStr) => {
        return new Date(dateStr).getHours() + ":00";
    };

    // Helper for Spray Suitability (Logic from Angular code)
    const getSprayStatus = (item) => {
        let score = 0;
        if (!item.hadise.includes('Y') && item.hadise !== 'K') score++;
        if (item.sicaklik >= 10 && item.sicaklik <= 25) score++;
        if (item.ruzgarHizi >= 0 && item.ruzgarHizi <= 19) score++;
        if (item.nem >= 30 && item.nem <= 85) score++;

        if (score === 4) return { text: 'Uygun', color: 'success' };
        return { text: 'Uygun Değil', color: 'danger' };
    };

    return (
        <Card className="mb-3 shadow-sm">
            <Card.Header className="bg-info text-white">
                <i className="bi bi-clock-history me-2"></i> Saatlik Tahmin & İlaçlama
            </Card.Header>
            <Card.Body>
                <div className="table-responsive">
                    <Table bordered hover size="sm" className="text-center align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Saat</th>
                                <th>Sıcaklık</th>
                                <th>Hadise</th>
                                <th>Rüzgar</th>
                                <th>Nem</th>
                                <th>İlaçlama</th>
                            </tr>
                        </thead>
                        <tbody>
                            {forecasts.map((item, idx) => {
                                const spray = getSprayStatus(item);
                                return (
                                    <tr key={idx}>
                                        <td className="fw-bold">{formatTime(item.tarih)}</td>
                                        <td>{item.sicaklik}°C</td>
                                        <td>{item.hadise}</td>
                                        <td>{item.ruzgarHizi} km/s</td>
                                        <td>%{item.nem}</td>
                                        <td>
                                            <span className={`badge bg-${spray.color}`}>
                                                {spray.text}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>
            </Card.Body>
        </Card>
    );
};

export default HourlyForecast;
