import * as jobWorker from './jobWorker.js';
import * as staleLockRecovery from './staleLockRecovery.js';
import * as postPublisher from './postPublisher.js';

function shutdown(): void {
  console.log('[worker] Shutting down gracefully...');
  jobWorker.stop();
  staleLockRecovery.stop();
  postPublisher.stop();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('[worker] Starting worker processes...');

jobWorker.start();
staleLockRecovery.start();
postPublisher.start();

console.log('[worker] All worker processes started');
