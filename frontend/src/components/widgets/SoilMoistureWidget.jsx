import React from 'react';
import { ProgressBar } from 'react-bootstrap';

const SoilMoistureWidget = ({ data }) => {
    // Mock Data
    const zones = data?.zones || [
        { name: 'Bölge A', value: 70 },
        { name: 'Bölge B', value: 40 },
        { name: 'Bölge C', value: 80 },
        { name: 'Bölge D', value: 60 }
    ];

    // Calculate Average
    const average = Math.round(zones.reduce((acc, curr) => acc + curr.value, 0) / zones.length);

    const getVariant = (val) => {
        if (val < 45) return 'danger';
        if (val < 65) return 'warning';
        return 'success';
    };

    return (
        <div className="d-flex flex-column h-100 p-2">
            <div className="flex-grow-1 overflow-auto custom-scrollbar pe-1">
                {zones.map((zone, idx) => (
                    <div key={idx} className="mb-3">
                        <div className="d-flex justify-content-between mb-1 small fw-bold">
                            <span>{zone.name}</span>
                            <span className={`text-${getVariant(zone.value)}`}>{zone.value}%</span>
                        </div>
                        <ProgressBar
                            now={zone.value}
                            variant={getVariant(zone.value)}
                            style={{ height: '8px', borderRadius: '4px' }}
                        />
                    </div>
                ))}
            </div>

            <div className="mt-2 pt-2 border-top">
                <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted fw-bold small">Ortalama Nem</span>
                    <span className="badge bg-secondary rounded-pill">{average}%</span>
                </div>
            </div>
        </div>
    );
};

export default SoilMoistureWidget;
