import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const TempTrendWidget = ({ data }) => {
    const temp = data?.value || 24.5;
    const min = 18;
    const max = 32;
    // Mock sparkline 24h
    const chartData = [20, 21, 22, 24, 28, 30, 32, 31, 29, 27, 26, 25, 24.5].map(v => ({ v }));

    return (
        <div className="d-flex flex-column h-100 p-2">
            <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-muted small fw-bold">Şimdi</span>
                <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill">↗️ Artıyor</span>
            </div>
            <div className="h1 fw-bold text-dark mb-3">{temp}°C</div>

            <div className="flex-grow-1" style={{ minHeight: '40px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#dc3545" stopOpacity={0.5} />
                                <stop offset="95%" stopColor="#dc3545" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="v" stroke="#dc3545" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="d-flex justify-content-between small text-muted mt-2 pt-2 border-top">
                <span>Min: {min}°</span>
                <span>Max: {max}°</span>
            </div>
        </div>
    );
};

export default TempTrendWidget;
