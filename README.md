# Diamiq JS SDK

Enterprise-grade JavaScript client for the [Diamiq Document Automation Platform](https://diamiq.com).  
Use it to authenticate with workspace API tokens, fetch DOCX templates, and generate PDF or DOCX documents programmatically — from WordPress, Shopify, Webflow, Wix, or custom applications.

---

## Overview

Diamiq automates business documents: teams design DOCX templates, add placeholders (`{{ name }}`), and generate documents using dynamic JSON data.

This SDK wraps the HTTPS API:

https://diamiq.com/api/sdk/v1

It provides:
- minimal dependencies
- predictable error handling
- identical behavior in Node.js, Bun, Deno, and modern browsers (only in secure contexts)

## Key Features

- Authenticate with workspace-scoped API tokens created in the Diamiq dashboard
- Generate PDF/DOCX documents by merging dynamic JSON data into template placeholders
- Fetch available templates for in-product pickers or validation flows
- Works in browsers and server environments (Node, Bun, Deno)
- Small footprint, ESM + CJS builds
- Runtime helpers:
    - `setApiKey()` for key rotation
    - `setDebug()` for verbose request logging
- Standardized `DiamiqError` with `status`, `code`, `message`, and optional metadata

## Installation
```bash
npm install diamiq-js-sdk
```

```bash
yarn add diamiq-js-sdk
```

```html
<script src="https://cdn.jsdelivr.net/gh/Unquam/diamiq-js-sdk/dist/diamiq-sdk.min.js"></script>
```
The CDN build exposes a global DiamiqClient.

## Quick Start
```js
import { DiamiqClient } from 'diamiq-js-sdk';

const client = new DiamiqClient({
    apiKey: process.env.DIAMIQ_API_KEY,
    endpoint: 'https://diamiq.com/api/sdk/v1',
});
```

## Usage Examples
### Generate a PDF or DOCX
```js
const document = await client.generate('tmpl_12345', {
    name: 'John Doe',
    invoice: {
        number: 'INV-2048',
        items: [
            { label: 'Consulting', qty: 12, rate: 250 },
            { label: 'Licensing', qty: 1, rate: 1200 },
        ],
    },
});

console.log(document.url);
```

### Response object:
```json
{
  "id": "doc_01HF...",
  "url": "https://diamiq.com/storage/....pdf",
  "format": "pdf",
  "expiresAt": "2025-01-01T00:00:00Z"
}
```

### Fetch templates
```js
const templates = await client.getTemplates();

console.table(
    templates.map(t => ({
        id: t.id,
        name: t.name,
        tags: t.tags,
    }))
);
```

### Rotate API Key
```js
client.setApiKey('new_key_here');
```

### Enable Debug Logs
```js
client.setDebug(true);
```

## API Reference
### `new DiamiqClient({ apiKey, endpoint, debug })`
- `apiKey` **string** (required): Workspace token from the Diamiq dashboard.
- `endpoint` **string** (optional): Defaults to `https://diamiq.com/api/sdk/v1`.
- `debug` **boolean** (optional): Emits verbose transport logs when `true`.

### `client.generate(templateId, data, options?)`
- `templateId` **string**: Template identifier (`tmpl_123`).
- `data` **object**: JSON payload merged into placeholders.
- `options` **object** (optional): Additional options.
- `output` **'pdf' \| 'docx'** (optional): Overrides the template default.
- Returns a Promise resolving to a document descriptor `{ id, url, format, expiresAt }`.

### `client.getTemplates()`
Returns array of:
```json
{
  "id": "tmpl_123",
  "name": "NDA Template",
  "description": "Standard legal NDA",
  "tags": ["legal", "nda"],
  "updatedAt": "2025-01-05T12:00:00Z"
}
```

### `client.setApiKey(key)`
- Replaces the current API key without re-instantiating the client.

### `client.setDebug(enabled)`
- Turns debug mode on/off.

### Error Handling
All SDK calls throw DiamiqError for non-2xx responses.

```js
try {
    const doc = await client.generate('tmpl_123', { name: 'John' });
} catch (error) {
    if (error.name === 'DiamiqError') {
        console.error(error.status, error.code, error.message, error.metadata);
    }
}
```

## Error shape:
```ts
interface DiamiqError {
    status: number;
    code: string;
    message: string;
    metadata?: Record<string, unknown>;
}
```

## Security Best Practices
⚠ Never expose workspace API keys in client-side code.
Use backend proxy endpoints or serverless functions.

### Recommended:
- Use environment variables (DIAMIQ_API_KEY)
- Rotate tokens periodically
- Issue separate tokens per integration (Shopify / WP / Webflow)
- Revoke tokens immediately on suspicion of compromise

## Browser Notes
The SDK works in browsers, but API keys MUST NOT be shipped to the frontend.
### Use a backend proxy like:
```text
/api/generate-document → calls Diamiq server-side → returns file to the browser
```

## Support
For enterprise onboarding, SLA, or implementation help:
[diamiq.com](https://diamiq.com)

## License
Proprietary software. All rights reserved © Diamiq.com.
