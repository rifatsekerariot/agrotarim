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

// Widget Settings Metadata - Complete for all widgets
export const WIDGET_SETTINGS = {
    // ===== WATER =====
    [WIDGET_TYPES.WATER_TANK]: {
        defaultSettings: { capacity: 4000, consumptionRate: 150, lowThreshold: 20 },
        settingsFields: [
            { key: 'capacity', label: 'Tank Kapasitesi (L)', type: 'number', min: 100, step: 100 },
            { key: 'consumptionRate', label: 'Günlük Tüketim (L/gün)', type: 'number', min: 1, step: 10 },
            { key: 'lowThreshold', label: 'Düşük Seviye Uyarısı (%)', type: 'number', min: 5, max: 50 }
        ]
    },
    [WIDGET_TYPES.WATER_FLOW]: {
        defaultSettings: { maxFlowRate: 100, unit: 'L/dk' },
        settingsFields: [
            { key: 'maxFlowRate', label: 'Max Akış Hızı', type: 'number', min: 1 },
            { key: 'unit', label: 'Birim', type: 'select', options: ['L/dk', 'L/saat', 'm³/saat'] }
        ]
    },
    [WIDGET_TYPES.WATER_PRESSURE]: {
        defaultSettings: { normalMin: 2.0, normalMax: 4.0, unit: 'bar' },
        settingsFields: [
            { key: 'normalMin', label: 'Normal Basınç (Min)', type: 'number', min: 0, max: 10, step: 0.1 },
            { key: 'normalMax', label: 'Normal Basınç (Max)', type: 'number', min: 0, max: 10, step: 0.1 }
        ]
    },

    // ===== SOIL =====
    [WIDGET_TYPES.SOIL_MOISTURE]: {
        defaultSettings: { criticalLow: 30, optimalMin: 50, optimalMax: 70, criticalHigh: 90 },
        settingsFields: [
            { key: 'criticalLow', label: 'Kritik Düşük (%)', type: 'number', min: 0, max: 100 },
            { key: 'optimalMin', label: 'Optimal Min (%)', type: 'number', min: 0, max: 100 },
            { key: 'optimalMax', label: 'Optimal Max (%)', type: 'number', min: 0, max: 100 },
            { key: 'criticalHigh', label: 'Kritik Yüksek (%)', type: 'number', min: 0, max: 100 }
        ]
    },
    [WIDGET_TYPES.SOIL_TEMP]: {
        defaultSettings: { idealMin: 15, idealMax: 25 },
        settingsFields: [
            { key: 'idealMin', label: 'İdeal Sıcaklık (Min °C)', type: 'number', min: -10, max: 50 },
            { key: 'idealMax', label: 'İdeal Sıcaklık (Max °C)', type: 'number', min: -10, max: 50 }
        ]
    },
    [WIDGET_TYPES.SOIL_PH]: {
        defaultSettings: { optimalMin: 6.0, optimalMax: 7.5 },
        settingsFields: [
            { key: 'optimalMin', label: 'Optimal pH (Min)', type: 'number', min: 0, max: 14, step: 0.1 },
            { key: 'optimalMax', label: 'Optimal pH (Max)', type: 'number', min: 0, max: 14, step: 0.1 }
        ]
    },
    [WIDGET_TYPES.SOIL_EC]: {
        defaultSettings: { optimalMin: 1.0, optimalMax: 2.5, unit: 'mS/cm' },
        settingsFields: [
            { key: 'optimalMin', label: 'Optimal EC (Min)', type: 'number', min: 0, max: 10, step: 0.1 },
            { key: 'optimalMax', label: 'Optimal EC (Max)', type: 'number', min: 0, max: 10, step: 0.1 }
        ]
    },

    // ===== LIGHT & AIR =====
    [WIDGET_TYPES.LIGHT_INTENSITY]: {
        defaultSettings: { sunlightThreshold: 10000, lowLightThreshold: 1000, unit: 'lux' },
        settingsFields: [
            { key: 'sunlightThreshold', label: 'Güneş Işığı Eşiği (lux)', type: 'number', min: 0 },
            { key: 'lowLightThreshold', label: 'Düşük Işık Eşiği (lux)', type: 'number', min: 0 }
        ]
    },
    [WIDGET_TYPES.UV_INDEX]: {
        defaultSettings: { lowThreshold: 3, moderateThreshold: 6, highThreshold: 8 },
        settingsFields: [
            { key: 'lowThreshold', label: 'Düşük Risk Eşiği', type: 'number', min: 0, max: 15 },
            { key: 'moderateThreshold', label: 'Orta Risk Eşiği', type: 'number', min: 0, max: 15 },
            { key: 'highThreshold', label: 'Yüksek Risk Eşiği', type: 'number', min: 0, max: 15 }
        ]
    },
    [WIDGET_TYPES.CO2_LEVEL]: {
        defaultSettings: { normalMax: 1000, warningMax: 2000, dangerMax: 5000 },
        settingsFields: [
            { key: 'normalMax', label: 'Normal Max (ppm)', type: 'number', min: 0 },
            { key: 'warningMax', label: 'Uyarı Max (ppm)', type: 'number', min: 0 },
            { key: 'dangerMax', label: 'Tehlike Max (ppm)', type: 'number', min: 0 }
        ]
    },
    [WIDGET_TYPES.AIR_QUALITY]: {
        defaultSettings: { goodMax: 50, moderateMax: 100, unhealthyMax: 150 },
        settingsFields: [
            { key: 'goodMax', label: 'İyi (Max AQI)', type: 'number', min: 0, max: 500 },
            { key: 'moderateMax', label: 'Orta (Max AQI)', type: 'number', min: 0, max: 500 },
            { key: 'unhealthyMax', label: 'Sağlıksız (Max AQI)', type: 'number', min: 0, max: 500 }
        ]
    },

    // ===== ENERGY =====
    [WIDGET_TYPES.SMART_PLUG]: {
        defaultSettings: { maxPower: 3000, costPerKwh: 2.5 },
        settingsFields: [
            { key: 'maxPower', label: 'Max Güç (W)', type: 'number', min: 0 },
            { key: 'costPerKwh', label: 'Birim Fiyat (TL/kWh)', type: 'number', min: 0, step: 0.1 }
        ]
    },
    [WIDGET_TYPES.POWER_METER]: {
        defaultSettings: { maxPower: 10000, costPerKwh: 2.5, currency: 'TL' },
        settingsFields: [
            { key: 'maxPower', label: 'Max Güç (W)', type: 'number', min: 0 },
            { key: 'costPerKwh', label: 'Birim Fiyat (TL/kWh)', type: 'number', min: 0, step: 0.1 }
        ]
    },
    [WIDGET_TYPES.BATTERY_STATUS]: {
        defaultSettings: { capacity: 5000, lowThreshold: 20, criticalThreshold: 10 },
        settingsFields: [
            { key: 'capacity', label: 'Pil Kapasitesi (mAh)', type: 'number', min: 100, step: 100 },
            { key: 'lowThreshold', label: 'Düşük Uyarı (%)', type: 'number', min: 5, max: 50 },
            { key: 'criticalThreshold', label: 'Kritik Uyarı (%)', type: 'number', min: 1, max: 30 }
        ]
    },

    // ===== CLIMATE/TRENDS =====
    [WIDGET_TYPES.TEMP_TREND]: {
        defaultSettings: { minTemp: -10, maxTemp: 50, showHistory: true },
        settingsFields: [
            { key: 'minTemp', label: 'Min Sıcaklık (°C)', type: 'number', min: -50, max: 100 },
            { key: 'maxTemp', label: 'Max Sıcaklık (°C)', type: 'number', min: -50, max: 100 }
        ]
    },
    [WIDGET_TYPES.HUMIDITY_TREND]: {
        defaultSettings: { warningLow: 30, warningHigh: 80, showHistory: true },
        settingsFields: [
            { key: 'warningLow', label: 'Düşük Uyarı (%)', type: 'number', min: 0, max: 100 },
            { key: 'warningHigh', label: 'Yüksek Uyarı (%)', type: 'number', min: 0, max: 100 }
        ]
    },
    [WIDGET_TYPES.FEELS_LIKE]: {
        defaultSettings: { showHumidity: true },
        settingsFields: []
    },

    // ===== WATER QUALITY =====
    [WIDGET_TYPES.WATER_TEMP]: {
        defaultSettings: { idealMin: 18, idealMax: 24 },
        settingsFields: [
            { key: 'idealMin', label: 'İdeal Min (°C)', type: 'number', min: 0, max: 50 },
            { key: 'idealMax', label: 'İdeal Max (°C)', type: 'number', min: 0, max: 50 }
        ]
    },
    [WIDGET_TYPES.WATER_QUALITY]: {
        defaultSettings: { ppmMax: 500, goodMax: 150 },
        settingsFields: [
            { key: 'ppmMax', label: 'Max TDS (ppm)', type: 'number', min: 0 },
            { key: 'goodMax', label: 'İyi TDS (Max ppm)', type: 'number', min: 0 }
        ]
    },

    // ===== CONTROL & LEVEL =====
    [WIDGET_TYPES.ULTRASONIC_LEVEL]: {
        defaultSettings: { tankHeight: 200, emptyDistance: 200, fullDistance: 10 },
        settingsFields: [
            { key: 'tankHeight', label: 'Tank Yüksekliği (cm)', type: 'number', min: 1 },
            { key: 'emptyDistance', label: 'Boş Mesafe (cm)', type: 'number', min: 0 },
            { key: 'fullDistance', label: 'Dolu Mesafe (cm)', type: 'number', min: 0 }
        ]
    },
    [WIDGET_TYPES.DISTANCE_SENSOR]: {
        defaultSettings: { maxDistance: 400, unit: 'cm', warningThreshold: 50 },
        settingsFields: [
            { key: 'maxDistance', label: 'Max Mesafe', type: 'number', min: 1 },
            { key: 'unit', label: 'Birim', type: 'select', options: ['cm', 'm', 'mm'] },
            { key: 'warningThreshold', label: 'Uyarı Eşiği', type: 'number', min: 0 }
        ]
    },
    [WIDGET_TYPES.RELAY_CONTROL]: {
        defaultSettings: { labels: ['Röle 1', 'Röle 2', 'Röle 3', 'Röle 4'], channelCount: 4 },
        settingsFields: [
            { key: 'channelCount', label: 'Kanal Sayısı', type: 'number', min: 1, max: 8 }
        ]
    },
    [WIDGET_TYPES.PWM_CONTROL]: {
        defaultSettings: { minValue: 0, maxValue: 100, unit: '%', label: 'PWM Çıkış' },
        settingsFields: [
            { key: 'minValue', label: 'Min Değer', type: 'number' },
            { key: 'maxValue', label: 'Max Değer', type: 'number' },
            { key: 'label', label: 'Etiket', type: 'text' }
        ]
    },
    [WIDGET_TYPES.SERVO_CONTROL]: {
        defaultSettings: { minAngle: 0, maxAngle: 180, step: 1 },
        settingsFields: [
            { key: 'minAngle', label: 'Min Açı (°)', type: 'number', min: 0, max: 360 },
            { key: 'maxAngle', label: 'Max Açı (°)', type: 'number', min: 0, max: 360 }
        ]
    },

    // ===== ALARMS =====
    [WIDGET_TYPES.MOTION_SENSOR]: {
        defaultSettings: { cooldownSeconds: 30, showLastMotion: true },
        settingsFields: [
            { key: 'cooldownSeconds', label: 'Bekleme Süresi (sn)', type: 'number', min: 0 }
        ]
    },
    [WIDGET_TYPES.WATER_LEAK]: {
        defaultSettings: { alertSound: true, criticalAlert: true },
        settingsFields: []
    },

    // ===== MULTI-SENSOR =====
    [WIDGET_TYPES.GREENHOUSE_STATUS]: {
        defaultSettings: { showTemp: true, showHumidity: true, showSoilMoisture: true, showLight: true },
        settingsFields: []
    },
    [WIDGET_TYPES.MULTI_LOCATION]: {
        defaultSettings: { locationCount: 4 },
        settingsFields: [
            { key: 'locationCount', label: 'Lokasyon Sayısı', type: 'number', min: 1, max: 10 }
        ]
    }
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
