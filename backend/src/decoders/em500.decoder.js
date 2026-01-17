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

        switch (type) {
            case 0x01: // Battery
                data.battery = buffer[i++];
                break;

            case 0x03: // Temperature (2 bytes, signed) - Soil Temperature
                data.t_soil = buffer.readInt16LE(i) / 10;
                i += 2;
                break;

            case 0x04: // Moisture/Humidity (1 byte or 2 bytes)
                if (channel === 0x04) {
                    // Soil moisture (2 bytes for higher precision)
                    data.m_soil = buffer.readUInt16LE(i) / 10;
                    i += 2;
                } else {
                    data.h_air = buffer[i++] / 2;
                }
                break;

            case 0x05: // Soil EC (Electrical Conductivity, 2 bytes)
                data.ec_soil = buffer.readUInt16LE(i);
                i += 2;
                break;

            case 0x06: // Soil pH (not common but some EM500)
                data.ph_soil = buffer.readUInt16LE(i) / 100;
                i += 2;
                break;

            case 0x07: // CO2 (2 bytes)
                data.co2 = buffer.readUInt16LE(i);
                i += 2;
                break;

            case 0x09: // Barometric Pressure (2 bytes)
                data.pressure = buffer.readUInt16LE(i) / 10;
                i += 2;
                break;

            case 0x0C: // Distance (ultrasonic) (2 bytes)
                data.distance = buffer.readUInt16LE(i);
                i += 2;
                break;

            case 0x0F: // Soil Water Potential (2 bytes, signed)
                data.swp = buffer.readInt16LE(i);
                i += 2;
                break;

            case 0x10: // Pipe Pressure (4 bytes)
                data.pipe_pressure = buffer.readInt32LE(i) / 1000;
                i += 4;
                break;

            case 0x14: // Soil Dielectric Permittivity
                data.soil_dielectric = buffer.readUInt16LE(i) / 10;
                i += 2;
                break;

            default:
                console.log(`[EM500] Unknown type 0x${type.toString(16)} at channel ${channel}`);
                i++; // Skip at least one byte
                break;
        }
    }

    return data;
}

module.exports = { decode };
