const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const MgmService = require('../mgm/mgm.service');
const ExpertEngine = require('./expert/expert.engine');

const AdvisorService = {
    /**
     * Generates advice for a specific farm using the Expert Engine.
     * NEW: Uses 3-Layer Architecture (Data -> Inference -> Explanation)
     */
    async generateAdvice(farmId) {
        try {
            // === DATA LAYER: Collect All Inputs ===

            // 1. Fetch Farm, Devices, and Sensors with latest telemetry
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

            const cropName = farm.crop_type || "Buğday";
            const region = farm.city ? (await guessRegion(farm.city)) : "Karadeniz";

            // 2. Aggregate IoT Sensor Data (Respecting Dashboard Config)
            const summaryConfig = farm.dashboardConfig?.summary || {};

            // Helper to calculate average of selected (or all matching) sensors
            const calculateAverage = (devices, codes, selectedIds) => {
                let total = 0;
                let count = 0;

                devices.forEach(device => {
                    device.sensors.forEach(sensor => {
                        if (codes.includes(sensor.code) && sensor.telemetry.length > 0) {
                            const val = sensor.telemetry[0].value;
                            // Check if this sensor is selected (if selection exists)
                            // If selectedIds is empty/undefined, we include ALL matching sensors (Auto mode)
                            if (!selectedIds || selectedIds.length === 0 || selectedIds.includes(sensor.id.toString())) {
                                if (val !== null && !isNaN(val)) {
                                    total += val;
                                    count++;
                                }
                            }
                        }
                    });
                });

                return count > 0 ? (total / count) : null;
            };

            const airTemp = calculateAverage(farm.devices, ['t_air', 'temperature', 'temp', 'sicaklik', 'air_temp'], summaryConfig.tempSensors);
            const airHum = calculateAverage(farm.devices, ['h_air', 'humidity', 'hum', 'nem', 'air_hum'], summaryConfig.humSensors);

            // Use soilSensors for both temp and moisture if available, or fall back to code-based auto-detect
            // Note: Soil sensors for temp often have different codes than moisture, but usually are paired.
            // For now, we use the same 'soilSensors' list filter for both if it exists.
            const soilTemp = calculateAverage(farm.devices, ['t_soil', 'soil_temp', 'toprak_sicaklik'], summaryConfig.soilSensors);
            const soilMoisture = calculateAverage(farm.devices, ['m_soil', 'soil_moisture', 'toprak_nem', 'moisture'], summaryConfig.soilSensors);

            // 3. Fetch Weather Forecast (MGM)
            let minTempForecast = null;
            let maxTempForecast = null;
            let rainForecast = 0;

            if (farm.station_id) {
                try {
                    const forecast = await MgmService.getDailyForecast(farm.station_id);
                    if (forecast && forecast.length > 0) {
                        minTempForecast = forecast[0].enDusukGun1;
                        maxTempForecast = forecast[0].enYuksekGun1;
                    }
                } catch (e) {
                    console.log("MGM Forecast fetch failed in Advisor:", e.message);
                }
            }

            // === INFERENCE LAYER: Call Expert Engine ===
            const context = {
                crop: cropName,
                weather: {
                    temp: airTemp || 15, // Fallback if no sensor
                    hum: airHum || 50,
                    wind: 0, // TODO: Add wind sensor or fetch from MGM
                    rain: rainForecast
                },
                forecast: {
                    minTemp: minTempForecast,
                    maxTemp: maxTempForecast
                },
                soil: {
                    temp: soilTemp,
                    moisture: soilMoisture
                }
            };

            const result = ExpertEngine.analyze(context);

            // === EXPLANATION LAYER: Format for Frontend ===
            return {
                crop: `${cropName} (${region})`,
                raw_crop: farm.crop_type,
                city: farm.city,
                summary: result.summary,
                riskLevel: result.riskLevel,
                riskScore: result.riskScore,
                alerts: result.alerts,
                actions: result.actions,
                details: result.details // GDD, breakdown
            };

        } catch (error) {
            console.error("Advisor Error:", error);
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
