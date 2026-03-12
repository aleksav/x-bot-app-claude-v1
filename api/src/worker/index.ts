import * as jobWorker from './jobWorker.js';
import * as staleLockRecovery from './staleLockRecovery.js';

function shutdown(): void {
  console.log('[worker] Shutting down gracefully...');
  jobWorker.stop();
  staleLockRecovery.stop();
  // Post publisher placeholder — will be added later
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('[worker] Starting worker processes...');

jobWorker.start();
staleLockRecovery.start();
// Post publisher placeholder — will start here when implemented

console.log('[worker] All worker processes started');
