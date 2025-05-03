import { startClient } from './../../src/rpc/client';
import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';

// Mock the RPC and DHT classes
jest.mock('@hyperswarm/rpc');
jest.mock('hyperdht');

describe('startClient', () => {
  let mockRpcRequest;

  beforeEach(() => {
    // Mock the request method of the RPC class
    mockRpcRequest = jest.fn();
    RPC.mockImplementation(() => ({
      request: mockRpcRequest,
    }));

    // Mock the DHT class and the ready method
    DHT.mockImplementation(() => ({
      ready: jest.fn().mockResolvedValue(undefined),
    }));
  });

  it('should call rpc.request with correct arguments for latest prices', async () => {
    const mockServerPubKeyHex = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'; // Example hex key
    const mockPairs = ['BTC/USDT', 'ETH/USDT'];

    // Mock the response for latest prices
    mockRpcRequest.mockResolvedValue(Buffer.from(JSON.stringify({ BTC_USDT: 50000, ETH_USDT: 3000 })));

    // Call the startClient function
    const result = await startClient(mockServerPubKeyHex, mockPairs);

    // Verify rpc.request was called with the correct parameters
    expect(mockRpcRequest).toHaveBeenCalledWith(
      expect.any(Buffer),
      'getLatestPrices',
      expect.any(Buffer)
    );

    // Verify the result contains the expected processed data
    expect(result.latest).toEqual({ BTC_USDT: 50000, ETH_USDT: 3000 });
  });

  it('should call rpc.request with correct arguments for historical prices', async () => {
    const mockServerPubKeyHex = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const mockPairs = ['BTC/USDT', 'ETH/USDT'];

    // Mock the response for historical prices
    mockRpcRequest.mockResolvedValue(Buffer.from(JSON.stringify([{ time: 1625152000, price: 48000 }])));

    // Call the startClient function
    const result = await startClient(mockServerPubKeyHex, mockPairs);

    // Verify rpc.request was called with the correct parameters for historical prices
    expect(mockRpcRequest).toHaveBeenCalledWith(
      expect.any(Buffer),
      'getHistoricalPrices',
      expect.any(Buffer)
    );

    // Verify the result contains the expected processed data
    expect(result.historical).toEqual([{ time: 1625152000, price: 48000 }]);
  });

  it('should handle errors in rpc.request gracefully', async () => {
    const mockServerPubKeyHex = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const mockPairs = ['BTC/USDT', 'ETH/USDT'];

    // Mock rpc.request to simulate an error
    mockRpcRequest.mockRejectedValue(new Error('Request failed'));

    // Call the startClient function and check if it throws
    await expect(startClient(mockServerPubKeyHex, mockPairs)).rejects.toThrow('Request failed');
  });

  it('should call rpc.request with default pairs if no pairs are provided', async () => {
    const mockServerPubKeyHex = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

    // Mock the response for latest prices
    mockRpcRequest.mockResolvedValue(Buffer.from(JSON.stringify({ BTC_USDT: 50000, ETH_USDT: 3000 })));

    // Call the startClient function with no pairs
    const result = await startClient(mockServerPubKeyHex);

    // Verify the request was made with the default pairs
    expect(mockRpcRequest).toHaveBeenCalledWith(
      expect.any(Buffer),
      'getLatestPrices',
      expect.any(Buffer)
    );

    // Check that it still returns the correct result
    expect(result.latest).toEqual({ BTC_USDT: 50000, ETH_USDT: 3000 });
  });
});
