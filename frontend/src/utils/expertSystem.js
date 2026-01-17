/**
 * Agricultural Expert System - Logic Engine
 * Generates natural language advice based on weather data and risk reports.
 * Replaces slow LLMs with instant, deterministic, and accurate agricultural wisdom.
 */

export const generateExpertAdvice = (weather, risks, cropType = 'Genel') => {
    const advice = {
        summary: "",
        alerts: [],
        actionable: []
    };

    if (!weather || !risks) return advice;

    const temp = weather.sicaklik;
    const hum = weather.nem;
    const wind = weather.ruzgarHiz;
    const rain = weather.yagis24Saat || 0;

    // --- 1. Genel Durum Özeti (Ürün Bazlı) ---
    let summaryText = `Şu anda hava sıcaklığı ${temp}°C ve nem oranı %${hum}. `;

    if (cropType !== 'Genel') {
        summaryText += `Seçilen ürün: ${cropType}. `;
    }

    if (rain > 1) {
        summaryText += `Son 24 saatte ${rain}mm yağış düştü. `;
    }

    advice.summary = summaryText;

    // --- 2. Risk Uyarıları (Ürün Bazlı Özel Kurallar) ---

    // -- DON RİSKİ --
    // Narenciye -1, -2 derecelerde çok daha hassastır.
    if (cropType === 'Narenciye' && temp <= 2) {
        advice.alerts.push({ level: 'danger', text: "❄️ KRİTİK DON RİSKİ (NARENCİYE): Sıcaklık +2°C altına düştü/düşebilir. Limon ve portakal için acil don önlemi (pervane/sulama) alın." });
    } else if (risks.frost_risk) {
        advice.alerts.push({ level: 'danger', text: "❄️ DON RİSKİ: Zirai don bekleniyor." });
    }

    // -- SICAKLIK/STRES --
    if (cropType === 'Misir' && temp > 30) {
        advice.alerts.push({ level: 'warning', text: "🌽 MISIR STRESİ: 30°C üzeri sıcaklık tozlaşmayı etkileyebilir." });
    }

    if (risks.wind_risk) {
        if (cropType === 'Misir' && wind > 25) {
            advice.alerts.push({ level: 'danger', text: "💨 YATMA RİSKİ: Sert rüzgar mısırda yatmaya sebep olabilir." });
        } else {
            advice.alerts.push({ level: 'warning', text: "💨 FIRTINA RİSKİ: Rüzgar hızı yüksek." });
        }
    }

    // -- HASTALIK --
    if (risks.pest_risk) {
        advice.alerts.push({ level: 'info', text: "🍄 MANTAR RİSKİ: Nemli hava mantari hastalıkları tetikler." });
    }

    // --- 3. Eylem Tavsiyeleri ---

    // İlaçlama
    if (risks.spraying_suitable) {
        advice.actionable.push("✅ İLAÇLAMA: Rüzgar ve yağış durumu şu an uygun.");
    } else {
        const reason = risks.details?.find(d => d.includes('İLAÇLAMA')) || "Hava koşulları uygun değil.";
        advice.actionable.push(`⛔ İLAÇLAMA: Önerilmiyor. ${reason.replace('İLAÇLAMA UYGUN DEĞİL: ', '')}`);
    }

    // Gübreleme
    if (temp > 10 && temp < 30) {
        advice.actionable.push("🌱 GÜBRELEME: Koşullar uygun.");
    } else {
        advice.actionable.push("⏳ GÜBRELEME: Sıcaklık stresi nedeniyle ertelemeniz önerilir.");
    }

    // Sulama (Ürüne Göre)
    if (rain < 1) {
        if (cropType === 'Pamuk' && temp > 32) {
            advice.actionable.push("💧 SULAMA (PAMUK): Kozalarda su stresi oluşmaması için sulama periyodunu sıklaştırın.");
        } else {
            advice.actionable.push("💧 SULAMA: Toprak nemine göre sulama yapabilirsiniz.");
        }
    }

    return advice;
};
