import cron from 'node-cron';
import { startScheduler } from '../scheduler.js';
import { fetchAndStorePrices } from '../pipeline.js';

// Mock the cron.schedule and fetchAndStorePrices function
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

jest.mock('../pipeline.js', () => ({
  fetchAndStorePrices: jest.fn(),
}));

describe('startScheduler', () => {
  it('should schedule fetchAndStorePrices to run every 30 seconds', () => {
    // Run the startScheduler function
    startScheduler();

    // Check if cron.schedule was called with the correct cron expression and function
    expect(cron.schedule).toHaveBeenCalledWith('*/30 * * * * *', fetchAndStorePrices);
  });

  it('should call fetchAndStorePrices when the scheduled task runs', () => {
    // Ensure the mock function is not called before
    fetchAndStorePrices.mockClear();

    // Trigger the cron job
    const scheduledFunction = cron.schedule.mock.calls[0][1]; // Get the scheduled function
    scheduledFunction(); // Execute the function manually

    // Check if the fetchAndStorePrices function was called
    expect(fetchAndStorePrices).toHaveBeenCalledTimes(1);
  });
});
