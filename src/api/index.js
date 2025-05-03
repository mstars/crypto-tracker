import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { startClient } from '../rpc/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

let SERVER_PUBLIC_KEY;

async function waitForPubkey(pubkeyPath, interval = 500) {
  while (true) {
    try {
      const content = await fs.readFile(pubkeyPath, 'utf-8');
      if (content.trim()) {
        return content.trim();
      }
    } catch {
      // File doesn't exist yet
    }
    console.log('🔁 Waiting for server-pubkey.txt...');
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

(async () => {
  const pubkeyPath = path.join(__dirname, '../../data/pub/server-pubkey.txt');
  SERVER_PUBLIC_KEY = await waitForPubkey(pubkeyPath);

  app.get('/prices', async (req, res) => {
    try {
      const pairList = req.query.pairs ? req.query.pairs.split(',') : ['BTC/USDT', 'ETH/USDT'];
      const data = await startClient(SERVER_PUBLIC_KEY, pairList);
      res.json({ status: 'success', data });
    } catch (err) {
      console.error('[ERROR] /prices failed:', err.message);
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  app.listen(PORT, () => {
    console.log(`🚀 REST API running at http://localhost:${PORT}`);
  });
})();
