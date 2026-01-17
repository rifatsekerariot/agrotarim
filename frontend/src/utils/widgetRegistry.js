// Widget Registry
// Maps widget types to their respective React components

// Water Widgets
import WaterTankWidget from '../components/widgets/WaterTankWidget';
import WaterFlowWidget from '../components/widgets/WaterFlowWidget';
import WaterPressureWidget from '../components/widgets/WaterPressureWidget';

// Soil Widgets
import SoilMoistureWidget from '../components/widgets/SoilMoistureWidget';
import SoilTempWidget from '../components/widgets/SoilTempWidget';
import SoilPHWidget from '../components/widgets/SoilPHWidget';
import SoilECWidget from '../components/widgets/SoilECWidget';

// Light & Air Widgets
import LightIntensityWidget from '../components/widgets/LightIntensityWidget';
import UVIndexWidget from '../components/widgets/UVIndexWidget';
import CO2Widget from '../components/widgets/CO2Widget';
import AirQualityWidget from '../components/widgets/AirQualityWidget';

// Energy Widgets
import SmartPlugWidget from '../components/widgets/SmartPlugWidget';
import PowerWidget from '../components/widgets/PowerWidget';
import BatteryWidget from '../components/widgets/BatteryWidget';

// Climate Widgets
import TempTrendWidget from '../components/widgets/TempTrendWidget';
import HumidityTrendWidget from '../components/widgets/HumidityTrendWidget';
import FeelsLikeWidget from '../components/widgets/FeelsLikeWidget';

// Water Quality Widgets
import WaterTempWidget from '../components/widgets/WaterTempWidget';
import WaterQualityWidget from '../components/widgets/WaterQualityWidget';

// Control & Automation (Phase 2)
import UltrasonicWidget from '../components/widgets/UltrasonicWidget';
import DistanceWidget from '../components/widgets/DistanceWidget';
import RelayWidget from '../components/widgets/RelayWidget';
import PWMWidget from '../components/widgets/PWMWidget';
import ServoWidget from '../components/widgets/ServoWidget';

// Alarms (Phase 2)
import MotionWidget from '../components/widgets/MotionWidget';
import WaterLeakWidget from '../components/widgets/WaterLeakWidget';

// Multi-Sensor (Phase 2)
import GreenhouseWidget from '../components/widgets/GreenhouseWidget';
import MultiLocationWidget from '../components/widgets/MultiLocationWidget';


export const WIDGET_TYPES = {
    // Water
    WATER_TANK: 'water_tank',
    WATER_FLOW: 'water_flow',
    WATER_PRESSURE: 'water_pressure',

    // Soil
    SOIL_MOISTURE: 'soil_moisture',
    SOIL_TEMP: 'soil_temp',
    SOIL_PH: 'soil_ph',
    SOIL_EC: 'soil_ec',

    // Light & Air
    LIGHT_INTENSITY: 'light_intensity',
    UV_INDEX: 'uv_index',
    CO2_LEVEL: 'co2_level',
    AIR_QUALITY: 'air_quality',

    // Energy
    SMART_PLUG: 'smart_plug',
    POWER_METER: 'power_meter',
    BATTERY_STATUS: 'battery_status',

    // Climate
    TEMP_TREND: 'temp_trend',
    HUMIDITY_TREND: 'humidity_trend',
    FEELS_LIKE: 'feels_like',

    // Water Quality
    WATER_TEMP: 'water_temp',
    WATER_QUALITY: 'water_quality',

    // Control & Level (Phase 2)
    ULTRASONIC_LEVEL: 'ultrasonic_level',
    DISTANCE_SENSOR: 'distance_sensor',
    RELAY_CONTROL: 'relay_control',
    PWM_CONTROL: 'pwm_control',
    SERVO_CONTROL: 'servo_control',

    // Alarms (Phase 2)
    MOTION_SENSOR: 'motion_sensor',
    WATER_LEAK: 'water_leak',

    // Multi-Sensor (Phase 2)
    GREENHOUSE_STATUS: 'greenhouse_status',
    MULTI_LOCATION: 'multi_location'
};

export const getWidgetComponent = (type) => {
    switch (type) {
        // Water
        case WIDGET_TYPES.WATER_TANK: return WaterTankWidget;
        case WIDGET_TYPES.WATER_FLOW: return WaterFlowWidget;
        case WIDGET_TYPES.WATER_PRESSURE: return WaterPressureWidget;

        // Soil
        case WIDGET_TYPES.SOIL_MOISTURE: return SoilMoistureWidget;
        case WIDGET_TYPES.SOIL_TEMP: return SoilTempWidget;
        case WIDGET_TYPES.SOIL_PH: return SoilPHWidget;
        case WIDGET_TYPES.SOIL_EC: return SoilECWidget;

        // Light & Air
        case WIDGET_TYPES.LIGHT_INTENSITY: return LightIntensityWidget;
        case WIDGET_TYPES.UV_INDEX: return UVIndexWidget;
        case WIDGET_TYPES.CO2_LEVEL: return CO2Widget;
        case WIDGET_TYPES.AIR_QUALITY: return AirQualityWidget;

        // Energy
        case WIDGET_TYPES.SMART_PLUG: return SmartPlugWidget;
        case WIDGET_TYPES.POWER_METER: return PowerWidget;
        case WIDGET_TYPES.BATTERY_STATUS: return BatteryWidget;

        // Climate
        case WIDGET_TYPES.TEMP_TREND: return TempTrendWidget;
        case WIDGET_TYPES.HUMIDITY_TREND: return HumidityTrendWidget;
        case WIDGET_TYPES.FEELS_LIKE: return FeelsLikeWidget;

        // Water Quality
        case WIDGET_TYPES.WATER_TEMP: return WaterTempWidget;
        case WIDGET_TYPES.WATER_QUALITY: return WaterQualityWidget;

        // Control & Level
        case WIDGET_TYPES.ULTRASONIC_LEVEL: return UltrasonicWidget;
        case WIDGET_TYPES.DISTANCE_SENSOR: return DistanceWidget;
        case WIDGET_TYPES.RELAY_CONTROL: return RelayWidget;
        case WIDGET_TYPES.PWM_CONTROL: return PWMWidget;
        case WIDGET_TYPES.SERVO_CONTROL: return ServoWidget;

        // Alarms
        case WIDGET_TYPES.MOTION_SENSOR: return MotionWidget;
        case WIDGET_TYPES.WATER_LEAK: return WaterLeakWidget;

        // Multi
        case WIDGET_TYPES.GREENHOUSE_STATUS: return GreenhouseWidget;
        case WIDGET_TYPES.MULTI_LOCATION: return MultiLocationWidget;

        default: return null;
    }
};

export const getWidgetConfig = (type) => {
    const defaults = { w: 2, h: 2, minW: 2, minH: 2 };

    // Custom sizes for specific widgets
    switch (type) {
        case WIDGET_TYPES.GREENHOUSE_STATUS: return { ...defaults, w: 4, h: 4, title: 'Sera Genel Durumu' };
        case WIDGET_TYPES.MULTI_LOCATION: return { ...defaults, w: 3, h: 6, title: 'Lokasyonlar' };
        case WIDGET_TYPES.SOIL_MOISTURE: return { ...defaults, w: 3, h: 3 };
        case WIDGET_TYPES.PWM_CONTROL: return { ...defaults, w: 3, h: 3 };
        case WIDGET_TYPES.RELAY_CONTROL: return { ...defaults, w: 2, h: 3 };
        default: return { ...defaults };
    }
};
