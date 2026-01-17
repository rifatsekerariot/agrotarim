const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const AdvisorService = {
    /**
     * Generates advice for a specific farm based on its sensors and crop type.
     */
    async getAdviceForFarm(farmId) {
        // 1. Fetch Farm with Crop info and latest Sensor Data
        const farm = await prisma.farm.findUnique({
            where: { id: farmId },
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

        if (!farm || !farm.crop_type) {
            return { error: "Farm or Crop Type not configured." };
        }

        // 2. Fetch Knowledge Base for this Crop & Region
        // Note: In real app, match Region string closely (e.g. normalize 'Adana' -> 'Akdeniz')
        // For now, we search by Crop Name primarily.
        const cropProfile = await prisma.cropProfile.findFirst({
            where: {
                name: { contains: farm.crop_type, mode: 'insensitive' },
                // region: { contains: farm.region ... } // Improved logic needed here mapping City->Region
            }
        });

        if (!cropProfile) {
            return {
                summary: `No specific knowledge found for ${farm.crop_type}.`,
                alerts: []
            };
        }

        // 3. Analyze Telemetry vs Profile
        const advice = {
            crop: cropProfile.name,
            summary: cropProfile.description,
            alerts: [],
            actions: []
        };

        // Aggregate sensor data (simplified: take average of all sensors)
        let currentTemp = null;
        let currentHum = null;

        farm.devices.forEach(d => {
            d.sensors.forEach(s => {
                if (s.telemetry.length > 0) {
                    const val = s.telemetry[0].value;
                    if (s.type === 'temperature') currentTemp = val;
                    if (s.type === 'humidity') currentHum = val;
                }
            });
        });

        if (currentTemp !== null) {
            // Frost Check
            if (cropProfile.minTemp && currentTemp <= cropProfile.minTemp + 2) {
                advice.alerts.push({ level: 'critical', msg: `❄️ KRİTİK DON RİSKİ: Sıcaklık ${currentTemp}°C. ${cropProfile.name} için risk sınırı ${cropProfile.minTemp}°C.` });
            }
            // Ideal Growth Check
            if (cropProfile.idealMin && currentTemp >= cropProfile.idealMin && currentTemp <= cropProfile.idealMax) {
                advice.actions.push("✅ Sıcaklık büyüme için ideal aralıkta.");
            } else if (cropProfile.idealMax && currentTemp > cropProfile.idealMax) {
                advice.alerts.push({ level: 'warning', msg: `☀️ Yüksek Sıcaklık Stresi: ${currentTemp}°C. Sulamayı artırın.` });
            }
        }

        // Fungal Risk (High Humidity + Moderate Temp)
        if (currentHum > 80 && currentTemp > 15 && currentTemp < 25) {
            advice.alerts.push({ level: 'danger', msg: "🍄 Mantar Hastalığı Riski: Yüksek nem ve ılık hava." });
        }

        return advice;
    }
};

module.exports = AdvisorService;
