export interface AgentInput {
  pdfBuffer?: Buffer;
  extractedText?: string;
  rubric?: string;
  initialGrade?: string;
}

export interface Agent {
  readonly name: string;
  run(input: AgentInput): Promise<string>;
}
