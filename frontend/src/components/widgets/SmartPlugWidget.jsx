import React from 'react';
import { Badge } from 'react-bootstrap';

const SmartPlugWidget = ({ data, settings = {}, onCommand }) => {
    const isOn = data?.state ?? data?.value ?? null;
    const power = data?.power ?? null;
    const { maxPower = 3000, costPerKwh = 2.5 } = settings;

    // No data state
    if (isOn === null) {
        return (
            <div className="d-flex flex-column h-100 p-2 justify-content-center align-items-center text-center">
                <div className="text-muted mb-2" style={{ fontSize: '2rem' }}>🔌</div>
                <p className="text-muted mb-0 small">Sensör Bağlı Değil</p>
            </div>
        );
    }

    const active = isOn === 1 || isOn === true;

    const handleToggle = async () => {
        if (onCommand) {
            try {
                await onCommand({
                    type: 'smart_plug',
                    state: !active
                });
            } catch (error) {
                console.error('Smart plug command failed:', error);
            }
        }
    };

    return (
        <div className="d-flex flex-column h-100 p-2 justify-content-center text-center">
            {/* Plug Icon */}
            <div
                className="mb-3 cursor-pointer"
                style={{ fontSize: '3rem', cursor: 'pointer' }}
                onClick={handleToggle}
            >
                {active ? '🔌' : '⭕'}
            </div>

            {/* Status */}
            <Badge
                bg={active ? 'success' : 'secondary'}
                className="mx-auto mb-2 px-3 py-2"
                style={{ cursor: 'pointer' }}
                onClick={handleToggle}
            >
                {active ? 'AÇIK' : 'KAPALI'}
            </Badge>

            {/* Power Reading */}
            {power !== null && active && (
                <div className="mt-2">
                    <div className="h5 mb-0 text-primary">{power.toFixed(0)} W</div>
                    <div className="small text-muted">
                        ~{(power * costPerKwh / 1000).toFixed(2)} TL/saat
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartPlugWidget;
