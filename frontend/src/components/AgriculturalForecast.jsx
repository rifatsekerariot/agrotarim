import React from 'react';
import { Card, Table } from 'react-bootstrap';

const AgriculturalForecast = ({ data }) => {
    if (!data) return null;

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
                            <td className="fw-bold">{data.dunEtkiliSicak || '-'} °C</td>
                        </tr>
                        <tr>
                            <td>Dün Toprak Üstü Min. Sıcaklık</td>
                            <td className="fw-bold">{data.dunToprakUstuMin || '-'} °C</td>
                        </tr>
                        <tr>
                            <td>Dün Toprak Altı (10cm) Min-Max</td>
                            <td className="fw-bold">
                                {data.dunMintoprakalti10 || '-'} / {data.dunMaxtoprakalti10 || '-'} °C
                            </td>
                        </tr>
                        <tr>
                            <td>Toplam Sıcaklık (GDD)</td>
                            <td className="fw-bold">{data.ToplamSicaklik || '-'}</td>
                        </tr>
                        <tr>
                            <td>Toplam Soğuklama</td>
                            <td className="fw-bold">{data.ToplamSoguklama || '-'} saat</td>
                        </tr>
                        <tr>
                            <td>Toplam Yağış</td>
                            <td className="fw-bold">{data.ToplamYagis || '0'} mm</td>
                        </tr>
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
};

export default AgriculturalForecast;
