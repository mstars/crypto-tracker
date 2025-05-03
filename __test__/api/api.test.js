import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { startClient } from '../src/rpc/client.js';

jest.mock('fs/promises');
jest.mock('../src/rpc/client.js');

const app = express();
app.use(express.json());

const SERVER_PUBLIC_KEY = 'mocked_public_key';

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

describe('GET /prices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return prices for default pairs', async () => {
    startClient.mockResolvedValue([
      { pair: 'BTC/USDT', price: 50000 },
      { pair: 'ETH/USDT', price: 3500 },
    ]);

    const res = await request(app).get('/prices');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(startClient).toHaveBeenCalledWith(SERVER_PUBLIC_KEY, ['BTC/USDT', 'ETH/USDT']);
  });

  it('should return prices for custom pairs', async () => {
    startClient.mockResolvedValue([{ pair: 'DOGE/USDT', price: 0.2 }]);

    const res = await request(app).get('/prices?pairs=DOGE/USDT');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(startClient).toHaveBeenCalledWith(SERVER_PUBLIC_KEY, ['DOGE/USDT']);
  });

  it('should return 500 on startClient failure', async () => {
    startClient.mockRejectedValue(new Error('RPC failure'));

    const res = await request(app).get('/prices');
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('RPC failure');
  });
});
