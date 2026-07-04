export interface AgentInput {
  pdfBuffer?: Buffer;
  extractedText?: string;
  rubric?: Buffer;
  initialGrade?: string;
}

export interface Agent {
  readonly name: string;
  run(input: AgentInput): Promise<string>;
}
