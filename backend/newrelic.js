/**
 * New Relic Configuration
 *
 * Disabled by default. To enable:
 *   1. Sign up at https://newrelic.com (free tier: 100GB/mo)
 *   2. Set NEW_RELIC_ENABLED=true in .env
 *   3. Set NEW_RELIC_LICENSE_KEY in .env
 *
 * This file is auto-loaded by the newrelic package when present.
 */

'use strict';

exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'project-clarity-backend'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY || 'DISABLED',
  agent_enabled: process.env.NEW_RELIC_ENABLED === 'true',
  logging: {
    level: 'info',
  },
  distributed_tracing: {
    enabled: true,
  },
  transaction_tracer: {
    enabled: true,
    record_sql: 'obfuscated',
  },
  slow_sql: {
    enabled: true,
  },
  error_collector: {
    enabled: true,
  },
};
