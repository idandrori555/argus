export interface TextContent {
  type: 'text';
  text: string;
}

export interface PdfContent {
  type: 'pdf';
  data: Buffer;
  displayName?: string;
}

export type Content = TextContent | PdfContent;

export interface GenerateParams {
  systemPrompt: string;
  model: string;
  contents: Content[];
}

export interface LLMProvider {
  readonly name: string;
  generate(params: GenerateParams): Promise<string>;
}
