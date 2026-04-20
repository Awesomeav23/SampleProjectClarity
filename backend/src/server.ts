import app from './app.js';
import { config } from './config.js';
import { checkConnection } from './lib/db.js';
import { logger } from './lib/logger.js';

async function start() {
  // Check database connection
  try {
    await checkConnection();
    logger.info('Database connected');
  } catch (err) {
    logger.warn('Database not available — running without DB (mock mode may still work)');
  }

  // Start BullMQ workers if Redis is available
  if (config.redis.host) {
    try {
      const { createWorkers, setupRecurringJobs } = await import('./services/workflowQueue.js');
      createWorkers();
      await setupRecurringJobs();
      logger.info('BullMQ workers started');
    } catch (err) {
      logger.warn('Redis not available — BullMQ workers not started');
    }
  }

  app.listen(config.port, () => {
    logger.info(`Project Clarity API running on http://localhost:${config.port}`);
  });
}

start();
