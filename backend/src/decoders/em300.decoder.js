/**
 * Milesight EM300 Series Decoder
 * Supports: EM300-TH, EM300-MCS, EM300-SLD, etc.
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

            case 0x05: // PIR (motion)
                data.pir = buffer[i++];
                break;

            case 0x06: // Light (lumens, 2 bytes)
                data.light = buffer.readUInt16LE(i);
                i += 2;
                break;

            case 0x07: // CO2 (2 bytes)
                data.co2 = buffer.readUInt16LE(i);
                i += 2;
                break;

            case 0x08: // TVOC (2 bytes)
                data.tvoc = buffer.readUInt16LE(i);
                i += 2;
                break;

            case 0x09: // Pressure (2 bytes)
                data.pressure = buffer.readUInt16LE(i) / 10;
                i += 2;
                break;

            case 0x0A: // PM2.5 (2 bytes)
                data.pm2_5 = buffer.readUInt16LE(i);
                i += 2;
                break;

            case 0x0B: // PM10 (2 bytes)
                data.pm10 = buffer.readUInt16LE(i);
                i += 2;
                break;

            case 0x0D: // Door/Window contact
                data.door = buffer[i++];
                break;

            case 0x0E: // Water leak
                data.leak = buffer[i++];
                break;

            case 0x15: // Beep (buzzer control response)
                data.beep = buffer[i++];
                break;

            default:
                // Unknown type, try to skip
                console.log(`[EM300] Unknown type 0x${type.toString(16)} at channel ${channel}`);
                i++; // Skip at least one byte
                break;
        }
    }

    return data;
}

module.exports = { decode };
