import { IrisPipeline } from './iris/iris.ts';
import { WorkflowOrchestrator } from './workflow_orchestrator.ts';
import * as fs from 'fs';

// Initialize both standalone products
const iris = new IrisPipeline();
const brain = new WorkflowOrchestrator();

// Define the rubric/criteria (In production, you'll read this from a static file)
const dummyRubric = `
  Question 1 (Binary Trees): 20 points. Deduct 5 points if traversal is out of order.
  Question 2 (Automata): 30 points. Deduct 10 points for missing trap states.
`;

// Register the bridge between Iris and Brain
iris.onExportComplete = async (pdfPath: string) => {
  console.log('\n==================================================');
  console.log('🧠 [Main] Handing over control to Argus Brain...');
  console.log('==================================================\n');

  try {
    // Read the newly minted PDF into memory
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Execute the asynchronous agentic line
    const finalEvaluationReport = await brain.execute(pdfBuffer, dummyRubric);

    console.log('\n============================= REPORT START =============================');
    console.log(finalEvaluationReport);
    console.log('============================== REPORT END ==============================\n');

  } catch (error) {
    console.error('❌ [Main] Error running the AI agent pipeline:', error);
  }
};

// Start the capture lifecycle
iris.start();

// Graceful exit cleanup
process.on('SIGINT', () => {
  iris.stop();
  process.exit(0);
});
