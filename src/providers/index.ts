import type { LLMProvider } from "./types.ts";
import { GeminiProvider } from "./gemini.ts";
import { AnthropicProvider } from "./anthropic.ts";
import { OpenAIProvider } from "./openai.ts";

export type { LLMProvider, GenerateParams, Content } from "./types.ts";

export function createProvider(providerName: string): LLMProvider {
  switch (providerName) {
    case 'gemini':
      return new GeminiProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'openai':
      return new OpenAIProvider();
    default:
      throw new Error(`Unknown provider: "${providerName}". Valid options: gemini, anthropic, openai`);
  }
}
