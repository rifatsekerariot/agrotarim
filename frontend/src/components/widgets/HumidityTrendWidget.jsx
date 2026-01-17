import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const HumidityTrendWidget = ({ data }) => {
    const hum = data?.value || 68;
    const min = 45;
    const max = 85;
    // Mock sparkline 24h
    const chartData = [80, 78, 75, 70, 65, 60, 55, 50, 55, 60, 65, 68].map(v => ({ v }));

    return (
        <div className="d-flex flex-column h-100 p-2">
            <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-muted small fw-bold">Şimdi</span>
                <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill">↘️ Düşüyor</span>
            </div>
            <div className="h1 fw-bold text-dark mb-3">{hum}%</div>

            <div className="flex-grow-1" style={{ minHeight: '40px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.5} />
                                <stop offset="95%" stopColor="#0d6efd" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="v" stroke="#0d6efd" strokeWidth={2} fillOpacity={1} fill="url(#colorHum)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="d-flex justify-content-between small text-muted mt-2 pt-2 border-top">
                <span>Min: {min}%</span>
                <span>Max: {max}%</span>
            </div>
        </div>
    );
};

export default HumidityTrendWidget;
