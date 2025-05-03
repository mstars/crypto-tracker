import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import { db } from '../core/db.js';
import { log, error } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function writePubkeyToFile(pubkey) {
  const dirPath = path.join(__dirname, '../../data/pub');
  const pubkeyPath = path.join(dirPath, 'server-pubkey.txt');

  try {
    // Ensure the directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(pubkeyPath, pubkey, 'utf-8');
    log(`[INFO] Public key written to: ${pubkeyPath}`);
  } catch (err) {
    error('[ERROR] Failed to write public key to file:', err.message);
  }
}

export async function startRPCServer() {
  try {
    const dht = new DHT();
    await dht.ready();

    const rpc = new RPC({ dht });
    const server = rpc.createServer();

    // Handler: getLatestPrices
    server.respond('getLatestPrices', async (req) => {
      try {
        const { pairs } = JSON.parse(req.toString());
        const result = [];

        for (const pair of pairs) {
          const stream = db.createReadStream({
            reverse: true,
            gte: `${pair}-`,
            lte: `${pair}-~`,
            limit: 1,
          });

          for await (const { value } of stream) {
            result.push(value);
          }
        }

        return Buffer.from(JSON.stringify(result));
      } catch (err) {
        error('Error in getLatestPrices:', err);
        throw err;
      }
    });

    // Handler: getHistoricalPrices
    server.respond('getHistoricalPrices', async (req) => {
      try {
        const { pairs, from, to } = JSON.parse(req.toString());
        const result = [];

        for (const pair of pairs) {
          const stream = db.createReadStream({
            gte: `${pair}-${from}`,
            lte: `${pair}-${to}`,
          });

          for await (const { value } of stream) {
            result.push(value);
          }
        }

        return Buffer.from(JSON.stringify(result));
      } catch (err) {
        error('Error in getHistoricalPrices:', err);
        throw err;
      }
    });

    await server.listen();

    const pubkey = server.publicKey.toString('hex');
    log('🛰️  RPC server ready. Public key:', pubkey);

    await writePubkeyToFile(pubkey);
  } catch (err) {
    error('Failed to start RPC server:', err);
  }
}
