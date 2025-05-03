import { jest } from '@jest/globals';
import fs from 'fs/promises';
import { waitForPubkey } from '../src/utils/waitForPubkey.js';

jest.mock('fs/promises');

describe('waitForPubkey', () => {
  it('should resolve when file content is found', async () => {
    fs.readFile.mockResolvedValueOnce('mockkey');
    const pubkey = await waitForPubkey('mockpath');
    expect(pubkey).toBe('mockkey');
  });

  it('should retry if file not found', async () => {
    fs.readFile
      .mockRejectedValueOnce(new Error('File not found'))
      .mockResolvedValueOnce('key123');

    const pubkey = await waitForPubkey('mockpath', 10);
    expect(pubkey).toBe('key123');
  });
});
