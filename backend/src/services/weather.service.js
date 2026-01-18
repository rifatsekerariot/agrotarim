const axios = require('axios');

/**
 * Weather Service using Open-Meteo (Completely Free, No API Key)
 * https://open-meteo.com/
 */
class WeatherService {
    constructor() {
        this.baseUrl = 'https://api.open-meteo.com/v1';
        this.cacheTime = 30 * 60 * 1000; // 30 minutes cache
        this.cache = new Map();
    }

    /**
     * Get current weather for coordinates
     */
    async getCurrentWeather(lat, lon) {
        const cacheKey = `current_${lat}_${lon}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await axios.get(`${this.baseUrl}/forecast`, {
                params: {
                    latitude: lat,
                    longitude: lon,
                    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m',
                    timezone: 'auto'
                }
            });

            const current = response.data.current;

            const data = {
                temperature: current.temperature_2m,
                feelsLike: current.apparent_temperature,
                humidity: current.relative_humidity_2m,
                pressure: current.pressure_msl,
                windSpeed: current.wind_speed_10m,
                windDirection: current.wind_direction_10m,
                cloudCover: current.cloud_cover,
                precipitation: current.precipitation || 0,
                description: this.getWeatherDescription(current.weather_code),
                icon: this.getWeatherIcon(current.weather_code),
                timestamp: new Date()
            };

            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('[Weather] Current Weather Error:', error.message);
            throw new Error('Hava durumu bilgisi alınamadı');
        }
    }

    /**
     * Get 7-day forecast
     */
    async getForecast(lat, lon, days = 7) {
        const cacheKey = `forecast_${lat}_${lon}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const response = await axios.get(`${this.baseUrl}/forecast`, {
                params: {
                    latitude: lat,
                    longitude: lon,
                    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
                    timezone: 'auto',
                    forecast_days: days
                }
            });

            const daily = response.data.daily;

            const forecast = daily.time.map((date, index) => ({
                date,
                maxTemperature: daily.temperature_2m_max[index],
                minTemperature: daily.temperature_2m_min[index],
                avgTemperature: (daily.temperature_2m_max[index] + daily.temperature_2m_min[index]) / 2,
                precipitation: daily.precipitation_sum[index],
                windSpeed: daily.wind_speed_10m_max[index],
                description: this.getWeatherDescription(daily.weather_code[index]),
                icon: this.getWeatherIcon(daily.weather_code[index])
            }));

            this.setCache(cacheKey, forecast);
            return forecast;
        } catch (error) {
            console.error('[Weather] Forecast Error:', error.message);
            throw new Error('Hava tahmini alınamadı');
        }
    }

    /**
     * Get daily summary forecast
     */
    async getDailySummary(lat, lon) {
        return await this.getForecast(lat, lon, 7);
    }

    /**
     * Check if rain is expected in next N hours
     */
    async willRainSoon(lat, lon, hours = 24) {
        try {
            const hoursToCheck = Math.ceil(hours / 3); // Hourly data
            const response = await axios.get(`${this.baseUrl}/forecast`, {
                params: {
                    latitude: lat,
                    longitude: lon,
                    hourly: 'precipitation',
                    forecast_hours: hoursToCheck,
                    timezone: 'auto'
                }
            });

            const hourly = response.data.hourly;
            const totalPrecipitation = hourly.precipitation.reduce((sum, val) => sum + (val || 0), 0);
            const willRain = totalPrecipitation > 0;

            // Find first hour with rain
            let firstRainTime = null;
            for (let i = 0; i < hourly.time.length; i++) {
                if (hourly.precipitation[i] > 0) {
                    firstRainTime = new Date(hourly.time[i]);
                    break;
                }
            }

            return {
                willRain,
                totalPrecipitation: Math.round(totalPrecipitation * 10) / 10,
                firstRainTime
            };
        } catch (error) {
            console.error('[Weather] Rain Check Error:', error.message);
            return { willRain: false, totalPrecipitation: 0, firstRainTime: null };
        }
    }

    /**
     * Convert WMO Weather Code to description (Turkish)
     * https://open-meteo.com/en/docs
     */
    getWeatherDescription(code) {
        const descriptions = {
            0: 'Açık',
            1: 'Açık', 2: 'Parçalı Bulutlu', 3: 'Bulutlu',
            45: 'Sisli', 48: 'Kırağılı Sis',
            51: 'Hafif Çisenti', 53: 'Orta Çisenti', 55: 'Yoğun Çisenti',
            61: 'Hafif Yağmur', 63: 'Orta Yağmur', 65: 'Şiddetli Yağmur',
            71: 'Hafif Kar', 73: 'Orta Kar', 75: 'Şiddetli Kar',
            80: 'Sağanak Yağmur', 81: 'Orta Sağanak', 82: 'Şiddetli Sağanak',
            95: 'Fırtına', 96: 'Dolu ile Fırtına', 99: 'Şiddetli Dolu Fırtınası'
        };
        return descriptions[code] || 'Bilinmiyor';
    }

    /**
     * Convert WMO code to icon identifier
     */
    getWeatherIcon(code) {
        if (code === 0 || code === 1) return '01d'; // Clear
        if (code === 2) return '02d'; // Partly cloudy
        if (code === 3) return '03d'; // Cloudy
        if (code >= 51 && code <= 67) return '10d'; // Rain
        if (code >= 71 && code <= 77) return '13d'; // Snow
        if (code >= 80 && code <= 82) return '09d'; // Showers
        if (code >= 95) return '11d'; // Thunderstorm
        return '02d'; // Default
    }

    /**
     * Cache helpers
     */
    getCached(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTime) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    clearCache() {
        this.cache.clear();
    }
}

