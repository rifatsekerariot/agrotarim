const PhenologyRules = require('./phenology.rules');
const RiskScorer = require('./risk.scorer');

const ExpertEngine = {
    /**
     * Main Analysis Function
     * @param {Object} data - Normalized input data
     * @param {string} data.crop - Crop Name (e.g. 'Misir')
     * @param {Object} data.weather - { temp, hum, wind, rain }
     * @param {Object} data.forecast - { minTemp, next3DaysMin }
     * @param {Object} data.soil - { temp, moisture }
     */
    analyze(data, dbConfig = {}) {
        const crop = data.crop || 'Genel';
        // Get default constants from Phenology Rules
        const defaultConfig = PhenologyRules.getCropConfig(crop);

        // Merge DB config (if available) with defaults
        const config = { ...defaultConfig, ...dbConfig };

        // 1. Phenology & Growth
        // Using forecast min/max if available for GDD, else current temp approximation
        // Real GDD requires (Max+Min)/2. For snapshot, we use current temp as a proxy or 0.
        const gdd = PhenologyRules.calculateGDD(data.weather.temp, data.forecast?.minTemp || data.weather.temp, crop);
        const growthState = PhenologyRules.getGrowthStatus(gdd);

        // 2. Risk Scoring
        const riskContext = {
            temp: data.weather.temp,
            minTempForecast: data.forecast?.minTemp, // Crucial for Frost
            soilTemp: data.soil?.temp,
            soilMoisture: data.soil?.moisture,
            wind: data.weather.wind,
            rain: data.weather.rain
        };

        const riskResult = RiskScorer.evaluate(riskContext, config);
        const riskLevel = RiskScorer.getLevel(riskResult.score);

        // 3. Action Generation
        const actions = [];
        const alerts = [];

        // Risk-Based Actions
        riskResult.reasons.forEach(r => {
            // Map codes to alerts
            let level = 'warning';
            if (r.points >= 30) level = 'critical'; // High points = Critical

            alerts.push({
                level,
                msg: `${r.msg} (Etki: +${r.points} Kuralı)`
            });

            // Action Mapping
            if (r.code === 'DROUGHT') actions.push('💧 SULAMA: Toprak çok kuru, acil sulama planlayın.');
            if (r.code === 'FROST' || r.code === 'FORCE_MAJEURE') actions.push('🔥 DON ÖNLEMİ: Örtü, sulama veya pervane sistemlerini hazırlayın.');
            if (r.code === 'ROOT_ROT') actions.push('⛔ SULAMAYI DURDURUN: Kök çürüme riski mevcut.');
        });

        // Growth-Based Actions
        if (riskLevel === 'DÜŞÜK' || riskLevel === 'ORTA') {
            if (growthState === 'NORMAL' || growthState === 'HIZLI') {
                actions.push('✅ GÜBRELEME: Bitki gelişimi aktif, besleme yapılabilir.');
            } else if (growthState === 'DURAKLAMA') {
                actions.push('⏳ GÜBRELEME: Gelişim yavaş olduğu için gübreleme önerilmez.');
            }
        }

        // 4. Explanation Generation (Natural Language)
        let summary = `Mevcut veriler ve fenolojik kurallar ışığında analiz yapıldı. `;
        summary += `Bitkisel gelişim durumu: ${growthState} (GDD: ${gdd.toFixed(1)}). `;

        if (riskLevel === 'KRİTİK' || riskLevel === 'YÜKSEK') {
            summary += `⚠️ DİKKAT: Toplam Risk Skoru ${riskResult.score} (${riskLevel}). `;
            summary += `Tespit edilen ana tehditler: ${riskResult.reasons.map(r => r.msg.split('(')[0].trim()).join(', ')}.`;
        } else {
            summary += `Risk seviyesi ${riskLevel} (${riskResult.score} puan). Koşullar stabil görünüyor.`;
        }

        return {
            summary,
            riskLevel,
            riskScore: riskResult.score,
            alerts,
            actions: [...new Set(actions)], // Deduplicate
            details: {
                gdd,
                growthState,
                breakdown: riskResult.reasons
            }
        };
    }
};

module.exports = ExpertEngine;
