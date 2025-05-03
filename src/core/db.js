import Hypercore from 'hypercore';
import Hyperbee from 'hyperbee';
import path from 'path';

const __dirname = new URL('.', import.meta.url).pathname;

const feed = new Hypercore(path.join(__dirname, '../../data'), { valueEncoding: 'json' });
const db = new Hyperbee(feed, { keyEncoding: 'utf-8', valueEncoding: 'json' });

async function initDB() {
  await feed.ready();
  await db.ready();
  console.log('[INFO] 🐝 Hyperbee DB ready');
}

initDB();

export { db };
