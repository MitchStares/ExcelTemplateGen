export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIProvider {
  complete(messages: AIMessage[], systemPrompt: string): Promise<string>;
}
