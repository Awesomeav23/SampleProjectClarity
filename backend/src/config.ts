/**
 * Application configuration — reads from environment variables.
 * All service credentials and feature flags live here.
 */

export const config = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  mockMode: (process.env.MOCK_MODE ?? 'true') === 'true',

  jobdiva: {
    baseUrl: process.env.JOBDIVA_API_BASE_URL ?? '',
    clientId: process.env.JOBDIVA_CLIENT_ID ?? '',
    clientSecret: process.env.JOBDIVA_CLIENT_SECRET ?? '',
    tenantId: process.env.JOBDIVA_TENANT_ID ?? '',
    sandbox: (process.env.JOBDIVA_SANDBOX ?? 'true') === 'true',
  },

  docusign: {
    baseUrl: process.env.DOCUSIGN_BASE_URL ?? '',
    accountId: process.env.DOCUSIGN_ACCOUNT_ID ?? '',
    integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY ?? '',
    secretKey: process.env.DOCUSIGN_SECRET_KEY ?? '',
    redirectUri: process.env.DOCUSIGN_REDIRECT_URI ?? '',
    environment: (process.env.DOCUSIGN_ENVIRONMENT ?? 'demo') as 'demo' | 'production',
  },

  sharepoint: {
    tenantId: process.env.SHAREPOINT_TENANT_ID ?? '',
    clientId: process.env.SHAREPOINT_CLIENT_ID ?? '',
    clientSecret: process.env.SHAREPOINT_CLIENT_SECRET ?? '',
    siteUrl: process.env.SHAREPOINT_SITE_URL ?? '',
    driveId: process.env.SHAREPOINT_DRIVE_ID ?? '',
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    jwtExpiry: process.env.JWT_EXPIRY ?? '8h',
  },

  database: {
    url: process.env.DATABASE_URL ?? 'postgresql://clarity_user:clarity_local_pass@localhost:5434/project_clarity',
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6380', 10),
  },

  newrelic: {
    enabled: (process.env.NEW_RELIC_ENABLED ?? 'false') === 'true',
    licenseKey: process.env.NEW_RELIC_LICENSE_KEY ?? '',
    appName: process.env.NEW_RELIC_APP_NAME ?? 'project-clarity-backend',
  },
} as const;
