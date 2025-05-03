import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';

export async function startClient(serverPubKeyHex, pairs = ['BTC/USDT', 'ETH/USDT']) {
  const dht = new DHT();
  await dht.ready();

  const rpc = new RPC({ dht });
  const serverKey = Buffer.from(serverPubKeyHex, 'hex');

  const latestRaw = await rpc.request(
    serverKey,
    'getLatestPrices',
    Buffer.from(JSON.stringify({ pairs }))
  );
  const latest = JSON.parse(latestRaw.toString('utf-8'));

  const from = Date.now() - 3600000;
  const to = Date.now();

  const historicalRaw = await rpc.request(
    serverKey,
    'getHistoricalPrices',
    Buffer.from(JSON.stringify({ pairs, from, to }))
  );
  const historical = JSON.parse(historicalRaw.toString('utf-8'));

  return { latest, historical };
}
