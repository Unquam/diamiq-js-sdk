// src/diamiq-client.js

const DEFAULT_ENDPOINT = 'https://diamiq.com/api/sdk/v1';

/**
 * Unified error type for all SDK failures.
 */
export class DiamiqError extends Error {
    constructor(message, status, code, metadata = {}) {
        super(message);
        this.name = 'DiamiqError';
        this.status = status;
        this.code = code;
        this.metadata = metadata;
    }
}

/**
 * DiamiqClient — main SDK entrypoint.
 * Handles transport, validation, token management, templates, and document generation.
 */
export class DiamiqClient {
    constructor(config = {}) {
        const { apiKey, endpoint = DEFAULT_ENDPOINT, debug = false, fetch: fetchImpl } = config;

        if (!endpoint || typeof endpoint !== 'string') {
            throw new Error('[Diamiq] "endpoint" must be a non-empty string.');
        }

        this._apiKey = apiKey || null;
        this._endpoint = endpoint.replace(/\/+$/, '');
        this._debug = Boolean(debug);
        this._fetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);

        if (!this._fetch) {
            throw new Error('[Diamiq] global fetch is not available. Provide config.fetch or a polyfill.');
        }
    }

    /** -------------------------------
     *  CONFIGURATION
     * -------------------------------*/

    setApiKey(key) {
        if (!key || typeof key !== 'string') {
            throw new Error('[Diamiq] "apiKey" must be a non-empty string.');
        }
        this._apiKey = key;
    }

    setDebug(enabled) {
        this._debug = Boolean(enabled);
    }

    /** -------------------------------
     *  INTERNAL REQUEST WRAPPER
     * -------------------------------*/
    async _request(path, options = {}) {
        if (!this._apiKey) {
            throw new Error('[Diamiq] API key is required. Call setApiKey().');
        }

        const url = `${this._endpoint}${path.startsWith('/') ? path : `/${path}`}`;
        const { method = 'GET', body } = options;

        const headers = {
            'Authorization': `Bearer ${this._apiKey}`,
            'Accept': 'application/json'
        };

        let payload = undefined;
        if (body !== undefined) {
            headers['Content-Type'] = 'application/json';
            payload = JSON.stringify(body);
        }

        if (this._debug) {
            console.debug('[Diamiq] Request:', {
                url,
                method,
                hasBody: !!body
            });
        }

        const res = await this._fetch(url, { method, headers, body: payload });
        const raw = await res.text();

        let json = null;
        try {
            json = raw ? JSON.parse(raw) : null;
        } catch (_) {
            json = null;
        }

        if (this._debug) {
            console.debug('[Diamiq] Response:', {
                url,
                status: res.status,
                body: json ?? raw
            });
        }

        if (!res.ok) {
            const message =
                (json && (json.message || json.error)) ||
                `Request failed with status ${res.status}`;

            const code = (json && json.code) || 'UNKNOWN_ERROR';
            const metadata = (json && (json.meta || json.details || json)) || {};

            throw new DiamiqError(message, res.status, code, metadata);
        }

        return json;
    }

    /** -------------------------------
     *  1. CHECK TOKEN / LIVE
     * -------------------------------*/
    async checkToken() {
        return this._request('/ping', { method: 'GET' });
    }

    /** -------------------------------
     *  2. LIST TEMPLATES
     * -------------------------------*/
    async getTemplates(filters = {}) {
        const params = new URLSearchParams();

        if (filters.search) params.set('search', String(filters.search));
        if (Array.isArray(filters.tags) && filters.tags.length) {
            params.set('tags', filters.tags.join(','));
        }

        const query = params.toString();
        const path = query ? `/templates?${query}` : '/templates';

        return this._request(path, { method: 'GET' });
    }

    /** -------------------------------
     *  3. SINGLE TEMPLATE DETAILS
     * -------------------------------*/
    async getTemplate(templateId) {
        if (!templateId || typeof templateId !== 'string') {
            throw new Error('[Diamiq] "templateId" must be a non-empty string.');
        }
        return this._request(`/templates/${templateId}`, { method: 'GET' });
    }

    /** -------------------------------
     *  4. GET PLACEHOLDERS
     * -------------------------------*/
    async getPlaceholders(templateId) {
        if (!templateId || typeof templateId !== 'string') {
            throw new Error('[Diamiq] "templateId" must be a non-empty string.');
        }
        return this._request(`/templates/${templateId}/placeholders`, { method: 'GET' });
    }

    /** -------------------------------
     *  5. CLIENT-SIDE VALIDATION
     * -------------------------------*/
    async validatePayload(templateId, payload, placeholders = null) {
        if (typeof payload !== 'object' || payload === null) {
            throw new Error('[Diamiq] "payload" must be an object.');
        }

        if (!placeholders) {
            const res = await this.getPlaceholders(templateId);
            placeholders = res.placeholders || [];
        }

        const requiredKeys = placeholders
            .filter(p => p.required)
            .map(p => p.key);

        const payloadKeys = Object.keys(payload);

        const missing = requiredKeys.filter(k => !payloadKeys.includes(k));
        const allowed = placeholders.map(p => p.key);
        const extra = payloadKeys.filter(k => !allowed.includes(k));

        if (missing.length || extra.length) {
            throw new DiamiqError(
                'Payload validation failed.',
                400,
                'PAYLOAD_INVALID',
                { missing, extra }
            );
        }

        return true;
    }

    /** -------------------------------
     *  6. GENERATE DOCUMENT
     * -------------------------------*/
    async generate(templateId, data = {}, options = {}) {
        if (!templateId || typeof templateId !== 'string') {
            throw new Error('[Diamiq] "templateId" must be a non-empty string.');
        }

        if (typeof data !== 'object' || data === null) {
            throw new Error('[Diamiq] "data" must be an object.');
        }

        const body = {
            template_id: templateId,
            data,
            ...options // output: 'pdf' | 'docx'
        };

        return this._request('/documents/generate', {
            method: 'POST',
            body
        });
    }
}