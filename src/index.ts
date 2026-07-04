import { IrisPipeline } from './iris/iris.ts';
import { ArgusServer } from './server';

const iris = new IrisPipeline();
const server = new ArgusServer();

// Start the UI server engine
server.start(3000);

// Bridge the Iris capture finish callback right into the production server handler
iris.onExportComplete = async () => {
  console.log('\n==================================================');
  console.log('📸 [Iris] Captured exam ready. Relaying to Server...');
  console.log('==================================================\n');

  // Triggers the agent suite background process & autoupdates the connected UI dashboard
  await server.processExam();
};

// Start the hardware keyboard event hooks
iris.start();

// Standard OS runtime process signal cleanup listener
process.on('SIGINT', () => {
  iris.stop();
  process.exit(0);
});
