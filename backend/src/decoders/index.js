/**
 * Payload Decoder Index
 * Routes to the appropriate decoder based on device model/type
 */

const em300Decoder = require('./em300.decoder');
const em500Decoder = require('./em500.decoder');
const wsDecoder = require('./ws.decoder');

/**
 * Decode a payload based on decoder type and model
 * @param {string} decoderType - 'milesight', 'cayenne_lpp', 'custom'
 * @param {string} model - Device model name (e.g., 'EM300-TH', 'EM500-SMTC')
 * @param {Buffer} buffer - Raw payload buffer
 * @param {number} fPort - LoRaWAN fPort
 * @returns {object} Decoded data object
 */
function decodePayload(decoderType, model, buffer, fPort) {
    try {
        // Milesight decoders
        if (decoderType === 'milesight' || decoderType === 'Milesight') {
            const modelUpper = (model || '').toUpperCase();

            if (modelUpper.startsWith('EM300') || modelUpper.includes('EM-300')) {
                return em300Decoder.decode(buffer, fPort);
            }

            if (modelUpper.startsWith('EM500') || modelUpper.includes('EM-500')) {
                return em500Decoder.decode(buffer, fPort);
            }

            if (modelUpper.startsWith('WS') || modelUpper.includes('WEATHER')) {
                return wsDecoder.decode(buffer, fPort);
            }

            // Generic Milesight format (try EM300 decoder as fallback)
            console.log(`[Decoder] Unknown Milesight model: ${model}, using generic decoder`);
            return em300Decoder.decode(buffer, fPort);
        }

        // Cayenne LPP format
        if (decoderType === 'cayenne_lpp') {
            return decodeCayenneLPP(buffer);
        }

        // Custom decoder (stored in database as JavaScript code)
        if (decoderType === 'custom') {
            console.log('[Decoder] Custom decoder not implemented yet');
            return {};
        }

        // Generic fallback - try all decoders
        console.log('[Decoder] Using generic fallback decoder');
        return genericDecode(buffer);

    } catch (error) {
        console.error('[Decoder] Decode error:', error);
        return {};
    }
}

/**
 * Cayenne Low Power Payload decoder
 */
function decodeCayenneLPP(buffer) {
    const data = {};
    let i = 0;

    while (i < buffer.length) {
        const channel = buffer[i++];
        const type = buffer[i++];

        switch (type) {
            case 0x00: // Digital Input
                data[`digital_${channel}`] = buffer[i++];
                break;
            case 0x01: // Digital Output
                data[`digital_out_${channel}`] = buffer[i++];
                break;
            case 0x02: // Analog Input (2 bytes, 0.01 resolution)
                data[`analog_${channel}`] = buffer.readInt16BE(i) / 100;
                i += 2;
                break;
            case 0x67: // Temperature (2 bytes, 0.1°C resolution)
                data[`t_${channel}`] = buffer.readInt16BE(i) / 10;
                i += 2;
                break;
            case 0x68: // Humidity (1 byte, 0.5% resolution)
                data[`h_${channel}`] = buffer[i++] / 2;
                break;
            case 0x71: // Accelerometer (6 bytes, x/y/z)
                data[`accel_x_${channel}`] = buffer.readInt16BE(i) / 1000;
                data[`accel_y_${channel}`] = buffer.readInt16BE(i + 2) / 1000;
                data[`accel_z_${channel}`] = buffer.readInt16BE(i + 4) / 1000;
                i += 6;
                break;
            case 0x73: // Barometric Pressure (2 bytes, hPa)
                data[`pressure_${channel}`] = buffer.readUInt16BE(i) / 10;
                i += 2;
                break;
            case 0x86: // Gyrometer (6 bytes)
                data[`gyro_x_${channel}`] = buffer.readInt16BE(i) / 100;
                data[`gyro_y_${channel}`] = buffer.readInt16BE(i + 2) / 100;
                data[`gyro_z_${channel}`] = buffer.readInt16BE(i + 4) / 100;
                i += 6;
                break;
            case 0x88: // GPS (9 bytes)
                data[`lat_${channel}`] = (buffer.readInt16BE(i) << 8 | buffer[i + 2]) / 10000;
                data[`lng_${channel}`] = (buffer.readInt16BE(i + 3) << 8 | buffer[i + 5]) / 10000;
                data[`alt_${channel}`] = (buffer.readInt16BE(i + 6) << 8 | buffer[i + 8]) / 100;
                i += 9;
                break;
            default:
                console.log(`[CayenneLPP] Unknown type 0x${type.toString(16)}`);
                i++;
                break;
        }
    }

    return data;
}

/**
 * Generic decoder - tries to identify common patterns
 */
function genericDecode(buffer) {
    const data = {};

    // If payload is JSON, parse it
    try {
        const jsonStr = buffer.toString('utf8');
        if (jsonStr.startsWith('{')) {
            return JSON.parse(jsonStr);
        }
    } catch (e) {
        // Not JSON, continue
    }

    // Simple hex dump for debugging
    data.raw_hex = buffer.toString('hex');

    // Try to extract common values if buffer seems structured
    if (buffer.length >= 2) {
        // Common patterns: first byte often indicates battery or message type
        const firstByte = buffer[0];
        if (firstByte <= 100) {
            data.battery = firstByte;
        }
    }

    return data;
}

module.exports = { decodePayload };
