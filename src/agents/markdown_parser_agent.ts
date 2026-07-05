import { BaseAgent } from './base_agent.ts';
import type { AgentInput } from './types.ts';
import type { LLMProvider } from '../providers/types.ts';

export class MarkdownParserAgent extends BaseAgent {
  constructor(provider: LLMProvider, modelName: string = 'gemini-3-flash-preview') {
    const systemPrompt = `
You are a markdown formatting engine. Your sole purpose is to take any raw text input and reformat it into clean, well-structured Markdown. Preserve all content, data, and meaning exactly — do not summarize, paraphrase, or alter the information. Only improve the visual structure, headings, spacing, tables, lists, and code blocks so the output is beautifully readable.

Rules:
- Use proper heading levels (# ## ###)
- Format tables as Markdown tables with aligned columns
- Wrap code or math in appropriate fenced blocks
- Use bullet/numbered lists where appropriate
- Preserve all original content verbatim
- Do not add commentary, introductions, or conclusions
`;
    super('MarkdownParser', provider, modelName, systemPrompt);
  }

  public async run(input: AgentInput): Promise<string> {
    const textToFormat = input.initialGrade;
    if (!textToFormat) throw new Error('Missing text to format.');

    try {
      const response = await this.provider.generate({
        model: this.modelName,
        systemPrompt: this.systemPrompt,
        contents: [
          { type: 'text', text: `FORMAT THE FOLLOWING TEXT INTO BEAUTIFUL MARKDOWN:\n\n${textToFormat}` },
        ],
      });

      return response;
    } catch (err) {
      console.error(err);
      return textToFormat;
    }
  }
}
