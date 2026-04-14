import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { connectDB } from './db/connection.js';

// Connect to MongoDB
connectDB();

import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import workflowRoutes from './routes/workflow.routes.js';
import stepRoutes from './routes/step.routes.js';
import ruleRoutes from './routes/rule.routes.js';
import executionRoutes from './routes/execution.routes.js';

const app = express();
const PORT = process.env.PORT || 4000;

// CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '5mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'epettyshop-backend' });
});

// Public routes (no auth)
app.use('/api/auth', authRoutes);

// Protected routes — all require valid tenant JWT
app.use('/api/workflows', authMiddleware, workflowRoutes);
app.use('/api/workflows/:workflowId/steps', authMiddleware, stepRoutes);
app.use('/api/steps/:stepId/rules', authMiddleware, ruleRoutes);
app.use('/api/execute', authMiddleware, executionRoutes);
app.use('/api/executions', authMiddleware, executionRoutes);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 epettyshop Backend API running!');
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log('');
});

export default app;
