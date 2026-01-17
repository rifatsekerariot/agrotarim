import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { Badge } from 'react-bootstrap';

const TempTrendWidget = ({ data, settings = {}, deviceSerial, sensorCode }) => {
    const currentValue = data?.value ?? null;
    const { minTemp = -10, maxTemp = 50 } = settings;

    const [history, setHistory] = useState([]);
    const [trend, setTrend] = useState({ type: 'stable', icon: '→', label: 'Stabil' });

    // Fetch real history data from backend
    useEffect(() => {
        if (!deviceSerial || !sensorCode) return;

        const fetchHistory = async () => {
            try {
                const res = await fetch(`/api/telemetry/history/${deviceSerial}?hours=1`);
                const json = await res.json();

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

                        if (diff > 0.5) {
                            setTrend({ type: 'up', icon: '↑', label: 'Yükseliyor' });
                        } else if (diff < -0.5) {
                            setTrend({ type: 'down', icon: '↓', label: 'Düşüyor' });
                        } else {
                            setTrend({ type: 'stable', icon: '→', label: 'Stabil' });
                        }
                    }
                }
            } catch (error) {
                console.error('TempTrend history fetch error:', error);
            }
        };

        fetchHistory();
        const interval = setInterval(fetchHistory, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [deviceSerial, sensorCode]);

    // No data state
    if (currentValue === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>📈</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    const chartData = history.length > 0 ? history : [{ time: 'Şimdi', value: currentValue }];

    return (
        <div className="d-flex flex-column h-100 p-2">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <span className="h4 fw-bold text-primary mb-0">{currentValue.toFixed(1)}°C</span>
                </div>
                <Badge bg={trend.type === 'up' ? 'danger' : trend.type === 'down' ? 'info' : 'secondary'}>
                    {trend.icon} {trend.label}
                </Badge>
            </div>

            {/* Chart */}
            <div className="flex-grow-1" style={{ minHeight: '60px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <YAxis domain={['auto', 'auto']} hide />
                        <Tooltip
                            formatter={(value) => [`${value.toFixed(1)}°C`, 'Sıcaklık']}
                            contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#0d6efd"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Time Range & Stats */}
            <div className="d-flex justify-content-between small text-muted mt-1">
                <span>Son 1 saat</span>
                {history.length > 0 && (
                    <span>
                        Min: {Math.min(...history.map(h => h.value)).toFixed(1)}° /
                        Max: {Math.max(...history.map(h => h.value)).toFixed(1)}°
                    </span>
                )}
            </div>
        </div>
    );
};

export default TempTrendWidget;
