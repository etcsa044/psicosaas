export interface LLMResponse {
    content: string;
    tokensUsed: number;
    model: string;
}

export interface ILLMAdapter {
    generateResponse(systemPrompt: string, userMessage: string, context?: string): Promise<LLMResponse>;
}

export class GPTAdapter implements ILLMAdapter {
    private apiKey: string;
    private model: string;

    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || '';
        this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    }

    async generateResponse(systemPrompt: string, userMessage: string, context?: string): Promise<LLMResponse> {
        if (!this.apiKey) {
            return { content: `[DEV MODE] Received: "${userMessage.substring(0, 50)}..."`, tokensUsed: 0, model: 'dev-mock' };
        }

        const messages: any[] = [{ role: 'system', content: systemPrompt }];
        if (context) messages.push({ role: 'system', content: `Context: ${context}` });
        messages.push({ role: 'user', content: userMessage });

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: this.model, messages, max_tokens: 500, temperature: 0.7 }),
        });

        const data = await response.json() as any;
        return {
            content: data.choices?.[0]?.message?.content || 'No pude generar una respuesta.',
            tokensUsed: data.usage?.total_tokens || 0,
            model: this.model,
        };
    }
}

export const gptAdapter = new GPTAdapter();
