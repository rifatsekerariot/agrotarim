import React, { useState } from 'react';
import { Form, Badge } from 'react-bootstrap';

const PWMWidget = ({ data, settings = {}, onCommand }) => {
    const currentValue = data?.value ?? null;
    const { minValue = 0, maxValue = 100, unit = '%', label = 'PWM Çıkış' } = settings;

    const [sliderValue, setSliderValue] = useState(currentValue ?? minValue);

    const handleChange = async (newValue) => {
        setSliderValue(newValue);

        if (onCommand) {
            try {
                await onCommand({
                    type: 'pwm',
                    value: newValue
                });
            } catch (error) {
                console.error('PWM command failed:', error);
            }
        }
    };

    return (
        <div className="d-flex flex-column h-100 p-2">
            {/* Label */}
            <div className="text-center mb-2">
                <span className="text-muted small">{label}</span>
            </div>

            {/* Current Value Display */}
            <div className="text-center mb-3">
                <span className="display-6 fw-bold text-primary">{sliderValue}</span>
                <span className="text-muted ms-1">{unit}</span>
            </div>

            {/* Slider */}
            <div className="flex-grow-1 d-flex flex-column justify-content-center px-2">
                <Form.Range
                    min={minValue}
                    max={maxValue}
                    value={sliderValue}
                    onChange={(e) => handleChange(parseInt(e.target.value))}
                    className="custom-range"
                />

                {/* Range Labels */}
                <div className="d-flex justify-content-between small text-muted mt-1">
                    <span>{minValue}{unit}</span>
                    <span>{maxValue}{unit}</span>
                </div>
            </div>

            {/* Status */}
            <div className="text-center mt-2">
                <Badge bg={sliderValue > 0 ? 'primary' : 'secondary'}>
                    {sliderValue > 0 ? 'AKTİF' : 'KAPALI'}
                </Badge>
            </div>
        </div>
    );
};

export default PWMWidget;
