const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const MgmService = require('../mgm/mgm.service');

const AdvisorService = {
    /**
     * Generates advice for a specific farm based on its sensors and crop type.
     */
    async generateAdvice(farmId) {
        try {
            // 1. Fetch Farm, Devices, and Crop Profile (with Stages)
            const farm = await prisma.farm.findUnique({
                where: { id: parseInt(farmId) },
                include: {
                    devices: {
                        include: {
                            sensors: {
                                include: {
                                    telemetry: { take: 1, orderBy: { timestamp: 'desc' } }
                                }
                            }
                        }
                    }
                }
            });

            if (!farm) throw new Error("Çiftlik bulunamadı.");

            // Determine Crop from Farm settings
            const cropName = farm.crop_type || "Buğday";
            const region = farm.city ? (await guessRegion(farm.city)) : "Karadeniz";
            console.log(`DEBUG: FarmId=${farm.id}, City=${farm.city}, GuessedRegion=${region}`); // DEBUG LOG

            const profile = await prisma.cropProfile.findFirst({
                where: {
                    name: { contains: cropName, mode: 'insensitive' },
                    region: { contains: region, mode: 'insensitive' }
                },
                include: { stages: true }
            });

            console.log(`DEBUG: ProfileFound=${!!profile}, Crop=${cropName}, Region=${region}`); // DEBUG LOG

            if (!profile) return {
                crop: cropName,
                raw_crop: farm.crop_type,
                city: farm.city,
                summary: `"${cropName}" (${region}) için detaylı veri bulunamadı.`,
                alerts: [],
                actions: ["Veri tabanında bu ürün/bölge için model tanımlanmamış."]
            };

            // 2. Determine Current Stage (Simplified by Month)
            const currentMonth = new Date().getMonth() + 1; // 1-12
            let currentStage = null;
            const seasonStages = {
                "Filizlenme": [3, 4, 5],
                "Ekim": [3, 4, 5],
                "Büyüme": [6, 7],
                "Olgunlaşma": [7, 8],
                "Hasat": [8, 9, 10],
                "Kış": [11, 12, 1, 2]
            };

            for (const stage of profile.stages) {
                if (stage.name === "Genel") currentStage = stage;
                for (const [key, months] of Object.entries(seasonStages)) {
                    if (months.includes(currentMonth) && stage.name.includes(key)) {
                        currentStage = stage;
                        break;
                    }
                }
            }
            if (!currentStage && profile.stages.length > 0) currentStage = profile.stages[0];

            if (!currentStage) return {
                crop: profile.name,
                summary: "Şu anki tarih için uygun evre bulunamadı.",
                alerts: [],
                actions: []
            };

            // 3. HYBRID ANALYSIS: IoT + MGM
            const alerts = [];
            const actions = [];
            let avgTemp = 0;
            let tempCount = 0;

            // 3a. IoT Sensor Check
            farm.devices.forEach(d => {
                const tSensor = d.sensors.find(s => s.code === 't_air');
                if (tSensor && tSensor.telemetry.length > 0) {
                    avgTemp += tSensor.telemetry[0].value;
                    tempCount++;
                }
            });
            if (tempCount > 0) avgTemp /= tempCount;

            if (tempCount > 0 && currentStage) {
                if (currentStage.idealMax && avgTemp > currentStage.idealMax) {
                    alerts.push({ level: 'warning', msg: `${currentStage.name} evresi için sıcaklık yüksek (${avgTemp.toFixed(1)}°C).` });
                    actions.push("Sulama sıklığını artırmayı düşünün.");
                }
                if (currentStage.minTemp && avgTemp < currentStage.minTemp) {
                    alerts.push({ level: 'critical', msg: `❄️ DON RİSKİ: Sıcaklık (${avgTemp.toFixed(1)}°C) ${currentStage.name} limiti altında!` });
                }
            }

            // 3b. MGM Forecast Check
            if (farm.station_id) {
                try {
                    // Check if MgmService is imported correctly
                    if (MgmService && typeof MgmService.getDailyForecast === 'function') {
                        const forecast = await MgmService.getDailyForecast(farm.station_id);
                        const rainyDays = forecast.filter(f => f.hadise.code.includes('Y') || f.hadise.code.includes('S'));

                        if (currentStage.conditions) {
                            const cond = currentStage.conditions.toLowerCase();
                            if ((cond.includes("kuru") || cond.includes("hasat")) && rainyDays.length > 0) {
                                alerts.push({ level: 'danger', msg: `🌧️ HASAT RİSKİ: ${rainyDays.length} gün içinde yağış bekleniyor!` });
                            }
                            if ((cond.includes("sulama") || cond.includes("su")) && rainyDays.length > 0) {
                                actions.push(`🌧️ Yağış beklendiği (${rainyDays.length} gün) için sulamayı erteleyebilirsiniz.`);
                            }
                        }
                    } else {
                        console.warn("MgmService not available or invalid.");
                    }
                } catch (e) {
                    console.log("MGM Forecast fetch failed inside Advisor:", e.message);
                }
            }

            return {
                crop: `${profile.name} (${currentStage.name})`,
                raw_crop: farm.crop_type, // For Frontend Dropdown
                city: farm.city,         // For Frontend Dropdown
                summary: `${profile.region}, ${profile.name} ürünü ${currentStage.name} evresinde analiz ediliyor.`,
                alerts,
                actions
            };

        } catch (error) {
            console.error("Advisor Error:", error);
            // Return ACTUAL error message for debugging
            return {
                alerts: [{ level: 'danger', msg: `HATA: ${error.message}` }],
                actions: [],
                summary: "Sistem şu an geçici olarak hizmet veremiyor."
            };
        }
    }
};

// Helper function outside object to avoid context issues
async function guessRegion(city) {
    const regions = {
        "Adana": "Akdeniz", "Antalya": "Akdeniz", "Mersin": "Akdeniz", "Hatay": "Akdeniz",
        "Trabzon": "Karadeniz", "Samsun": "Karadeniz", "Rize": "Karadeniz", "Ordu": "Karadeniz",
        "Konya": "İç Anadolu", "Ankara": "İç Anadolu", "Eskişehir": "İç Anadolu",
        "Diyarbakır": "Güneydoğu Anadolu", "Şanlıurfa": "Güneydoğu Anadolu", "Gaziantep": "Güneydoğu Anadolu",
        "İstanbul": "Marmara", "Edirne": "Marmara", "Bursa": "Marmara", "Tekirdağ": "Marmara",
        "İzmir": "Ege", "Manisa": "Ege", "Aydın": "Ege"
    };
    const key = Object.keys(regions).find(k => city.includes(k));
    return key ? regions[key] : "Karadeniz";
}

module.exports = AdvisorService;
