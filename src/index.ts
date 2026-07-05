import { IrisPipeline } from './iris/iris.ts';
import { WorkflowOrchestrator } from './workflow_orchestrator.ts';
import * as fs from 'fs';
import * as path from 'path';

const iris = new IrisPipeline();
const orchestrator = new WorkflowOrchestrator();

// Define permanent paths in the static directory
const staticFolder = path.join(process.cwd(), 'static');
const staticExamTarget = './exam_output.pdf';
const rubricPath = path.join(staticFolder, 'rubric.pdf');
const examFormPath = path.join(staticFolder, 'exam_form.pdf');

// Ensure the static directory exists on initialization
if (!fs.existsSync(staticFolder)) {
  fs.mkdirSync(staticFolder, { recursive: true });
}

function buildReportHtml(markdown: string): string {
  const safe = JSON.stringify(markdown);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Argus Exam Report — ${new Date().toLocaleString()}</title>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"><\/script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    max-width: 960px; margin: 0 auto; padding: 32px 24px;
    background: #fff; color: #1a1a1a; line-height: 1.7; font-size: 16px;
  }
  h1 { font-size: 2em; border-bottom: 2px solid #e1e4e8; padding-bottom: .3em; margin: 1.2em 0 .6em; }
  h2 { font-size: 1.5em; border-bottom: 1px solid #e1e4e8; padding-bottom: .25em; margin: 1em 0 .5em; }
  h3 { font-size: 1.25em; margin: 1em 0 .5em; }
  h4 { font-size: 1em; margin: .8em 0 .4em; }
  p { margin: .6em 0; }
  ul, ol { margin: .6em 0; padding-left: 2em; }
  li { margin: .2em 0; }
  pre {
    background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 6px;
    padding: 16px; overflow-x: auto; margin: .8em 0; font-size: 85%;
  }
  code { background: #f6f8fa; padding: 2px 6px; border-radius: 4px; font-size: 90%; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; }
  pre code { background: none; padding: 0; font-size: inherit; }
  table { border-collapse: collapse; width: 100%; margin: .8em 0; }
  th, td { border: 1px solid #dfe2e5; padding: 8px 13px; text-align: left; }
  th { background: #f6f8fa; font-weight: 600; }
  tr:nth-child(even) td { background: #fafbfc; }
  blockquote {
    border-left: 4px solid #d0d7de; padding: 0 1em; color: #656d76; margin: .8em 0;
  }
  hr { border: none; border-top: 1px solid #e1e4e8; margin: 1.5em 0; }
  a { color: #0969da; text-decoration: none; }
  a:hover { text-decoration: underline; }
  @media (prefers-color-scheme: dark) {
    body { background: #0d1117; color: #e6edf3; }
    h1, h2 { border-bottom-color: #30363d; }
    pre { background: #161b22; border-color: #30363d; }
    code { background: #161b22; }
    th { background: #161b22; }
    td { border-color: #30363d; }
    th { border-color: #30363d; }
    tr:nth-child(even) td { background: #0d1117; }
    blockquote { border-left-color: #30363d; color: #8b949e; }
    a { color: #58a6ff; }
  }
</style>
</head>
<body>
<div id="content"></div>
<script>
document.getElementById('content').innerHTML = marked.parse(${safe});
<\/script>
</body>
</html>`;
}

async function renderMarkdownReport(markdown: string): Promise<void> {
  const html = buildReportHtml(markdown);
  const reportPath = path.join(process.cwd(), 'report.html');
  fs.writeFileSync(reportPath, html);
  console.log(`📄 Report saved to ${reportPath}`);

  const plat = process.platform;
  if (plat === 'win32') {
    Bun.spawn(['cmd', '/c', 'start', '', reportPath]);
  } else if (plat === 'darwin') {
    Bun.spawn(['open', reportPath]);
  } else {
    Bun.spawn(['xdg-open', reportPath]);
  }
}

// Core function that runs the AI evaluation and prints to the console
async function runConsoleEvaluation() {
  console.log('\n==================================================');
  console.log('   [Argus] Reading assets from static directory...');
  console.log('==================================================');

  if (!fs.existsSync(staticExamTarget)) {
    console.error(`❌ [Error] Exam PDF not found at: ${staticExamTarget}`);
    return;
  }

  if (!fs.existsSync(rubricPath)) {
    console.error(`❌ [Error] Rubric PDF not found at: ${rubricPath}`);
    return;
  }

  if (!fs.existsSync(examFormPath)) {
    console.error(`❌ [Error] Exam Form PDF not found at: ${examFormPath}`);
    return;
  }

  try {
    // Read files and explicitly cast/wrap them into standard Node.js Buffers to avoid Bun NonSharedBuffer type conflicts
    const examBuffer = Buffer.from(fs.readFileSync(staticExamTarget));
    const rubricBuffer = Buffer.from(fs.readFileSync(rubricPath));
    const examFormBuffer = Buffer.from(fs.readFileSync(examFormPath));

    console.log('🤖 [AI] Dispatching matrices to LLM Provider');
    console.log('⏳ Processing multi-agent review layer...');

    // Run your existing workflow passing both buffers
    const finalReport = await orchestrator.execute(examBuffer, rubricBuffer, examFormBuffer);

    // Fast score extraction for prominent console display
    const scoreMatch = finalReport.match(/(?:Score|Grade):\s*(\d+\/\d+|\d+)/i);
    const extractedScore = scoreMatch ? scoreMatch[1] : 'Reviewed';

    // Print organized results cleanly to the console
    console.log('\n==================================================');
    console.log(`🎯 FINAL EVALUATION SCORE: ${extractedScore}`);
    console.log('==================================================\n');
    console.log(finalReport);
    console.log('\n==================================================');
    console.log('👁️  Argus: Ready for next exam. Press F10 to capture.');
    console.log('==================================================\n');

    await renderMarkdownReport(finalReport);

  } catch (error) {
    console.error('\n❌ [Pipeline Error]: Failed to evaluate exam.');
    console.error(error);
  }
}

// Bridge the keyboard-triggered PDF export completion directly to the evaluation execution
iris.onExportComplete = async (freshPdfPath: string) => {
  console.log('\n📸 [Iris] PDF compilation complete.');

  try {
    // Copy the fresh PDF export to the permanent static location
    fs.copyFileSync(freshPdfPath, staticExamTarget);

    // Run evaluation and print straight to console
    await runConsoleEvaluation();
  } catch (error) {
    console.error('❌ [System Error] Failed to sync file assets:', error);
  }
};

// Start listening for keyboard hooks (F10 / F11)
iris.start();

// Standard clean exit handling
process.on('SIGINT', () => {
  iris.stop();
  process.exit(0);
});
