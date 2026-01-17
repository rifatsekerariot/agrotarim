import React, { useState } from 'react';
import { Button, ButtonGroup, Badge } from 'react-bootstrap';

const RelayWidget = ({ data, settings = {}, onCommand }) => {
    const { channelCount = 4 } = settings;
    const labels = settings.labels || Array.from({ length: channelCount }, (_, i) => `Röle ${i + 1}`);

    // Get relay states from data or initialize
    const [states, setStates] = useState(
        data?.states || Array.from({ length: channelCount }, () => false)
    );

    const handleToggle = async (index) => {
        const newStates = [...states];
        newStates[index] = !newStates[index];
        setStates(newStates);

        // Send command if handler provided
        if (onCommand) {
            try {
                await onCommand({
                    type: 'relay',
                    channel: index,
                    value: newStates[index] ? 1 : 0
                });
            } catch (error) {
                console.error('Relay command failed:', error);
                // Revert on error
                newStates[index] = !newStates[index];
                setStates(newStates);
            }
        }
    };

    return (
        <div className="d-flex flex-column h-100 p-2">
            <div className="flex-grow-1 d-flex flex-column gap-2 justify-content-center">
                {labels.slice(0, channelCount).map((label, idx) => (
                    <div key={idx} className="d-flex align-items-center justify-content-between px-2 py-2 bg-light rounded">
                        <div className="d-flex align-items-center gap-2">
                            <div
                                className={`rounded-circle ${states[idx] ? 'bg-success' : 'bg-secondary'}`}
                                style={{ width: '10px', height: '10px' }}
                            ></div>
                            <span className="small fw-medium">{label}</span>
                        </div>
                        <Button
                            size="sm"
                            variant={states[idx] ? 'success' : 'outline-secondary'}
                            onClick={() => handleToggle(idx)}
                            style={{ minWidth: '60px' }}
                        >
                            {states[idx] ? 'AÇIK' : 'KAPALI'}
                        </Button>
                    </div>
                ))}
            </div>

            {/* Status Bar */}
            <div className="mt-2 pt-2 border-top d-flex justify-content-between align-items-center">
                <span className="text-muted small">
                    {states.filter(s => s).length}/{channelCount} Aktif
                </span>
                <ButtonGroup size="sm">
                    <Button variant="outline-success" size="sm" onClick={() => setStates(states.map(() => true))}>
                        Tümü Aç
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => setStates(states.map(() => false))}>
                        Tümü Kapat
                    </Button>
                </ButtonGroup>
            </div>
        </div>
    );
};

export default RelayWidget;
