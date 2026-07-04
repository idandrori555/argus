import { GoogleGenAI } from "@google/genai";
import type { Agent, AgentInput } from "./types.ts";
import { GEMINI_API_KEY } from '../env.ts';

export abstract class BaseAgent implements Agent {
  public readonly name: string;
  protected readonly systemPrompt: string;
  protected readonly modelName: string;
  protected ai: GoogleGenAI;

  constructor(name: string, modelName: string, systemPrompt: string) {
    this.name = name;
    this.modelName = modelName;
    this.systemPrompt = systemPrompt;
    this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY }); // Loads GEMINI_API_KEY from environment variables
  }

  // Every specific agent must implement their own execution logic
  public abstract run(input: AgentInput): Promise<string>;
}
