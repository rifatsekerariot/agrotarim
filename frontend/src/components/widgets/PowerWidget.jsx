import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const PowerWidget = ({ data }) => {
    // Mock Data
    const voltage = 228;
    const current = 5.2;
    const power = 1185;

    // Sparkline data
    const chartData = [500, 800, 1200, 1100, 1150, 1185, 1180, 1190, 1185].map(v => ({ v }));

    return (
        <div className="d-flex flex-column h-100 p-2">
            <div className="row mb-3">
                <div className="col-6 mb-2">
                    <small className="text-muted d-block">Voltaj</small>
                    <span className="fw-bold">{voltage}V</span> <span className="text-success small">●</span>
                </div>
                <div className="col-6 mb-2">
                    <small className="text-muted d-block">Akım</small>
                    <span className="fw-bold">{current}A</span>
                </div>
                <div className="col-12 border-top pt-2">
                    <small className="text-muted d-block fw-bold">ANLIK GÜÇ</small>
                    <span className="h3 fw-bold text-primary">{power.toLocaleString()}</span> <span className="text-muted">W</span>
                </div>
            </div>

            <div className="mt-auto" style={{ height: '50px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ffc107" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#ffc107" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="v" stroke="#ffc107" strokeWidth={2} fillOpacity={1} fill="url(#colorPower)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PowerWidget;
