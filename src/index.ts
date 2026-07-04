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

function playSoundF10() {
  // A short, higher-pitched beep for screenshots (Frequency: 2000Hz, Duration: 100ms)
  Bun.spawn(["powershell", "-c", "[console]::Beep(2000, 100)"]);
}

async function playSoundF11() {
  // A two-tone success chime for PDF generation
  Bun.spawn(["powershell", "-c", "[console]::Beep(1500, 150)"]);

  // A tiny delay to let the first beep finish before the second starts
  await new Promise((resolve) => setTimeout(resolve, 150));

  Bun.spawn(["powershell", "-c", "[console]::Beep(2500, 250)"]);
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

  } catch (error) {
    console.error('\n❌ [Pipeline Error]: Failed to evaluate exam.');
    console.error(error);
  }
}

// Bridge the keyboard-triggered PDF export completion directly to the evaluation execution
iris.onExportComplete = async (freshPdfPath: string) => {
  console.log('\n📸 [Iris] PDF compilation complete.');

  // Play a sound to indicate the PDF has been generated
  playSoundF11();

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
