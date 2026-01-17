const axios = require('axios');

const BASE_URL = 'https://servis.mgm.gov.tr/web';
// In-memory cache: { key: { data: ..., expiry: ... } }
const cache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const getCachedData = (key) => {
    const item = cache.get(key);
    if (item && Date.now() < item.expiry) {
        return item.data;
    }
    return null;
};

const setCachedData = (key, data) => {
    cache.set(key, {
        data,
        expiry: Date.now() + CACHE_TTL_MS,
    });
};

const makeRequest = async (endpoint, params = {}) => {
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
            params,
            headers: {
                'Origin': 'https://www.mgm.gov.tr',
                'Referer': 'https://www.mgm.gov.tr/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            }
        });

        setCachedData(cacheKey, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error.message);
        throw error;
    }
};

// --- Helper Functions Ported from Reference Code ---

const turkceDonusturucu = (string) => {
    if (!string) return null;
    string = string.replace(/İ/g, "I").replace(/ı/g, "i")
        .replace(/Ş/g, "S").replace(/ş/g, "s")
        .replace(/ç/g, "c").replace(/Ç/g, "C")
        .replace(/ğ/g, "g").replace(/Ğ/g, "G");
    // .replace(/Ö/g, "O").replace(/ö/g, "o") // Kept commented out as per ref
    // string = string.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // More robust approach if needed
    return string;
};

// --- Exported Services ---

const MgmService = {
    getProvinces: async () => {
        return makeRequest('/merkezler/iller');
    },

    getCenters: async (il, ilce) => {
        let url = `/merkezler?il=${turkceDonusturucu(il)}`;
        if (ilce) {
            url += `&ilce=${turkceDonusturucu(ilce)}`;
        }
        return makeRequest(url);
    },

    getLatestStatus: async (centerId) => {
        return makeRequest('/sondurumlar', { merkezid: centerId });
    },

    getHourlyForecast: async (stationId) => {
        return makeRequest('/tahminler/saatlik', { istno: stationId });
    },

    getDailyForecast: async (stationId) => {
        return makeRequest('/tahminler/gunluk', { istno: stationId });
    },

    getAgriculturalForecast: async (stationId) => {
        // Angular code uses 'istNo' (camelCase) for this specific endpoint
        return makeRequest('/tahminler/tarimsal', { istNo: stationId });
    },

    getMeteoWarnings: async (centerId) => {
        // centerId is used for meteo warnings (province/district id), not stationId
        return makeRequest('/meteoalarm/towns', { id: centerId });
    }
};

module.exports = { MgmService, turkceDonusturucu };
