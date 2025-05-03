import { startScheduler } from './core/scheduler.js';
import { startRPCServer } from './rpc/server.js';
import { startClient } from './rpc/client.js';
import fs from 'fs';
import path from 'path';

const __dirname = new URL('.', import.meta.url).pathname;

(async () => {
  await startScheduler();
  await startRPCServer();

  const pubkeyPath = path.join(__dirname, '../data/pub', 'server-pubkey.txt');
  let pubkey;
  while (!pubkey) {
    if (fs.existsSync(pubkeyPath)) {
      pubkey = fs.readFileSync(pubkeyPath, 'utf-8').trim();
    } else {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  await startClient(pubkey);
})();
