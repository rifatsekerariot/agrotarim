const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
                    },
                    cropProfile: true // If relation exists (needs schema update: Farm -> CropProfile)
                }
            });

            if (!farm) throw new Error("Çiftlik bulunamadı.");

            // Determine Crop from Farm settings (or fallback to User Profile text matching)
            const cropName = farm.crop_type || "Buğday";
            const region = farm.city ? (await this.guessRegion(farm.city)) : "Karadeniz"; // Simple mapper needed

            const profile = await prisma.cropProfile.findFirst({
                where: {
                    name: { contains: cropName, mode: 'insensitive' },
                    region: { contains: region, mode: 'insensitive' }
                },
                include: { stages: true }
            });

            if (!profile) return {
                crop: cropName,
                summary: "Bu ürün/bölge için henüz detaylı veri bulunmamaktadır.",
                alerts: [],
                actions: []
            };

            // 2. Determine Current Stage (Simplified by Month)
            const currentMonth = new Date().getMonth() + 1; // 1-12
            let currentStage = null;

            // Simple logic: Spring=Filizlenme/Ekim, Summer=Büyüme/Olgunlaşma, Autumn=Hasat
            const seasonStages = {
                "Filizlenme": [3, 4, 5],
                "Ekim": [3, 4, 5],
                "Büyüme": [6, 7],
                "Olgunlaşma": [7, 8],
                "Hasat": [8, 9, 10],
                "Kış": [11, 12, 1, 2]
            };

            // Find matching stage from DB
            for (const stage of profile.stages) {
                if (stage.name === "Genel") currentStage = stage;

                for (const [key, months] of Object.entries(seasonStages)) {
                    if (months.includes(currentMonth) && stage.name.includes(key)) {
                        currentStage = stage;
                        break;
                    }
                }
            }
            if (!currentStage && profile.stages.length > 0) currentStage = profile.stages[0]; // Fallback

            if (!currentStage) {
                return {
                    crop: profile.name,
                    summary: `${profile.region} bölgesi için genel bilgiler mevcut.`,
                    alerts: [],
                    actions: []
                };
            }

            // 3. Analyze Data against Stage Requirements
            const alerts = [];
            const actions = [];
            let avgTemp = 0;

            // Calculate Avg Temp from all sensors
            let tempCount = 0;
            farm.devices.forEach(d => {
                const tSensor = d.sensors.find(s => s.code === 't_air');
                if (tSensor && tSensor.telemetry.length > 0) {
                    avgTemp += tSensor.telemetry[0].value;
                    tempCount++;
                }
            });
            if (tempCount > 0) avgTemp /= tempCount;

            // RULE 1: Temperature Stress
            // Only check if we have an Average Temperature reading
            if (tempCount > 0) {
                if (currentStage.idealMax && avgTemp > currentStage.idealMax) {
                    alerts.push({ level: 'warning', msg: `${currentStage.name} dönemi için sıcaklık yüksek (${avgTemp.toFixed(1)}°C). İdeal max: ${currentStage.idealMax}°C` });
                    actions.push("Sulama sıklığını artırın.");
                }
                if (currentStage.idealMin && avgTemp < currentStage.idealMin) {
                    alerts.push({ level: 'warning', msg: `${currentStage.name} dönemi için gelişim yavaşlayabilir (${avgTemp.toFixed(1)}°C).` });
                }
                if (currentStage.minTemp && avgTemp < currentStage.minTemp) {
                    alerts.push({ level: 'critical', msg: `DON RİSKİ! Sıcaklık ${currentStage.name} için limitin altında (${avgTemp.toFixed(1)}°C).` });
                    actions.push("Don önleyici sistemleri çalıştırın.");
                }
            }

            // RULE 2: Specific Conditions Text Parsing
            if (currentStage.conditions) {
                const cond = currentStage.conditions.toLowerCase();
                if (cond.includes("sulama") || cond.includes("bol su")) {
                    actions.push("Bu dönemde düzenli sulama kritiktir.");
                }
                if (cond.includes("kuru") && cond.includes("hasat")) {
                    actions.push("Hasat için kuru hava koşullarını takip edin.");
                }
            }

            return {
                crop: `${profile.name} (${currentStage.name})`,
                summary: `${profile.region} bölgesinde ${profile.name} için mevcut koşullar analiz edildi.`,
                alerts,
                actions
            };

        } catch (error) {
            console.error("Advisor Error:", error);
            // Return safe object on error
            return {
                alerts: [],
                actions: [],
                summary: "Analiz servisi şu an kullanılamıyor."
            };
        }
    },

    async guessRegion(city) {
        const regions = {
            "Adana": "Akdeniz", "Antalya": "Akdeniz", "Mersin": "Akdeniz",
            "Trabzon": "Karadeniz", "Samsun": "Karadeniz", "Rize": "Karadeniz",
            "Konya": "İç Anadolu", "Ankara": "İç Anadolu",
            "Diyarbakır": "Güneydoğu Anadolu", "Şanlıurfa": "Güneydoğu Anadolu",
            "İstanbul": "Marmara", "Edirne": "Marmara", "Bursa": "Marmara",
            "İzmir": "Ege", "Manisa": "Ege"
        };
        // Loose matching
        const key = Object.keys(regions).find(k => city.includes(k));
        return key ? regions[key] : "Karadeniz";
    }
};

module.exports = AdvisorService;
