/**
 * Risk Scoring Engine
 * Deterministic, weighted scoring system for agricultural risks.
 */

const RISK_RULES = {
    // Temperature Related
    'FROST_LIGHT': { score: 20, condition: (val) => val <= 0 },
    'FROST_HARD': { score: 40, condition: (val) => val <= -4 }, // Cumulative with light? No, verify logic.
    'HEAT_STRESS': { score: 15, condition: (val) => val > 35 },

    // Moisture/Rain
    'HEAVY_RAIN': { score: 25, condition: (val) => val > 20 }, // mm
    'DRY_SOIL': { score: 30, condition: (val) => val < 20 }, // %
    'WET_ROOT': { score: 35, condition: (val) => val > 80 }, // % (Root Rot Risk)

    // Wind
    'STORM_WIND': { score: 20, condition: (val) => val > 40 }, // km/h
    'GALE_WIND': { score: 30, condition: (val) => val > 60 },
};

const RiskScorer = {
    /**
     * Calculates the total risk score based on context.
     * @param {Object} context - { temp, minTempForecast, soilTemp, soilMoisture, rain, wind }
     * @returns {Object} { score: Number, details: Array }
     */
    evaluate(context) {
        let riskScore = 0;
        let reasons = [];

        // 1. Forecast / Air Temp Check
        const t = context.minTempForecast !== undefined ? context.minTempForecast : context.temp;

        if (t <= -4) {
            riskScore += 40;
            reasons.push({ code: 'FORCE_MAJEURE', msg: 'Kuvvetli Zirai Don (-4°C altı)', points: 40 });
        } else if (t <= 0) {
            riskScore += 25; // Adjusted from plan to be slightly distinct
            reasons.push({ code: 'FROST', msg: 'Zirai Don Riski (0°C altı)', points: 25 });
        } else if (context.temp > 35) {
            riskScore += 15;
            reasons.push({ code: 'HEAT', msg: 'Yüksek Sıcaklık Stresi', points: 15 });
        }

        // 2. IoT Sensor Checks
        if (context.soilMoisture !== undefined) {
            if (context.soilMoisture < 20) {
                riskScore += 30;
                reasons.push({ code: 'DROUGHT', msg: 'Kritik Toprak Kuruluğu (<%20)', points: 30 });
            } else if (context.soilMoisture > 85) {
                riskScore += 20;
                reasons.push({ code: 'ROOT_ROT', msg: 'Aşırı Sulama/Nem (Kök Çürüme Riski)', points: 20 });
            }
        }

        // 3. Cross-Check (The "Smart" Part)
        // Cold Soil + Wet Soil = Root Freeze Logic
        if (context.soilTemp !== undefined && context.soilTemp <= 0 && context.soilMoisture > 60) {
            riskScore += 30; // Bonus risk
            reasons.push({ code: 'ROOT_FREEZE', msg: 'Kök Donması Riski (Islak Toprak + Don)', points: 30 });
        }

        // 4. Wind
        if (context.wind > 50) {
            riskScore += 20;
            reasons.push({ code: 'WIND', msg: 'Fırtına (50km/s üzeri)', points: 20 });
        }

        return { score: riskScore, reasons };
    },

    getLevel(score) {
        if (score >= 70) return "KRİTİK"; // Red
        if (score >= 40) return "YÜKSEK"; // Orange
        if (score >= 20) return "ORTA";   // Yellow
        return "DÜŞÜK";                   // Green
    }
};

module.exports = RiskScorer;
