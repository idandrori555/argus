import type { LLMProvider, GenerateParams } from "./types.ts";
import { OPENAI_API_KEY } from '../env.ts';

const SUPPORTS_PDF = false;

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  private client: any;

  constructor() {
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAIProvider: Missing OPENAI_API_KEY environment variable.");
    }
  }

  async generate(params: GenerateParams): Promise<string> {
    const hasPdf = params.contents.some(c => c.type === 'pdf');

    if (hasPdf && !SUPPORTS_PDF) {
      const { OpenAI } = await import('openai');
      this.client = new OpenAI({ apiKey: OPENAI_API_KEY });
      return this.generateWithPdfImages(params);
    }

    const { OpenAI } = await import('openai');
    this.client = new OpenAI({ apiKey: OPENAI_API_KEY });

    const parts: any[] = params.contents.map(c => {
      if (c.type === 'text') {
        return { type: 'text', text: c.text };
      }
      return { type: 'text', text: `[PDF attachment: ${c.displayName ?? 'document'}]` };
    });

    const response = await this.client.chat.completions.create({
      model: params.model,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: parts },
      ],
    });

    return response.choices[0]?.message?.content ?? "No Response!";
  }

  private async generateWithPdfImages(params: GenerateParams): Promise<string> {
    const { pdfToImages } = await import('./pdf-to-images.ts');

    const parts: any[] = [];

    for (const c of params.contents) {
      if (c.type === 'text') {
        parts.push({ type: 'text', text: c.text });
      } else {
        const pageImages = await pdfToImages(c.data);
        if (c.displayName) {
          parts.push({ type: 'text', text: `--- ${c.displayName} ---` });
        }
        for (const img of pageImages) {
          parts.push({
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${img.toString('base64')}` },
          });
        }
      }
    }

    const response = await this.client.chat.completions.create({
      model: params.model,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: parts },
      ],
    });

    return response.choices[0]?.message?.content ?? "No Response!";
  }
}
