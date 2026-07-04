import { VisualParserAgent } from './agents/visual_parser_agent.ts';
import { GraderAgent } from './agents/grader_agent.ts'
import { CriticAgent } from './agents/critic_agent.ts';

export class WorkflowOrchestrator {
  private parser: VisualParserAgent;
  private grader: GraderAgent;
  private critic: CriticAgent;

  constructor() {
    // Easily parameterized or injected via a factory pattern later if needed
    this.parser = new VisualParserAgent();
    this.grader = new GraderAgent();
    this.critic = new CriticAgent();
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

    return "";
    // // Phase 3: Audit & Error Checking (Medium cost / Standard Frontier model) - Now receives the rubric buffer
    // const finalReport = await this.critic.run({
    //   extractedText,
    //   rubric: rubricBuffer,
    //   initialGrade,
    //   examForm: examFormBuffer
    // });
    //
    // console.log('🎉 [Orchestrator] Analysis complete.');
    // return finalReport;
  }
}
