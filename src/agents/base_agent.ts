import type { Agent, AgentInput } from "./types.ts";

export abstract class BaseAgent implements Agent {
  public readonly name: string;
  protected readonly systemPrompt: string;
  protected readonly modelName: string;

  constructor(name: string, modelName: string, systemPrompt: string) {
    this.name = name;
    this.modelName = modelName;
    this.systemPrompt = systemPrompt;
  }

  // Every specific agent must implement their own execution logic
  public abstract run(input: AgentInput): Promise<string>;
}
