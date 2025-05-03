import cron from 'node-cron';
import { fetchAndStorePrices } from './pipeline.js';

export function startScheduler() {
  console.log('[INFO] Scheduler started: running every 30 seconds...');
  cron.schedule('*/30 * * * * *', fetchAndStorePrices); // Every 30 seconds
}
