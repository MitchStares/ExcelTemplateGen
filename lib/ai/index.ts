import type { AIProvider, AIMessage } from './types';

export type { AIProvider, AIMessage };

let _provider: AIProvider | undefined;

export function getAIProvider(): AIProvider {
  if (_provider) return _provider;

  const providerName = (process.env.AI_PROVIDER ?? 'anthropic').toLowerCase();

  switch (providerName) {
    case 'anthropic': {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { AnthropicProvider } = require('./anthropic') as typeof import('./anthropic');
      _provider = new AnthropicProvider();
      break;
    }
    case 'openai':
    case 'azure': {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { OpenAIProvider } = require('./openai') as typeof import('./openai');
      _provider = new OpenAIProvider();
      break;
    }
    default:
      throw new Error(
        `Unknown AI_PROVIDER "${providerName}". Valid values: anthropic, openai, azure.`
      );
  }

  return _provider!;
}
