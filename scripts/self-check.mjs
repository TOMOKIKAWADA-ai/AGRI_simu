import { runAgriSurviveSelfCheck } from '../src/gameLogic.js';

const result = runAgriSurviveSelfCheck();

if (!result.ok) {
  console.error(`self-check failed: ${result.failures.join(' / ')}`);
  process.exit(1);
}

console.log('self-check OK');
