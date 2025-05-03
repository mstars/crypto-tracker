import { getCoins } from './../utils/http.js';
import { db } from './db.js';
import { log } from './../utils/logger.js';

const RATE_LIMIT_DELAY = 1000; // Delay in milliseconds (e.g., 1 second)

export async function fetchAndStorePrices() {
  try {
    log('[INFO] Fetching top 5 cryptocurrencies...');
    const coins = await getCoins(
      '/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1'
    );

    for (const coin of coins) {
      const timestamp = Date.now();

      // 🧷 Special case: Tether (USDT) is always 1
      if (coin.symbol.toLowerCase() === 'usdt') {
        const tetherRecord = {
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          timestamp,
          average_usdt_price: 1,
          top_exchanges: ['FixedValue'], // Placeholder for Tether
        };

        const key = `${coin.symbol.toUpperCase()}/USDT-${timestamp}`;
        await db.put(key, tetherRecord);
        log(`[SAVED] ${coin.symbol.toUpperCase()} fixed at $1.00 (${key})`);
        continue;
      }

      try {
        // 📡 Fetch tickers for other coins
        const tickersData = await getCoins(`/coins/${coin.id}/tickers?include_exchange_logo=true`);
        const usdtTickers = tickersData.tickers.filter(
          (t) => t.target.toLowerCase() === 'usdt' && typeof t.last === 'number'
        );

        const top3 = usdtTickers
          .sort((a, b) => (b.converted_volume?.usdt || 0) - (a.converted_volume?.usdt || 0))
          .slice(0, 3);

        if (top3.length === 0) continue;

        const avg = top3.reduce((sum, t) => sum + t.last, 0) / top3.length;

        const record = {
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          timestamp,
          average_usdt_price: avg,
          top_exchanges: top3.map((t) => t.market.name), // Only keep exchange names
        };

        const key = `${coin.symbol.toUpperCase()}/USDT-${record.timestamp}`;
        await db.put(key, record);
        log(
          `[SAVED] ${record.symbol.toUpperCase()} at $${avg.toFixed(2)} (${key}) ${record.top_exchanges.join(', ')}`
        );
      } catch (err) {
        if (err.message.includes('429')) {
          // Handle rate limit and retry after delay
          log('[WARN] Rate limit exceeded, waiting...');
          await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
          // Retry after delay
          continue;
        } else {
          console.error('[ERROR] Pipeline failed for coin:', coin.symbol, err.message);
        }
      }
    }
  } catch (err) {
    console.error('[ERROR] Pipeline failed:', err.message);
  }
}
