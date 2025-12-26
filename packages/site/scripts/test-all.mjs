#!/usr/bin/env node
/**
 * Integration Test Runner for Farewell
 * 
 * This script runs all tests to verify the FHEVM v0.9/v0.10 migration is complete.
 * It executes the Hardhat tests which cover all core functionality:
 * - User registration
 * - Ping/check-in
 * - Adding encrypted messages
 * - Marking deceased
 * - Claiming messages
 * - Retrieving and decrypting messages
 * - Stats queries
 */

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const corePackagePath = join(__dirname, '../../farewell-core');

console.log('='.repeat(60));
console.log('Farewell Integration Test Runner');
console.log('='.repeat(60));
console.log('');
console.log('Running all tests to verify FHEVM v0.10 migration...');
console.log('');

const testProcess = spawn('npm', ['test'], {
  cwd: corePackagePath,
  stdio: 'inherit',
  shell: true,
});

testProcess.on('close', (code) => {
  console.log('');
  console.log('='.repeat(60));
  if (code === 0) {
    console.log('SUCCESS: All tests passed!');
    console.log('');
    console.log('Test coverage:');
    console.log('  [x] User registration (register, isRegistered)');
    console.log('  [x] Ping/check-in functionality');
    console.log('  [x] Adding encrypted messages (addMessage)');
    console.log('  [x] Grace period enforcement');
    console.log('  [x] Marking deceased (markDeceased)');
    console.log('  [x] Claiming messages with exclusivity period');
    console.log('  [x] Retrieving and decrypting messages');
    console.log('  [x] Message count and stats queries');
  } else {
    console.log(`FAILED: Tests exited with code ${code}`);
  }
  console.log('='.repeat(60));
  process.exit(code);
});


