export class DiamiqClient {
    constructor(config: {
        apiKey: string;
        endpoint?: string;
        debug?: boolean;
        fetch?: any;
    });

    setApiKey(key: string): void;
    setDebug(enabled: boolean): void;

    checkToken(): Promise<any>;

    getTemplates(filters?: {
        search?: string;
        tags?: string[];
    }): Promise<any[]>;

    getTemplate(templateId: string): Promise<any>;

    getPlaceholders(templateId: string): Promise<{
        placeholders: Array<{ key: string; required: boolean; description?: string }>
    }>;

    validatePayload(templateId: string, payload: object, placeholders?: any[]): Promise<boolean>;

    generate(
        templateId: string,
        data: object,
        options?: { output?: 'pdf' | 'docx' }
    ): Promise<{ id: string; url: string; format: string; expiresAt: string }>;
}

export class DiamiqError extends Error {
    status: number;
    code: string;
    metadata?: Record<string, any>;
}