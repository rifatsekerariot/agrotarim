import React, { useState } from 'react';
import { Form, Badge, Button } from 'react-bootstrap';

const ServoWidget = ({ data, settings = {}, onCommand }) => {
    const currentAngle = data?.value ?? null;
    const { minAngle = 0, maxAngle = 180, step = 1 } = settings;

    const [angle, setAngle] = useState(currentAngle ?? minAngle);

    const handleChange = async (newAngle) => {
        setAngle(newAngle);

        if (onCommand) {
            try {
                await onCommand({
                    type: 'servo',
                    angle: newAngle
                });
            } catch (error) {
                console.error('Servo command failed:', error);
            }
        }
    };

    // Calculate rotation for visual
    const rotation = ((angle - minAngle) / (maxAngle - minAngle)) * 180;

    return (
        <div className="d-flex flex-column h-100 p-2">
            {/* Servo Visual */}
            <div className="flex-grow-1 d-flex align-items-center justify-content-center">
                <div className="position-relative" style={{ width: '100px', height: '60px' }}>
                    {/* Base */}
                    <div
                        className="position-absolute bottom-0 start-50 translate-middle-x bg-secondary"
                        style={{ width: '40px', height: '20px', borderRadius: '4px' }}
                    ></div>

                    {/* Arm */}
                    <div
                        className="position-absolute bg-primary"
                        style={{
                            width: '8px',
                            height: '45px',
                            bottom: '15px',
                            left: '50%',
                            transformOrigin: 'bottom center',
                            transform: `translateX(-50%) rotate(${rotation - 90}deg)`,
                            borderRadius: '4px',
                            transition: 'transform 0.3s ease'
                        }}
                    >
                        <div
                            className="position-absolute bg-white rounded-circle"
                            style={{ width: '12px', height: '12px', top: '-6px', left: '-2px' }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Angle Display */}
            <div className="text-center mb-2">
                <span className="h4 fw-bold text-primary">{angle}°</span>
            </div>

            {/* Slider */}
            <div className="px-2">
                <Form.Range
                    min={minAngle}
                    max={maxAngle}
                    step={step}
                    value={angle}
                    onChange={(e) => handleChange(parseInt(e.target.value))}
                />
                <div className="d-flex justify-content-between small text-muted">
                    <span>{minAngle}°</span>
                    <span>{maxAngle}°</span>
                </div>
            </div>

            {/* Quick Positions */}
            <div className="d-flex gap-1 mt-2 justify-content-center">
                <Button size="sm" variant="outline-secondary" onClick={() => handleChange(minAngle)}>
                    {minAngle}°
                </Button>
                <Button size="sm" variant="outline-secondary" onClick={() => handleChange((minAngle + maxAngle) / 2)}>
                    90°
                </Button>
                <Button size="sm" variant="outline-secondary" onClick={() => handleChange(maxAngle)}>
                    {maxAngle}°
                </Button>
            </div>
        </div>
    );
};

export default ServoWidget;
