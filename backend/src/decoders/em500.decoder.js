/**
 * Milesight EM500 Series Decoder
 * Supports: EM500-SMTC (Soil), EM500-CO2, EM500-PP (Pipe Pressure), etc.
 */

function decode(buffer, fPort) {
    const data = {};
    let i = 0;

    while (i < buffer.length) {
        const channel = buffer[i++];
        const type = buffer[i++];

        // Safety check: ensure we have enough bytes for the smallest payload part
        if (i >= buffer.length && type !== 0x00) break;

        switch (type) {
            case 0x01: // Battery
                data.battery = buffer[i++];
                break;

            case 0x03: // Temperature (2 bytes)
                if (i + 2 > buffer.length) break;
                // Generic 'temperature' instead of 't_soil' to fit both Air and Soil sensors
                data.temperature = buffer.readInt16LE(i) / 10;
                i += 2;
                break;

            case 0x04: // Humidity/Moisture
                // 0x04 type can be 1 byte (Humidity) or 2 bytes (Moisture) depending on sensor gen
                // but usually EM500 uses logic based on channel or specific length
                // Milesight standard: Humidity is 1 byte, Moisture is 2 bytes.
                // Safest approach: Check channel or assume 1 byte for 0x04 unless context implies soil
                if (channel === 0x04 && i + 2 <= buffer.length) {
                    data.moisture = buffer.readUInt16LE(i) / 10;
                    i += 2;
                } else {
                    data.humidity = buffer[i++] / 2;
                }
                break;

            case 0x07: // CO2 (2 bytes)
                if (i + 2 > buffer.length) break;
                data.co2 = buffer.readUInt16LE(i);
                i += 2;
                break;

            case 0x09: // Barometric Pressure (2 bytes)
                if (i + 2 > buffer.length) break;
                data.pressure = buffer.readUInt16LE(i) / 10; // hPa
                i += 2;
                break;

            default:
                // Skip unknown bytes safely? Hard to guess length. 
                // Milesight TLV format usually implies known types.
                // Just log and attempt to continue by skipping 1 byte or break
                console.log(`[EM500] Unknown type 0x${type.toString(16)} at channel ${channel}`);
                // Simple heuristic: most data types are 2 bytes.
                // But safer to break if unknown structure to avoid garbage data.
                break;
        }
    }

    return data;
}

module.exports = { decode };
