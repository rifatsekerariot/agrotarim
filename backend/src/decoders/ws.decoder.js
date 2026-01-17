/**
 * Milesight WS Series Decoder (Weather Stations)
 * Supports: WS101, WS301, WS52x, WS558, etc.
 */

function decode(buffer, fPort) {
    const data = {};
    let i = 0;

    while (i < buffer.length) {
        const channel = buffer[i++];
        const type = buffer[i++];

        switch (type) {
            case 0x01: // Battery
                data.battery = buffer[i++];
                break;

            case 0x03: // Temperature (2 bytes, signed)
                data.t_air = buffer.readInt16LE(i) / 10;
                i += 2;
                break;

            case 0x04: // Humidity (1 byte)
                data.h_air = buffer[i++] / 2;
                break;

            case 0x06: // Light/Solar Radiation (2 bytes)
                data.light = buffer.readUInt16LE(i);
                i += 2;
                break;

            case 0x07: // UV Index (1 byte)
                data.uv_index = buffer[i++];
                break;

            case 0x09: // Barometric Pressure (2 bytes)
                data.pressure = buffer.readUInt16LE(i) / 10;
                i += 2;
                break;

            case 0x0A: // Wind Speed (2 bytes, m/s * 10)
                data.wind_speed = buffer.readUInt16LE(i) / 10;
                i += 2;
                break;

            case 0x0B: // Wind Direction (2 bytes, degrees)
                data.wind_dir = buffer.readUInt16LE(i);
                i += 2;
                break;

            case 0x0C: // Rainfall (2 bytes, mm * 10)
                data.rain = buffer.readUInt16LE(i) / 10;
                i += 2;
                break;

            case 0x0D: // Rain Gauge (hourly, 2 bytes)
                data.rain_hourly = buffer.readUInt16LE(i) / 10;
                i += 2;
                break;

            case 0x0E: // Rain Gauge (daily, 2 bytes)
                data.rain_daily = buffer.readUInt16LE(i) / 10;
                i += 2;
                break;

            case 0x0F: // Wind Gust (2 bytes)
                data.wind_gust = buffer.readUInt16LE(i) / 10;
                i += 2;
                break;

            case 0x10: // Solar Radiation (W/m², 2 bytes)
                data.solar_radiation = buffer.readUInt16LE(i);
                i += 2;
                break;

            case 0x11: // Dew Point (2 bytes, signed)
                data.dew_point = buffer.readInt16LE(i) / 10;
                i += 2;
                break;

            case 0x12: // Heat Index (2 bytes, signed)
                data.heat_index = buffer.readInt16LE(i) / 10;
                i += 2;
                break;

            case 0x13: // Wind Chill (2 bytes, signed)
                data.wind_chill = buffer.readInt16LE(i) / 10;
                i += 2;
                break;

            default:
                console.log(`[WS] Unknown type 0x${type.toString(16)} at channel ${channel}`);
                i++; // Skip at least one byte
                break;
        }
    }

    return data;
}

module.exports = { decode };
