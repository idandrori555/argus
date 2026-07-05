import { VisualParserAgent } from './agents/visual_parser_agent.ts';
import { GraderAgent } from './agents/grader_agent.ts'
import { CriticAgent } from './agents/critic_agent.ts';
import { createProvider } from './providers/index.ts';
import type { Agent, AgentInput } from './agents/types.ts';

interface PipelineStep {
  name: string;
  agent: Agent;
  outputKey?: keyof AgentInput;
}

interface AgentDef {
  create: (provider: string, model: string) => Agent;
  outputKey?: keyof AgentInput;
}

const AGENT_REGISTRY: Record<string, AgentDef> = {
  parser: {
    create: (p, m) => new VisualParserAgent(createProvider(p), m),
    outputKey: 'extractedText',
  },
  grader: {
    create: (p, m) => new GraderAgent(createProvider(p), m),
    outputKey: 'initialGrade',
  },
  critic: {
    create: (p, m) => new CriticAgent(createProvider(p), m),
  },
};

function getAgentConfig(agentName: string): { provider: string; model: string } {
  const prefix = `ARGUS_${agentName.toUpperCase()}_`;
  const defaults: Record<string, { provider: string; model: string }> = {
    parser: { provider: 'gemini', model: 'gemini-3-flash-preview' },
    grader: { provider: 'gemini', model: 'gemini-3.1-pro-preview' },
    critic: { provider: 'gemini', model: 'gemini-3-flash-preview' },
  };
  const d = defaults[agentName] ?? { provider: 'gemini', model: 'gemini-3-flash-preview' };
  return {
    provider: Bun.env[`${prefix}PROVIDER`] ?? d.provider,
    model: Bun.env[`${prefix}MODEL`] ?? d.model,
  };
}

export class WorkflowOrchestrator {
  private pipeline: PipelineStep[] = [];

  constructor() {
    const raw = Bun.env['ARGUS_PIPELINE'] ?? 'grader';
    const names = raw.split(',').map(s => s.trim()).filter(Boolean);

    for (const name of names) {
      const def = AGENT_REGISTRY[name];
      if (!def) {
        console.warn(`⚠️ [Orchestrator] Unknown agent "${name}" — skipping.`);
        continue;
      }
      const cfg = getAgentConfig(name);
      const agent = def.create(cfg.provider, cfg.model);
      this.pipeline.push({ name, agent, outputKey: def.outputKey });
    }

    if (this.pipeline.length === 0) {
      throw new Error('No valid agents configured in pipeline.');
    }
  }

  public async execute(pdfBuffer: Buffer, rubricBuffer: Buffer, examFormBuffer: Buffer): Promise<string> {
    console.log('🚀 [Orchestrator] Launching grading pipeline...');
    console.log(`📋 Pipeline: ${this.pipeline.map(s => s.name).join(' → ')}`);

    const ctx: AgentInput = {
      pdfBuffer,
      rubric: rubricBuffer,
      examForm: examFormBuffer,
    };

    let lastOutput = '';

    for (const step of this.pipeline) {
      console.log(`⚙️ [Orchestrator] Running agent: ${step.name}`);
      lastOutput = await step.agent.run(ctx);
      if (step.outputKey) {
        (ctx as any)[step.outputKey] = lastOutput;
      }
      console.log(`✅ [Orchestrator] ${step.name} complete.`);
    }

    return lastOutput;
  }
}
