import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import customerRouter from './routes/customers.js';
import resourceRouter from './routes/resources.js';
import roleRouter from './routes/roles.js';
import skillRouter from './routes/skills.js';
import holidayRouter from './routes/holidays.js';
import msaRouter from './routes/msas.js';
import sowTemplateRouter from './routes/sowTemplates.js';
import sowRouter from './routes/sows.js';
import capacityRouter from './routes/capacity.js';
import allocationRouter from './routes/allocations.js';
import assignmentRouter from './routes/assignments.js';
import burntReportRouter from './routes/burntReports.js';
import changeOrderRouter from './routes/changeOrders.js';
import docusignRouter from './routes/docusign.js';
import sharepointRouter from './routes/sharepoint.js';
import integrationHealthRouter from './routes/integrationHealth.js';

const app = express();

// ─── Global Middleware ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

// ─── Health Check ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ─── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/customers', customerRouter);
app.use('/api/resources', resourceRouter);
app.use('/api/roles', roleRouter);
app.use('/api/skills', skillRouter);
app.use('/api/holidays', holidayRouter);
app.use('/api/msas', msaRouter);
app.use('/api/sow-templates', sowTemplateRouter);
app.use('/api/sows', sowRouter);
app.use('/api/capacity', capacityRouter);
app.use('/api/allocations', allocationRouter);
app.use('/api/assignments', assignmentRouter);
app.use('/api/burnt-reports', burntReportRouter);
app.use('/api/change-orders', changeOrderRouter);
app.use('/api/docusign', docusignRouter);
app.use('/api/sharepoint', sharepointRouter);
app.use('/api/integration-health', integrationHealthRouter);

// ─── Error Handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

export default app;
