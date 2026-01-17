import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { Badge } from 'react-bootstrap';

const TempTrendWidget = ({ data, settings = {} }) => {
    const currentValue = data?.value ?? null;
    const history = data?.history ?? [];
    const { minTemp = -10, maxTemp = 50 } = settings;

    // No data state
    if (currentValue === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>📈</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    // Generate mock history if not provided
    const chartData = history.length > 0
        ? history
        : Array.from({ length: 12 }, (_, i) => ({
            time: i,
            value: currentValue + (Math.random() - 0.5) * 5
        }));

    // Determine trend
    let trend = 'stable';
    let trendIcon = '→';
    if (chartData.length >= 2) {
        const last = chartData[chartData.length - 1]?.value || currentValue;
        const prev = chartData[chartData.length - 2]?.value || currentValue;
        if (last > prev + 0.5) { trend = 'up'; trendIcon = '↑'; }
        if (last < prev - 0.5) { trend = 'down'; trendIcon = '↓'; }
    }

    return (
        <div className="d-flex flex-column h-100 p-2">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <span className="h4 fw-bold text-primary mb-0">{currentValue.toFixed(1)}°C</span>
                </div>
                <Badge bg={trend === 'up' ? 'danger' : trend === 'down' ? 'info' : 'secondary'}>
                    {trendIcon} {trend === 'up' ? 'Yükseliyor' : trend === 'down' ? 'Düşüyor' : 'Stabil'}
                </Badge>
            </div>

            {/* Chart */}
            <div className="flex-grow-1" style={{ minHeight: '60px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <YAxis domain={[minTemp, maxTemp]} hide />
                        <Tooltip
                            formatter={(value) => [`${value.toFixed(1)}°C`, 'Sıcaklık']}
                            contentStyle={{ fontSize: '12px' }}
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

            {/* Time Range */}
            <div className="text-center small text-muted">
                Son 1 saat
            </div>
        </div>
    );
};

export default TempTrendWidget;
