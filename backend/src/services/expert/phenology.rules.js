/**
 * Phenology Rules & Constants
 * Handles biological clock calculations for crops.
 */

// Base Temperatures (Thresholds for Growth)
const CROP_CONSTANTS = {
    'Bugday': { baseTemp: 0, lethalMin: -4 },
    'Misir': { baseTemp: 10, lethalMin: -1 },
    'Pamuk': { baseTemp: 15, lethalMin: 5 },
    'Narenciye': { baseTemp: 13, lethalMin: -2 }, // Sensitive
    'Genel': { baseTemp: 5, lethalMin: 0 }
};

const PhenologyRules = {
    /**
     * Calculates Growing Degree Days (GDD)
     * Formula: ((Max + Min) / 2) - Base
     * If Avg < Base, GDD = 0
     */
    calculateGDD(tMax, tMin, cropType) {
        const config = CROP_CONSTANTS[cropType] || CROP_CONSTANTS['Genel'];
        const avg = (tMax + tMin) / 2;

        let gdd = avg - config.baseTemp;
        return gdd > 0 ? gdd : 0;
    },

    /**
     * Calculates Chilling Hours (Simplified)
     * Hours spent below 7.2°C (45°F)
     * @param {Array} hourlyTemps - List of last 24h temperatures
     */
    calculateChillingHours(hourlyTemps) {
        if (!hourlyTemps || hourlyTemps.length === 0) return 0;
        return hourlyTemps.filter(t => t < 7.2).length;
    },

    /**
     * Get growth status based on GDD
     */
    getGrowthStatus(gddToday) {
        if (gddToday <= 0) return "DURAKLAMA";
        if (gddToday < 5) return "YAVAŞ";
        if (gddToday < 15) return "NORMAL";
        return "HIZLI";
    },

    getCropConfig(cropType) {
        return CROP_CONSTANTS[cropType] || CROP_CONSTANTS['Genel'];
    }
};

module.exports = PhenologyRules;
