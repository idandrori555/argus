import { BaseAgent } from './base_agent.ts';
import type { AgentInput } from './types.ts';

export class GraderAgent extends BaseAgent {
  constructor(modelName: string = 'gemini-2.5-flash') {
    const systemPrompt = `
      You are a Senior Computer Science Examiner. 
      Evaluate the student's extracted exam text against the provided rubric. 
      Grade every single question rigorously, point by point. Provide a strict deduction breakdown for errors.
    `;
    super('Grader', modelName, systemPrompt);
  }

  public async run(input: AgentInput): Promise<string> {
    return "";
  }
}
