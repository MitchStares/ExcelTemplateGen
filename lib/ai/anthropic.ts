import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, AIMessage } from './types';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set.');
    }
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
  }

  async complete(messages: AIMessage[], systemPrompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const block = response.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response type from Anthropic');
    return block.text;
  }
}
