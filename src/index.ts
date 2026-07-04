import { IrisPipeline } from './iris/iris.ts';
import { WorkflowOrchestrator } from './workflow_orchestrator.ts';
import * as fs from 'fs';
import * as path from 'path';

const iris = new IrisPipeline();
const orchestrator = new WorkflowOrchestrator();

// Define permanent paths in the static directory
const staticFolder = path.join(process.cwd(), 'static');
const staticExamTarget = path.join(staticFolder, 'exam_output.pdf');
const rubricPath = path.join(staticFolder, 'rubric.pdf');

// Ensure the static directory exists on initialization
if (!fs.existsSync(staticFolder)) {
  fs.mkdirSync(staticFolder, { recursive: true });
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

  try {
    // Read files and explicitly cast/wrap them into standard Node.js Buffers to avoid Bun NonSharedBuffer type conflicts
    const examBuffer = Buffer.from(fs.readFileSync(staticExamTarget));
    const rubricBuffer = Buffer.from(fs.readFileSync(rubricPath));

    console.log('🤖 [AI] Dispatching matrices to LLM Provider via Vercel AI SDK...');
    console.log('⏳ Processing multi-agent review layer (Flash -> Pro -> Critic)...');

    // Run your existing workflow passing both buffers
    const finalReport = await orchestrator.execute(examBuffer, rubricBuffer);

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
