/**
 * Deterministic Risk Algorithm
 * Calculates risk flags based on hard-coded rules.
 * Used for "Verifiable AI" to cross-check LLM output.
 */

const calculateRisk = (weatherData) => {
    const report = {
        frost_risk: false,
        wind_risk: false,
        heat_stress: false,
        pest_risk: false, // General placeholder
        details: []
    };

    if (!weatherData) return report;

    // 1. Frost Risk (Don Riski)
    // Rule: Temp < 0 is risk. 
    // Reference: 0 to -2.2 (Hafif), -2.2 to -4.4 (Orta), < -4.4 (Kuvvetli)
    const temp = weatherData.sicaklik;
    if (temp < 0) {
        report.frost_risk = true;
        let severity = "Hafif";
        if (temp <= -2.2 && temp > -4.4) severity = "Orta";
        else if (temp <= -4.4) severity = "Kuvvetli";

        report.details.push(`DON RİSKİ TESPİT EDİLDİ: Sıcaklık ${temp}°C (${severity}).`);
    }

    // 2. Wind Risk (Rüzgar)
    // Reference: > 38 is Kuvvetli/Fırtına (based on >38 in ref filter RuzgarZiraiDonusturucu)
    // User prompt example: > 20 -> ilaclama_uygun = FALSE
    const windSpeed = weatherData.ruzgarHiz;
    if (windSpeed > 20) {
        report.wind_risk = true;
        report.details.push(`RÜZGAR RİSKİ: Hız ${windSpeed} km/sa > 20. İlaçlama yapılması önerilmez.`);
    }

    // 3. Spraying Suitability (İlaçlama Uygunluğu) - Composite Rule
    // Suitable if: No Rain, Temp 10-25, Wind < 20, Humidity 30-85
    const humidity = weatherData.nem;
    const isRaining = weatherData.hadiseKodu && (weatherData.hadiseKodu.includes('Y') || weatherData.hadiseKodu === 'K');

    let sprayingSuitable = true;
    let sprayingReasons = [];

    if (isRaining) {
        sprayingSuitable = false;
        sprayingReasons.push("Yağış var");
    }
    if (temp < 10 || temp > 25) {
        sprayingSuitable = false;
        sprayingReasons.push(`Sıcaklık (${temp}°C) 10-25 aralığında değil`);
    }
    if (windSpeed >= 20) { // Matching the >20 rule above roughly
        sprayingSuitable = false;
        sprayingReasons.push(`Rüzgar hızı (${windSpeed}) yüksek`);
    }
    if (humidity < 30 || humidity > 85) {
        sprayingSuitable = false;
        sprayingReasons.push(`Nem (%${humidity}) 30-85 aralığında değil`);
    }

    report.spraying_suitable = sprayingSuitable;
    if (!sprayingSuitable) {
        report.details.push(`İLAÇLAMA UYGUN DEĞİL: ${sprayingReasons.join(', ')}.`);
    }

    return report;
};

module.exports = { calculateRisk };
