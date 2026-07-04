import { GoogleGenAI } from "@google/genai";
import type { LLMProvider, GenerateParams } from "./types.ts";
import { GEMINI_API_KEY } from '../env.ts';

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  private ai: GoogleGenAI;

  constructor() {
    if (!GEMINI_API_KEY) {
      throw new Error("GeminiProvider: Missing GEMINI_API_KEY environment variable.");
    }
    this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }

  async generate(params: GenerateParams): Promise<string> {
    const contents = params.contents.map(c => {
      if (c.type === 'text') return c.text;
      return {
        inlineData: {
          mimeType: 'application/pdf',
          data: c.data.toString('base64'),
        },
      };
    });

    const response = await this.ai.models.generateContent({
      model: params.model,
      config: {
        systemInstruction: params.systemPrompt,
      },
      contents,
    });

    return response.text ?? "No Response!";
  }
}
