/**
 * Agricultural Expert System - Logic Engine
 * Generates natural language advice based on weather data and risk reports.
 * Replaces slow LLMs with instant, deterministic, and accurate agricultural wisdom.
 */

export const generateExpertAdvice = (weather, risks) => {
    const advice = {
        summary: "",
        alerts: [],
        actionable: []
    };

    if (!weather || !risks) return advice;

    // --- 1. Genel Durum Özeti ---
    const temp = weather.sicaklik;
    const hum = weather.nem;
    const wind = weather.ruzgarHiz;
    const rain = weather.yagis24Saat || 0;

    let summaryText = `Şu anda hava sıcaklığı ${temp}°C ve nem oranı %${hum}. `;

    if (rain > 1) {
        summaryText += `Son 24 saatte ${rain}mm yağış düştü, toprak ıslak. `;
    } else {
        summaryText += `Hava genel olarak yağışsız. `;
    }

    if (wind > 20) {
        summaryText += `Rüzgar sert esiyor (${wind} km/s), dikkatli olunmalı.`;
    } else if (wind > 10) {
        summaryText += `Hafif bir esinti var (${wind} km/s).`;
    } else {
        summaryText += `Rüzgar sakin.`;
    }

    advice.summary = summaryText;

    // --- 2. Risk Uyarıları (Backend + Frontend Logic) ---
    // Backend zaten teknik hesaplamayı yaptı, burada yorumluyoruz
    if (risks.frost_risk) {
        advice.alerts.push({ level: 'danger', text: "❄️ DON RİSKİ: Sıcaklık kritik seviyelerin altında. Zirai don önlemlerinizi (sulama, rüzgar pervanesi) derhal devreye alın." });
    }

    if (risks.wind_risk) {
        advice.alerts.push({ level: 'warning', text: "💨 FIRTINA RİSKİ: Rüzgar hızı yüksek. Sera örtülerini kontrol edin ve açıkta ilaçlama yapmayın." });
    }

    if (risks.heat_stress) {
        advice.alerts.push({ level: 'warning', text: "☀️ SICAK STRESİ: Aşırı sıcak bitkileri yorabilir. Sulama sıklığını artırmayı düşünün." });
    }

    if (risks.pest_risk) {
        advice.alerts.push({ level: 'info', text: "🍄 MANTAR RİSKİ: Yüksek nem ve ılıman hava mantari hastalıklar için uygun ortam oluşturuyor. Yaprakları kontrol edin." });
    }

    // --- 3. Eylem Tavsiyeleri (Actionable Advice) ---
    if (risks.spraying_suitable) {
        advice.actionable.push("✅ İLAÇLAMA: Rüzgar ve yağış durumu şu an ilaçlama için UYGUN görünüyor.");
    } else {
        // Neden uygun olmadığını detaylardan çıkar ya da genel yaz
        const reason = risks.details?.find(d => d.includes('İLAÇLAMA')) || "Hava koşulları uygun değil.";
        advice.actionable.push(`⛔ İLAÇLAMA: Şu an önerilmiyor. ${reason.replace('İLAÇLAMA UYGUN DEĞİL: ', '')}`);
    }

    if (temp > 10 && temp < 30 && hum > 40) {
        advice.actionable.push("🌱 GÜBRELEME: Bitki metabolizması için uygun koşullar var. Programlı gübreleme yapılabilir.");
    } else {
        advice.actionable.push("⏳ GÜBRELEME: Bitki streste olabilir (sıcaklık/soğuk). Gübrelemeyi ertelemek faydalı olabilir.");
    }

    if (rain < 1 && hum < 50) {
        advice.actionable.push("💧 SULAMA: Evapotranspirasyon (su kaybı) yüksek olabilir. Toprak nemini kontrol edip sulama yapın.");
    }

    return advice;
};
