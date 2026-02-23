import OpenAI from 'openai';
import type { AIProvider, AIMessage } from './types';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    const isAzure = process.env.AI_PROVIDER === 'azure';

    if (isAzure) {
      if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_DEPLOYMENT) {
        throw new Error('Azure OpenAI requires AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT.');
      }
      this.client = new OpenAI({
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
        defaultQuery: { 'api-version': '2024-02-01' },
        defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
      });
      this.model = process.env.AZURE_OPENAI_DEPLOYMENT!;
    } else {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is not set.');
      }
      this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      this.model = process.env.OPENAI_MODEL ?? 'gpt-4o';
    }
  }

  async complete(messages: AIMessage[], systemPrompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
    });
    return response.choices[0]?.message?.content ?? '';
  }
}
