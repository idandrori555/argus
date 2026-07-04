import { IrisPipeline } from './iris/iris.ts';
import { ArgusServer } from './server';

const iris = new IrisPipeline();
const server = new ArgusServer();

const officialRubric = `
  Question 1 (Binary Trees): 20 points. Deduct 5 points if traversal is out of order.
  Question 2 (Automata): 30 points. Deduct 10 points for missing trap states.
`;

// Start the UI server engine
server.start(3000);

// Bridge the Iris capture finish callback right into the production server handler
iris.onExportComplete = async (pdfPath: string) => {
  console.log('\n==================================================');
  console.log('📸 [Iris] Captured exam ready. Relaying to Server...');
  console.log('==================================================\n');

  // Triggers the agent suite background process & autoupdates the connected UI dashboard
  await server.processExam(pdfPath, officialRubric);
};

// Start the hardware keyboard event hooks
iris.start();

// Standard OS runtime process signal cleanup listener
process.on('SIGINT', () => {
  iris.stop();
  process.exit(0);
});
