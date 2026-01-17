import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { Badge } from 'react-bootstrap';

const HumidityTrendWidget = ({ data, settings = {} }) => {
    const currentValue = data?.value ?? null;
    const history = data?.history ?? [];
    const { warningLow = 30, warningHigh = 80 } = settings;

    // No data state
    if (currentValue === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>💧</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    // Generate mock history if not provided
    const chartData = history.length > 0
        ? history
        : Array.from({ length: 12 }, (_, i) => ({
            time: i,
            value: currentValue + (Math.random() - 0.5) * 10
        }));

    // Determine status
    let status = 'Normal';
    let variant = 'success';
    if (currentValue < warningLow) { status = 'Düşük'; variant = 'warning'; }
    if (currentValue > warningHigh) { status = 'Yüksek'; variant = 'warning'; }

    return (
        <div className="d-flex flex-column h-100 p-2">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <span className="h4 fw-bold text-info mb-0">{currentValue.toFixed(0)}%</span>
                </div>
                <Badge bg={variant}>
                    {status}
                </Badge>
            </div>

            {/* Chart */}
            <div className="flex-grow-1" style={{ minHeight: '60px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <YAxis domain={[0, 100]} hide />
                        <Tooltip
                            formatter={(value) => [`${value.toFixed(0)}%`, 'Nem']}
                            contentStyle={{ fontSize: '12px' }}
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
            <div className="text-center small text-muted">
                Optimal: {warningLow}% - {warningHigh}%
            </div>
        </div>
    );
};

export default HumidityTrendWidget;
