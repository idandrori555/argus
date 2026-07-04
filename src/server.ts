import { WorkflowOrchestrator } from './workflow_orchestrator.ts';
import * as fs from 'fs';
import * as path from 'path';

export class ArgusServer {
  private orchestrator: WorkflowOrchestrator;
  private currentReport: { score: string; markdown: string } | null = null;
  private activeClients: Set<ReadableStreamDefaultController> = new Set();

  // Define static directory paths
  private readonly staticFolder = path.join(process.cwd(), 'static');
  private readonly htmlPath = path.join(process.cwd(), 'public', 'index.html');

  constructor() {
    this.orchestrator = new WorkflowOrchestrator();

    // Ensure the static directory exists on boot
    if (!fs.existsSync(this.staticFolder)) {
      fs.mkdirSync(this.staticFolder, { recursive: true });
      console.log('📁 [Server] Created missing static resource directory.');
    }
  }

  public broadcastUpdate(score: string, markdown: string): void {
    this.currentReport = { score, markdown };
    const payload = JSON.stringify(this.currentReport);

    for (const controller of this.activeClients) {
      try {
        controller.enqueue(new TextEncoder().encode(`data: ${payload}\n\n`));
      } catch {
        this.activeClients.delete(controller);
      }
    }
  }

  /**
   * Executes the AI pipeline by reading the rubric and exam files from the static directory.
   */
  public async processExam(): Promise<void> {
    const examPath = path.join(this.staticFolder, 'exam_output.pdf');
    const rubricPath = path.join(this.staticFolder, 'rubric.txt');

    // 1. Structural Sanity Checks
    if (!fs.existsSync(examPath)) {
      console.error(`❌ [Server] Process triggered, but no exam found at: ${examPath}`);
      return;
    }

    if (!fs.existsSync(rubricPath)) {
      console.warn(`⚠️ [Server] Rubric missing at ${rubricPath}. Creating an empty placeholder template.`);
      fs.writeFileSync(rubricPath, 'Insert official grading criteria matrix here.');
    }

    try {
      console.log('📖 [Server] Ingesting evaluation parameters from static volume...');

      // 2. Read localized assets into memory
      const pdfBuffer = fs.readFileSync(examPath);
      const rubricText = fs.readFileSync(rubricPath, 'utf-8');

      // 3. Dispatch data down the agent matrix
      const finalReport = await this.orchestrator.execute(pdfBuffer, rubricText);

      const scoreMatch = finalReport.match(/(?:Score|Grade):\s*(\d+\/\d+|\d+)/i);
      const extractedScore = (scoreMatch ? scoreMatch[1] : 'Reviewed') ?? "N/A";

      this.broadcastUpdate(extractedScore, finalReport);
    } catch (error) {
      console.error('❌ [Server Pipeline Error]:', error);
      this.broadcastUpdate('Error', `## Analysis Execution Failed\n\`\`\`\n${String(error)}\n\`\`\``);
    }
  }

  public start(port: number = 3000): void {
    Bun.serve({
      port,
      development: false,

      fetch: async (request) => {
        const url = new URL(request.url);

        if (url.pathname === '/' || url.pathname === '/index.html') {
          if (!fs.existsSync(this.htmlPath)) {
            return new Response('Dashboard UI artifact missing.', { status: 404 });
          }
          return new Response(Bun.file(this.htmlPath), {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }

        if (url.pathname === '/api/events') {
          const self = this;
          const stream = new ReadableStream({
            start(controller) {
              self.activeClients.add(controller);
              if (self.currentReport) {
                const initialPayload = JSON.stringify(self.currentReport);
                controller.enqueue(new TextEncoder().encode(`data: ${initialPayload}\n\n`));
              }
            },
            cancel(controller) {
              self.activeClients.delete(controller);
            }
          });

          return new Response(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          });
        }

        return new Response('Asset Not Found', { status: 404 });
      }
    });

    console.log(`🚀 [Production Server] Interface active at: http://localhost:${port}`);
  }
}
