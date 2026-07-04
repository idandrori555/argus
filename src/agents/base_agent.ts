import type { Agent, AgentInput } from "./types.ts";
import type { LLMProvider } from '../providers/types.ts';

export abstract class BaseAgent implements Agent {
  public readonly name: string;
  protected readonly systemPrompt: string;
  protected readonly modelName: string;
  protected readonly provider: LLMProvider;

  constructor(name: string, provider: LLMProvider, modelName: string, systemPrompt: string) {
    this.name = name;
    this.provider = provider;
    this.modelName = modelName;
    this.systemPrompt = systemPrompt;
  }

  // Every specific agent must implement their own execution logic
  public abstract run(input: AgentInput): Promise<string>;
}
