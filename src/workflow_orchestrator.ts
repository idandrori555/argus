import { VisualParserAgent } from './agents/visual_parser_agent.ts';
import { GraderAgent } from './agents/grader_agent.ts'
import { CriticAgent } from './agents/critic_agent.ts';
import { createProvider } from './providers/index.ts';

export class WorkflowOrchestrator {
  private parser: VisualParserAgent;
  private grader: GraderAgent;
  private critic: CriticAgent;

  constructor() {
    const parserCfg = {
      provider: Bun.env['ARGUS_PARSER_PROVIDER'] ?? 'gemini',
      model: Bun.env['ARGUS_PARSER_MODEL'] ?? 'gemini-2.5-flash',
    };
    const graderCfg = {
      provider: Bun.env['ARGUS_GRADER_PROVIDER'] ?? 'gemini',
      model: Bun.env['ARGUS_GRADER_MODEL'] ?? 'gemini-2.5-flash',
    };
    const criticCfg = {
      provider: Bun.env['ARGUS_CRITIC_PROVIDER'] ?? 'gemini',
      model: Bun.env['ARGUS_CRITIC_MODEL'] ?? 'gemini-2.5-flash',
    };

    this.parser = new VisualParserAgent(createProvider(parserCfg.provider), parserCfg.model);
    this.grader = new GraderAgent(createProvider(graderCfg.provider), graderCfg.model);
    this.critic = new CriticAgent(createProvider(criticCfg.provider), criticCfg.model);
  }

  /**
   * Runs the complete multi-agent production line asynchronously.
   */
  public async execute(pdfBuffer: Buffer, rubricBuffer: Buffer, examFormBuffer: Buffer): Promise<string> {
    console.log('🚀 [Orchestrator] Launching grading pipeline...');

    // Phase 1: Heavy Multimodal Vision Extraction (Low cost / Flash)
    const extractedText = await this.parser.run({ pdfBuffer });
    console.log('📸 [Orchestrator] Extracted text:', extractedText);


    // Phase 2: Core Deep Reasoning Evaluation (High cost / Advanced Reasoning) - Now receives the rubric buffer
    const initialGrade = await this.grader.run({ extractedText, rubric: rubricBuffer, examForm: examFormBuffer });
    console.log('📸 [Orchestrator] Initial grade:', initialGrade);

    // Phase 3: Audit & Error Checking (Medium cost / Standard Frontier model) - Now receives the rubric buffer
    const finalReport = await this.critic.run({
      extractedText,
      rubric: rubricBuffer,
      initialGrade,
      examForm: examFormBuffer
    });

    console.log('🎉 [Orchestrator] Analysis complete.');
    return finalReport;
  }
}
