export interface AgentInput {
  pdfBuffer?: Buffer;
  extractedText?: string;
  rubric?: Buffer;
  examForm?: Buffer;
  initialGrade?: string;
}

export interface Agent {
  readonly name: string;
  run(input: AgentInput): Promise<string>;
}
