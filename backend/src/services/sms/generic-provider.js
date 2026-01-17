const axios = require('axios');

/**
 * Generic SMS Provider Implementation
 * Works with any SMS provider based on configuration
 */
class GenericSmsProvider {
    constructor(config) {
        this.config = config;
        this.name = config.name || 'Unknown Provider';
    }

    /**
     * Build authentication headers based on provider config
     */
    _buildHeaders() {
        const headers = {
            'Content-Type': this.config.contentType || 'application/json',
            'User-Agent': 'AgroMeta-SMS/1.0'
        };

        const { authType, credentials } = this.config;

        switch (authType) {
            case 'basic':
                const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
                headers['Authorization'] = `Basic ${auth}`;
                break;

            case 'token':
                headers['Authorization'] = `Bearer ${credentials.token}`;
                break;

            case 'api_key':
                headers['X-API-Key'] = credentials.apiKey;
                break;

            case 'custom_header':
                Object.assign(headers, credentials.customHeaders || {});
                break;
        }

        return headers;
    }

    /**
     * Build request payload based on provider format
     */
    _buildPayload(to, message, senderId) {
        const { fieldMappings, payloadFormat, countryCode } = this.config;

        // Normalize phone number
        let phone = to.startsWith('+') ? to : `${countryCode || '+90'}${to}`;
        phone = phone.replace(/\s/g, '');

        const payload = {};
        payload[fieldMappings.recipient] = phone;
        payload[fieldMappings.message] = message;

        if (senderId && fieldMappings.sender) {
            payload[fieldMappings.sender] = senderId;
        }

        // Add credentials if required in payload (some providers need this)
        if (this.config.credentialsInPayload) {
            const { credentials } = this.config;
            if (credentials.username) payload.username = credentials.username;
            if (credentials.password) payload.password = credentials.password;
            if (credentials.apiKey) payload.apiKey = credentials.apiKey;
        }

        return payload;
    }

    /**
     * Send SMS via configured provider
     */
    async sendSms(to, message, senderId) {
        try {
            const url = `${this.config.baseUrl}${this.config.sendEndpoint}`;
            const headers = this._buildHeaders();
            const payload = this._buildPayload(to, message, senderId);

            let response;

            if (this.config.httpMethod === 'GET') {
                // GET request with query params
                response = await axios.get(url, {
                    params: payload,
                    headers,
                    timeout: 10000
                });
            } else {
                // POST request
                if (this.config.payloadFormat === 'form') {
                    // Form-encoded
                    const params = new URLSearchParams();
                    for (const [key, value] of Object.entries(payload)) {
                        params.append(key, value);
                    }
                    headers['Content-Type'] = 'application/x-www-form-urlencoded';
                    response = await axios.post(url, params, { headers, timeout: 10000 });
                } else {
                    // JSON
                    response = await axios.post(url, payload, { headers, timeout: 10000 });
                }
            }

            // Parse response
            const { data, status } = response;
            const success = this._isSuccessResponse(data, status);

            if (!success) {
                const errorMsg = this._extractErrorMessage(data);
                throw new Error(errorMsg || 'SMS send failed');
            }

            // Extract message ID if available
            const messageId = this.config.fieldMappings.messageId
                ? data[this.config.fieldMappings.messageId]
                : null;

            return {
                success: true,
                messageId,
                provider: this.name,
                rawResponse: data
            };

        } catch (error) {
            throw {
                success: false,
                provider: this.name,
                error: error.message,
                details: error.response?.data
            };
        }
    }

    /**
     * Send bulk SMS
     */
    async sendBulkSms(recipients, message, senderId) {
        const results = [];

        for (const to of recipients) {
            try {
                const result = await this.sendSms(to, message, senderId);
                results.push({ to, ...result });
            } catch (error) {
                results.push({ to, success: false, error: error.message });
            }
        }

        return results;
    }

    /**
     * Check account balance (if supported)
     */
    async checkBalance() {
        if (!this.config.balanceEndpoint) {
            throw new Error('Balance check not supported by this provider');
        }

        const url = `${this.config.baseUrl}${this.config.balanceEndpoint}`;
        const headers = this._buildHeaders();

        const response = await axios.get(url, { headers, timeout: 5000 });
        return response.data;
    }

    /**
     * Check message status (if supported)
     */
    async checkStatus(messageId) {
        if (!this.config.statusEndpoint) {
            throw new Error('Status check not supported by this provider');
        }

        const url = `${this.config.baseUrl}${this.config.statusEndpoint}`.replace('{messageId}', messageId);
        const headers = this._buildHeaders();

        const response = await axios.get(url, { headers, timeout: 5000 });
        return response.data;
    }

    /**
     * Check if response indicates success
     */
    _isSuccessResponse(data, statusCode) {
        if (statusCode < 200 || statusCode >= 300) return false;

        if (this.config.successPattern) {
            const pattern = new RegExp(this.config.successPattern);
            const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
            return pattern.test(dataStr);
        }

        // Default: HTTP 2xx = success
        return true;
    }

    /**
     * Extract error message from response
     */
    _extractErrorMessage(data) {
        if (this.config.errorPattern) {
            const pattern = new RegExp(this.config.errorPattern);
            const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
            const match = dataStr.match(pattern);
            return match ? match[0] : 'Unknown error';
        }

        if (typeof data === 'object' && data.error) {
            return data.error;
        }

        return 'SMS send failed';
    }
}

module.exports = GenericSmsProvider;
