import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, GenerateParams } from "./types.ts";
import { ANTHROPIC_API_KEY } from '../env.ts';

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic';
  private client: Anthropic;

  constructor() {
    if (!ANTHROPIC_API_KEY) {
      throw new Error("AnthropicProvider: Missing ANTHROPIC_API_KEY environment variable.");
    }
    this.client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }

  async generate(params: GenerateParams): Promise<string> {
    const contentBlocks: Anthropic.MessageParam['content'] = params.contents.map(c => {
      if (c.type === 'text') {
        return { type: 'text', text: c.text };
      }
      return {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: c.data.toString('base64'),
        },
      };
    });

    const response = await this.client.messages.create({
      model: params.model,
      max_tokens: 8192,
      system: params.systemPrompt,
      messages: [{ role: 'user', content: contentBlocks }],
    });

    return response.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('');
  }
}