module.exports = new WeatherService();


    /**
     * Get current weather for coordinates
     */
    async getCurrentWeather(lat, lon) {
    const cacheKey = `current_${lat}_${lon}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${this.baseUrl}/weather`, {
            params: {
                lat,
                lon,
                appid: this.apiKey,
                units: 'metric',
                lang: 'tr'
            }
        });

        const data = {
            temperature: response.data.main.temp,
            feelsLike: response.data.main.feels_like,
            humidity: response.data.main.humidity,
            pressure: response.data.main.pressure,
            windSpeed: response.data.wind.speed,
            windDirection: response.data.wind.deg,
            cloudCover: response.data.clouds.all,
            description: response.data.weather[0].description,
            icon: response.data.weather[0].icon,
            sunrise: new Date(response.data.sys.sunrise * 1000),
            sunset: new Date(response.data.sys.sunset * 1000),
            timestamp: new Date()
        };

        this.setCache(cacheKey, data);
        return data;
    } catch (error) {
        console.error('Weather API Error:', error.message);
        throw new Error('Hava durumu bilgisi alınamadı');
    }
}

    /**
     * Get 7-day forecast
     */
    async getForecast(lat, lon, days = 7) {
    const cacheKey = `forecast_${lat}_${lon}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${this.baseUrl}/forecast`, {
            params: {
                lat,
                lon,
                appid: this.apiKey,
                units: 'metric',
                lang: 'tr',
                cnt: days * 8 // 8 times per day (3-hour intervals)
            }
        });

        const forecast = response.data.list.map(item => ({
            timestamp: new Date(item.dt * 1000),
            temperature: item.main.temp,
            humidity: item.main.humidity,
            pressure: item.main.pressure,
            windSpeed: item.wind.speed,
            precipitation: item.rain?.['3h'] || 0,
            cloudCover: item.clouds.all,
            description: item.weather[0].description,
            icon: item.weather[0].icon
        }));

        this.setCache(cacheKey, forecast);
        return forecast;
    } catch (error) {
        console.error('Forecast API Error:', error.message);
        throw new Error('Hava tahmini alınamadı');
    }
}

    /**
     * Get daily summary forecast (simplified 7-day)
     */
    async getDailySummary(lat, lon) {
    const forecast = await this.getForecast(lat, lon, 7);

    // Group by day and get midday forecast
    const dailyMap = new Map();
    forecast.forEach(item => {
        const date = item.timestamp.toISOString().split('T')[0];
        if (!dailyMap.has(date)) {
            dailyMap.set(date, []);
        }
        dailyMap.get(date).push(item);
    });

    const dailySummary = [];
    for (const [date, items] of dailyMap) {
        // Get midday forecast (around 12:00) or closest
        const middayForecast = items.reduce((prev, curr) => {
            const prevHour = new Date(prev.timestamp).getHours();
            const currHour = new Date(curr.timestamp).getHours();
            return Math.abs(currHour - 12) < Math.abs(prevHour - 12) ? curr : prev;
        });

        // Calculate daily averages
        const avgTemp = items.reduce((sum, i) => sum + i.temperature, 0) / items.length;
        const maxTemp = Math.max(...items.map(i => i.temperature));
        const minTemp = Math.min(...items.map(i => i.temperature));
        const totalPrecipitation = items.reduce((sum, i) => sum + i.precipitation, 0);

        dailySummary.push({
            date,
            avgTemperature: Math.round(avgTemp * 10) / 10,
            maxTemperature: Math.round(maxTemp * 10) / 10,
            minTemperature: Math.round(minTemp * 10) / 10,
            precipitation: Math.round(totalPrecipitation * 10) / 10,
            description: middayForecast.description,
            icon: middayForecast.icon,
            windSpeed: middayForecast.windSpeed,
            humidity: middayForecast.humidity
        });
    }

    return dailySummary;
}

    /**
     * Check if rain is expected in next N hours
     */
    async willRainSoon(lat, lon, hours = 24) {
    const forecast = await this.getForecast(lat, lon);
    const now = Date.now();
    const cutoff = now + hours * 60 * 60 * 1000;

    const rainForecast = forecast.filter(f =>
        f.timestamp.getTime() <= cutoff && f.precipitation > 0
    );

    return {
        willRain: rainForecast.length > 0,
        totalPrecipitation: rainForecast.reduce((sum, f) => sum + f.precipitation, 0),
        firstRainTime: rainForecast.length > 0 ? rainForecast[0].timestamp : null
    };
}

/**
 * Cache helpers
 */
getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTime) {
        return cached.data;
    }
    return null;
}

setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Clear cache (for testing or manual refresh)
 */
clearCache() {
    this.cache.clear();
}
}

module.exports = new WeatherService();
