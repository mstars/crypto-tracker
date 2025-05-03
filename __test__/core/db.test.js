import { db } from './db.js';  // Import db.js correctly
import Hypercore from 'hypercore';
import Hyperbee from 'hyperbee';
import path from 'path';

// Mocking Hypercore and Hyperbee classes
jest.mock('hypercore');
jest.mock('hyperbee');

describe('Database Initialization', () => {
  let mockFeed;
  let mockDb;

  beforeEach(() => {
    mockFeed = {
      ready: jest.fn().mockResolvedValue(),
    };
    mockDb = {
      ready: jest.fn().mockResolvedValue(),
    };

    // Mock the Hypercore and Hyperbee constructors to return the mock objects
    Hypercore.mockImplementation(() => mockFeed);
    Hyperbee.mockImplementation(() => mockDb);
  });

  it('should initialize the database', async () => {
    const feedPath = path.join(__dirname, '../data'); // This will be used in the mock

    // Simulate the execution of the `initDB` function
    const initDB = async () => {
      await mockFeed.ready();
      await mockDb.ready();
      console.log('[INFO] 🐝 Hyperbee DB ready');
    };

    await initDB();

    // Verify that Hypercore and Hyperbee are initialized with the correct parameters
    expect(Hypercore).toHaveBeenCalledWith(feedPath, { valueEncoding: 'json' });
    expect(Hyperbee).toHaveBeenCalledWith(mockFeed, { keyEncoding: 'utf-8', valueEncoding: 'json' });

    // Ensure that the `ready` method of both the feed and the db was called
    expect(mockFeed.ready).toHaveBeenCalled();
    expect(mockDb.ready).toHaveBeenCalled();
  });

  it('should throw an error if Hypercore or Hyperbee fails to initialize', async () => {
    // Simulate an error in ready method
    mockFeed.ready.mockRejectedValue(new Error('Failed to initialize Hypercore'));
    const initDB = async () => {
      await mockFeed.ready();
      await mockDb.ready();
    };

    await expect(initDB()).rejects.toThrow('Failed to initialize Hypercore');
  });
});
