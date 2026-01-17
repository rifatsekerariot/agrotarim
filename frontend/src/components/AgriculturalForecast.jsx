import React from 'react';
import { Card, Table } from 'react-bootstrap';

const AgriculturalForecast = ({ data }) => {
    if (!data) return null;

    // Helper function ported from 'kaliteKontrol' filter
    const formatValue = (val, decimals = null) => {
        if (val === undefined || val === null || val === -9999 || val === "-9999") {
            return "-";
        }
        if (decimals !== null && typeof val === 'number') {
            return val.toFixed(decimals);
        }
        return val;
    };

    return (
        <Card className="mb-3 shadow-sm">
            <Card.Header className="bg-success text-white">
                <i className="bi bi-flower1 me-2"></i> Tarımsal Tahmin Raporu
            </Card.Header>
            <Card.Body>
                <Table striped bordered hover responsive size="sm">
                    <tbody>
                        <tr>
                            <td>Dün Etkili Sıcaklık</td>
                            <td className="fw-bold">{formatValue(data.dunEtkiliSicak, 1)} °C</td>
                        </tr>
                        <tr>
                            <td>Dün Toprak Üstü Min. Sıcaklık</td>
                            <td className="fw-bold">{formatValue(data.dunToprakUstuMin, 1)} °C</td>
                        </tr>
                        <tr>
                            <td>Dün Toprak Altı (10cm) Min-Max</td>
                            <td className="fw-bold">
                                {formatValue(data.dunMintoprakalti10, 1)} / {formatValue(data.dunMaxtoprakalti10, 1)} °C
                            </td>
                        </tr>
                        <tr>
                            <td>Toplam Sıcaklık (GDD)</td>
                            <td className="fw-bold">{formatValue(data.ToplamSicaklik, 1)}</td>
                        </tr>
                        <tr>
                            <td>Toplam Soğuklama</td>
                            <td className="fw-bold">{formatValue(data.ToplamSoguklama)} saat</td>
                        </tr>
                        <tr>
                            <td>Toplam Yağış</td>
                            <td className="fw-bold">{formatValue(data.ToplamYagis, 1)} mm</td>
                        </tr>
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
};

export default AgriculturalForecast;
