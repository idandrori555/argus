import { BaseAgent } from './base_agent.ts';
import type { AgentInput } from './types.ts';

export class VisualParserAgent extends BaseAgent {
  private static readonly defaultModelName = 'gemini-2.5-flash';

  constructor(modelName: string = VisualParserAgent.defaultModelName) {
    const systemPrompt = `
      You are a specialized Computer Science exam parser. Your job is to extract data cleanly:
      1. Source Code: Copy it exactly into Markdown codeblocks.
      2. Trace Tables: Reconstruct them into clean Markdown tables.
      3. Diagrams (Trees, Automata, Graphs): Describe them structurally and logically in absolute detail 
         so a blind evaluator understands every connection, node, value, and edge transition perfectly.
    `;
    super('VisualParser', modelName, systemPrompt);
  }

  public async run(input: AgentInput): Promise<string> {
    if (!input.pdfBuffer) {
      throw new Error(`[${this.name}] Missing required pdfBuffer input.`);
    }

    console.log(`🤖 [${this.name}] Extracting layout, code, and diagrams using ${this.modelName}...`);

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: [
        {
          inlineData: {
            data: input.pdfBuffer.toString('base64'),
            mimeType: 'application/pdf',
          },
        },
        this.systemPrompt,
      ],
    });

    return response.text || 'Failed to extract exam text layout.';
  }
}
