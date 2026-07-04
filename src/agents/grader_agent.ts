import { BaseAgent } from './base_agent.ts';
import type { AgentInput } from './types.ts';

export class GraderAgent extends BaseAgent {
  constructor(modelName: string = 'gemini-3.1-pro-preview') {
    const systemPrompt = `
      You are a Senior Computer Science Examiner. 
      Evaluate the student's extracted exam text against the provided rubric. 
      Grade every single question rigorously, point by point. Provide a strict deduction breakdown for errors.
    `;
    super('Grader', modelName, systemPrompt);
  }

  public async run(input: AgentInput): Promise<string> {
    if (!input.extractedText || !input.rubric) {
      throw new Error(`[${this.name}] Missing extractedText or rubric inputs.`);
    }

    console.log(`🤖 [${this.name}] Evaluating answers using high-reasoning engine ${this.modelName}...`);

    const userMessage = `
      === OFFICIAL CRITERIA / RUBRIC ===
      ${input.rubric}

      === STUDENT EXAM TEXT ===
      ${input.extractedText}
    `;

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: [
        // Setting system instruction via the standard contents block sequence
        { role: 'user', parts: [{ text: `${this.systemPrompt}\n\n${userMessage}` }] }
      ]
    });

    return response.text || 'Grading engine returned empty result.';
  }
}
