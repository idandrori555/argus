import { IrisPipeline } from './iris/iris.ts';

const iris = new IrisPipeline();
iris.start();

process.on('SIGINT', () => {
  iris.stop();
  process.exit(0);
});

