import { fetchAndStorePrices } from './fetchAndStorePrices.js';
import { getCoins } from './../utils/http.js';
import { db } from './db.js';
import { log } from './../utils/logger.js';

jest.mock('./../utils/http.js');
jest.mock('./db.js');
jest.mock('./../utils/logger.js');

describe('fetchAndStorePrices', () => {
  const mockPut = db.put;
  const mockGetCoins = getCoins;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and store the top 5 cryptocurrencies successfully', async () => {
    const mockCoins = [
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
      { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
      { id: 'usdt', name: 'Tether', symbol: 'USDT' },
    ];
    
    const mockTickersData = {
      tickers: [
        { target: 'USDT', last: 48000, market: { name: 'Binance' }, converted_volume: { usdt: 1000000 } },
        { target: 'USDT', last: 47000, market: { name: 'Coinbase' }, converted_volume: { usdt: 800000 } },
      ],
    };

    // Mock the responses from getCoins
    mockGetCoins
      .mockResolvedValueOnce(mockCoins) // For the first call to getCoins
      .mockResolvedValueOnce(mockTickersData) // For the second call to getCoins
      .mockResolvedValueOnce(mockTickersData); // For Tether's tickers (if needed)

    mockPut.mockResolvedValueOnce(); // Mock the database `put` method

    await fetchAndStorePrices();

    // Check if db.put was called for Tether
    expect(mockPut).toHaveBeenCalledWith(
      expect.stringContaining('USDT'),
      expect.objectContaining({
        average_usdt_price: 1,
        top_exchanges: ['FixedValue'],
      })
    );

    // Check if db.put was called for other cryptocurrencies (e.g., BTC, ETH)
    expect(mockPut).toHaveBeenCalledWith(
      expect.stringContaining('BTC'),
      expect.objectContaining({
        average_usdt_price: expect.any(Number),
        top_exchanges: expect.arrayContaining(['Binance', 'Coinbase']),
      })
    );
  });

  it('should handle rate limit error and retry', async () => {
    const mockCoins = [
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
    ];
    
    // Simulate a rate limit error (status 429)
    mockGetCoins.mockResolvedValueOnce(mockCoins);
    mockGetCoins.mockRejectedValueOnce(new Error('429 Too Many Requests')); // Simulate rate limit error
    mockGetCoins.mockResolvedValueOnce({ tickers: [] }); // Success on second attempt

    mockPut.mockResolvedValueOnce();

    await fetchAndStorePrices();

    // Ensure db.put was called after retry
    expect(mockPut).toHaveBeenCalled();
  });

  it('should handle other errors gracefully', async () => {
    const mockCoins = [
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
    ];

    // Simulate a non-rate-limit error (e.g., network failure)
    mockGetCoins.mockResolvedValueOnce(mockCoins);
    mockGetCoins.mockRejectedValueOnce(new Error('Network Error'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await fetchAndStorePrices();

    expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Pipeline failed for coin:', 'BTC', 'Network Error');
  });

  it('should log a warning when rate limit is exceeded', async () => {
    const mockCoins = [
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
    ];

    mockGetCoins.mockResolvedValueOnce(mockCoins);
    mockGetCoins.mockRejectedValueOnce(new Error('429 Too Many Requests'));

    const logSpy = jest.spyOn(log, 'log');

    await fetchAndStorePrices();

    expect(logSpy).toHaveBeenCalledWith('[WARN] Rate limit exceeded, waiting...');
  });
});
