const axios = require('axios');

class WeatherService {
    constructor() {
        this.apiKey = process.env.OPENWEATHER_API_KEY || '';
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
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
