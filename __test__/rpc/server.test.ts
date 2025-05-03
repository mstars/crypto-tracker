import { startRPCServer } from './../../src/rpc/server.js';
import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import { db } from '../../src/core/db.js';
import { log, error } from '../../src/utils/logger.js';
import fs from 'fs';

// Mocking dependencies
jest.mock('@hyperswarm/rpc');
jest.mock('hyperdht'); // Mocking HyperDHT class
jest.mock('../../src/core/db.js'); // Corrected the import path here
jest.mock('fs');
jest.mock('../../src/utils/logger.js'); // Corrected the import path here

describe('startRPCServer', () => {
  let mockCreateReadStream;
  let mockWriteFileSync;

  beforeEach(() => {
    // Mock the createReadStream method
    mockCreateReadStream = jest.fn().mockReturnValue({
      [Symbol.asyncIterator]: jest.fn().mockReturnValue({
        next: jest.fn().mockResolvedValue({ value: { price: 50000 } }),
      }),
    });
    db.createReadStream = mockCreateReadStream;

    // Mock fs.writeFileSync
    mockWriteFileSync = jest.fn();
    fs.writeFileSync = mockWriteFileSync;

    // Mock logging functions
    log.mockClear();
    error.mockClear();
  });

  it('should initialize RPC server and handle getLatestPrices request', async () => {
    const mockServer = {
      createServer: jest.fn().mockReturnValue({
        respond: jest.fn(),
        listen: jest.fn(),
        publicKey: Buffer.from('abcdef1234567890', 'hex'),
      }),
    };

    // Mock RPC and DHT
    RPC.mockImplementation(mockServer);
    DHT.mockImplementation(() => ({
      ready: jest.fn().mockResolvedValue(undefined),
    }));

    const pubkey = 'abcdef1234567890';

    // Call startRPCServer
    await startRPCServer();

    // Check if RPC server was created
    expect(mockServer.createServer).toHaveBeenCalled();

    // Verify that getLatestPrices responds correctly
    const getLatestPricesHandler = mockServer.createServer().respond.mock.calls[0][1];
    const request = Buffer.from(JSON.stringify({ pairs: ['BTC/USDT'] }));
    const response = await getLatestPricesHandler(request);
    expect(response.toString()).toEqual(JSON.stringify([{ price: 50000 }]));

    // Verify that the public key was written to the file
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('/data/pub/server-pubkey.txt'),
      pubkey,
      'utf-8'
    );

    // Verify that the correct log was printed
    expect(log).toHaveBeenCalledWith('🛰️  RPC server ready. Public key:', pubkey);
  });

  it('should handle getHistoricalPrices request correctly', async () => {
    const mockServer = {
      createServer: jest.fn().mockReturnValue({
        respond: jest.fn(),
        listen: jest.fn(),
        publicKey: Buffer.from('abcdef1234567890', 'hex'),
      }),
    };

    // Mock RPC and DHT
    RPC.mockImplementation(mockServer);
    DHT.mockImplementation(() => ({
      ready: jest.fn().mockResolvedValue(),
    }));

    // Call startRPCServer
    await startRPCServer();

    // Verify if getHistoricalPrices handler is called
    const getHistoricalPricesHandler = mockServer.createServer().respond.mock.calls[1][1];
    const request = Buffer.from(JSON.stringify({ pairs: ['BTC/USDT'], from: 1617210000000, to: 1617300000000 }));
    const response = await getHistoricalPricesHandler(request);
    expect(response.toString()).toEqual(JSON.stringify([{ price: 50000 }]));
  });

  it('should log error if getLatestPrices handler fails', async () => {
    const mockServer = {
      createServer: jest.fn().mockReturnValue({
        respond: jest.fn(),
        listen: jest.fn(),
        publicKey: Buffer.from('abcdef1234567890', 'hex'),
      }),
    };

    // Mock RPC and DHT
    RPC.mockImplementation(mockServer);
    DHT.mockImplementation(() => ({
      ready: jest.fn().mockResolvedValue(),
    }));

    // Simulate failure in db.createReadStream
    mockCreateReadStream.mockImplementationOnce(() => {
      throw new Error('DB read failed');
    });

    // Call startRPCServer and trigger the error
    await startRPCServer();

    // Verify that the error log was called
    expect(error).toHaveBeenCalledWith('Error in getLatestPrices:', expect.any(Error));
  });

  it('should handle failure in starting the RPC server', async () => {
    // Mock DHT to fail
    DHT.mockImplementationOnce(() => ({
      ready: jest.fn().mockRejectedValue(new Error('Failed to initialize DHT')),
    }));

    // Call startRPCServer and check error handling
    await startRPCServer();

    // Verify that the error is logged
    expect(error).toHaveBeenCalledWith('Failed to start RPC server:', expect.any(Error));
  });
});
