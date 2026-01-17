import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const WaterFlowWidget = ({ data }) => {
    // Mock Data
    const currentFlow = data?.flow || 45; // L/dk
    const dailyTotal = data?.daily || 1240; // L
    const chartData = data?.history || [
        { v: 30 }, { v: 40 }, { v: 35 }, { v: 50 }, { v: 45 }, { v: 60 }, { v: 45 }
    ];

    return (
        <div className="d-flex flex-column h-100 p-2">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                    <div className="h2 fw-bold text-primary mb-0">{currentFlow} <span className="fs-6 text-muted">L/dk</span></div>
                    <div className="text-success small fw-bold">
                        <i className="bi bi-arrow-right-circle-fill me-1"></i> Akış Normal
                    </div>
                </div>
                <div className="text-primary opacity-25">
                    <i className="bi bi-water" style={{ fontSize: '2.5rem' }}></i>
                </div>
            </div>

            <div className="mt-auto">
                <div className="d-flex justify-content-between align-items-end mb-1">
                    <span className="text-muted small">Bugün: <strong>{dailyTotal.toLocaleString()} L</strong></span>
                    <span className="text-muted small" style={{ fontSize: '0.7rem' }}>Son 7 Gün</span>
                </div>

                <div style={{ height: '40px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#0d6efd" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke="#0d6efd" strokeWidth={2} fillOpacity={1} fill="url(#colorFlow)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default WaterFlowWidget;
