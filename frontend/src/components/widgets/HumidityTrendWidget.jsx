import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { Badge } from 'react-bootstrap';
import api from '../../utils/api';

const HumidityTrendWidget = ({ data, settings = {}, deviceSerial, sensorCode }) => {
    const currentValue = data?.value ?? null;
    const { warningLow = 30, warningHigh = 80 } = settings;

    const [history, setHistory] = useState([]);
    const [trend, setTrend] = useState({ type: 'stable', icon: '→', label: 'Stabil' });

    // Fetch real history data from backend
    useEffect(() => {
        if (!deviceSerial || !sensorCode) return;

        const fetchHistory = async () => {
            try {
                const res = await api.get(`/telemetry/history/${deviceSerial}?hours=4`);
                const json = res.data;

                if (json[sensorCode] && json[sensorCode].length > 0) {
                    const formatted = json[sensorCode]
                        .map(point => ({
                            time: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            value: point.value,
                            timestamp: new Date(point.timestamp).getTime()
                        }))
                        .sort((a, b) => a.timestamp - b.timestamp);

                    setHistory(formatted);

                    // Calculate real trend from last 10 data points
                    if (formatted.length >= 5) {
                        const recentPoints = formatted.slice(-10);
                        const firstHalf = recentPoints.slice(0, Math.floor(recentPoints.length / 2));
                        const secondHalf = recentPoints.slice(Math.floor(recentPoints.length / 2));

                        const avgFirst = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
                        const avgSecond = secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;

                        const diff = avgSecond - avgFirst;

                        if (diff > 2) {
                            setTrend({ type: 'up', icon: '↑', label: 'Yükseliyor' });
                        } else if (diff < -2) {
                            setTrend({ type: 'down', icon: '↓', label: 'Düşüyor' });
                        } else {
                            setTrend({ type: 'stable', icon: '→', label: 'Stabil' });
                        }
                    }
                }
            } catch (error) {
                console.error('HumidityTrend history fetch error:', error);
            }
        };

        fetchHistory();
        const interval = setInterval(fetchHistory, 60000);
        return () => clearInterval(interval);
    }, [deviceSerial, sensorCode]);

    // No data state
    if (currentValue === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>💧</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    // Determine status
    let status = 'Normal';
    let variant = 'success';
    if (currentValue < warningLow) { status = 'Düşük'; variant = 'warning'; }
    if (currentValue > warningHigh) { status = 'Yüksek'; variant = 'warning'; }

    const chartData = history.length > 0 ? history : [{ time: 'Şimdi', value: currentValue }];

    return (
        <div className="d-flex flex-column h-100 p-2">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <span className="h4 fw-bold text-info mb-0">{currentValue.toFixed(0)}%</span>
                </div>
                <div className="d-flex gap-1">
                    <Badge bg={variant} style={{ fontSize: '0.7rem' }}>{status}</Badge>
                    <Badge bg={trend.type === 'up' ? 'danger' : trend.type === 'down' ? 'info' : 'secondary'}>
                        {trend.icon}
                    </Badge>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-grow-1" style={{ minHeight: '60px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <YAxis domain={[0, 100]} hide />
                        <Tooltip
                            formatter={(value) => [`${value.toFixed(0)}%`, 'Nem']}
                            contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#17a2b8"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Range */}
            <div className="d-flex justify-content-between small text-muted mt-1">
                <span>Son 1 saat</span>
                <span>Optimal: {warningLow}%-{warningHigh}%</span>
            </div>
        </div>
    );
};

export default HumidityTrendWidget;
