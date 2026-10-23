import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { dataStore } from './src/server/store';
import { agentService, AGENT_TOOLS } from './src/server/agent';
import { voiceConversationService, voiceSessionManager } from './src/server/voiceService';
import fs from 'fs';
import path from 'path';
import { modelServer } from './backend/app/llm/modelServer';

dotenv.config();

const app = express();
app.use(express.json());

// API Endpoints
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'EchoCare AI Coordination Backend',
    version: '1.0.0',
    mode: process.env.GEMINI_API_KEY ? 'gemini_enhanced' : 'deterministic_demo',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/dashboard/summary', (req: Request, res: Response) => {
  const today = '2026-10-20';
  const todayTasks = dataStore.tasks.filter(t => t.dueDate === today);
  const completed = todayTasks.filter(t => t.status === 'completed');
  const pending = todayTasks.filter(t => t.status === 'pending');
  const activeReminders = dataStore.reminders.filter(r => r.isActive);

  res.json({
    recipient: dataStore.profile,
    metrics: {
      totalTasksToday: todayTasks.length,
      completedTasksToday: completed.length,
      pendingTasksToday: pending.length,
      overdueTasksCount: 0,
      activeRemindersCount: activeReminders.length,
      completionRatePercent: todayTasks.length > 0 ? Math.round((completed.length / todayTasks.length) * 100) : 0,
      activeCaregiver: 'Sarah Jenkins (Primary)'
    },
    todayTasks,
    upcomingReminders: activeReminders,
    recentActivities: dataStore.activities.slice(0, 8),
    recentHandover: dataStore.handovers[0] || null
  });
});

// Tasks
app.get('/api/tasks', (req: Request, res: Response) => {
  let tasks = [...dataStore.tasks];
  const { status, category, search } = req.query;

  if (status && status !== 'all') {
    tasks = tasks.filter(t => t.status === status);
  }
  if (category && category !== 'all') {
    tasks = tasks.filter(t => t.category === category);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    tasks = tasks.filter(t => 
      t.title.toLowerCase().includes(q) || 
      t.description.toLowerCase().includes(q) ||
      t.assignedTo.toLowerCase().includes(q)
    );
  }

  res.json(tasks);
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const { title, description, category, priority, assignedTo, dueDate, dueTime, reminderLinked } = req.body;
  if (!title || !category || !dueDate || !dueTime) {
    return res.status(400).json({ error: 'Missing required task fields.' });
  }

  const result = agentService.executeTool('create_care_task', {
    title,
    description,
    category,
    priority,
    assignedTo,
    dueDate,
    dueTime,
    reminderLinked
  }, 'Sarah Jenkins');

  res.status(201).json(result.data);
});

app.patch('/api/tasks/:id/complete', (req: Request, res: Response) => {
  const { id } = req.params;
  const { completedBy, notes } = req.body;

  const result = agentService.executeTool('complete_care_task', {
    taskId: id,
    completedBy: completedBy || 'Sarah Jenkins',
    notes
  }, completedBy || 'Sarah Jenkins');

  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }
  res.json(result.data);
});

app.patch('/api/tasks/:id/cancel', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const result = agentService.executeTool('cancel_care_task', {
    taskId: id,
    reason: reason || 'Cancelled by caregiver'
  }, 'Sarah Jenkins');

  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }
  res.json(result.data);
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = dataStore.tasks.findIndex(t => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  const deleted = dataStore.tasks.splice(idx, 1)[0];
  dataStore.recordActivity({
    actor: 'Sarah Jenkins',
    actorRole: 'caregiver',
    actionType: 'task_cancelled',
    description: `Deleted task: "${deleted.title}"`,
    recordType: 'task'
  });
  res.json({ message: 'Task deleted successfully' });
});

// Reminders
app.get('/api/reminders', (req: Request, res: Response) => {
  res.json(dataStore.reminders);
});

app.post('/api/reminders', (req: Request, res: Response) => {
  const { title, category, time, frequency, soundEnabled } = req.body;
  if (!title || !category || !time) {
    return res.status(400).json({ error: 'Missing required reminder fields' });
  }

  const result = agentService.executeTool('create_reminder', {
    title,
    category,
    time,
    frequency,
    soundEnabled
  }, 'Sarah Jenkins');

  res.status(201).json(result.data);
});

app.patch('/api/reminders/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const reminder = dataStore.reminders.find(r => r.id === id);
  if (!reminder) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  reminder.isActive = !reminder.isActive;
  dataStore.recordActivity({
    actor: 'Sarah Jenkins',
    actorRole: 'caregiver',
    actionType: 'reminder_toggled',
    description: `${reminder.isActive ? 'Activated' : 'Paused'} reminder: "${reminder.title}"`,
    recordId: reminder.id,
    recordType: 'reminder'
  });

  res.json(reminder);
});

app.delete('/api/reminders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = dataStore.reminders.findIndex(r => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Reminder not found' });
  }
  dataStore.reminders.splice(idx, 1);
  res.json({ message: 'Reminder deleted' });
});

// Handovers
app.get('/api/handovers', (req: Request, res: Response) => {
  res.json(dataStore.handovers);
});

app.post('/api/handovers/generate', (req: Request, res: Response) => {
  const { outgoingCaregiver, incomingCaregiver, shiftTitle } = req.body;
  const result = agentService.executeTool('generate_handover', {
    outgoingCaregiver,
    incomingCaregiver,
    shiftTitle
  }, 'EchoCare Agent');

  res.json(result.data);
});

app.post('/api/handovers', (req: Request, res: Response) => {
  const handover = req.body;
  handover.id = `handover-${Date.now()}`;
  handover.createdAt = new Date().toISOString();
  dataStore.handovers.unshift(handover);

  dataStore.recordActivity({
    actor: handover.outgoingCaregiver || 'Sarah Jenkins',
    actorRole: 'caregiver',
    actionType: 'handover_generated',
    description: `Manual handover logged for ${handover.shiftTime}`,
    recordId: handover.id,
    recordType: 'handover'
  });

  res.status(201).json(handover);
});

// Activities
app.get('/api/activities', (req: Request, res: Response) => {
  res.json(dataStore.activities);
});

app.post('/api/activities', (req: Request, res: Response) => {
  const { actor, actorRole, actionType, description, eventType, recordId, recordType, metadata } = req.body;
  if (!description) {
    return res.status(400).json({ error: 'Activity description is required' });
  }

  const newActivity = dataStore.recordActivity({
    actor: actor || 'Sarah Jenkins',
    actorRole: actorRole || 'caregiver',
    actionType: actionType || 'profile_updated',
    description,
    eventType: eventType || 'health',
    recordId,
    recordType: recordType || 'system',
    metadata
  });

  res.status(201).json(newActivity);
});

// Profile & Settings
app.get('/api/profile', (req: Request, res: Response) => {
  res.json(dataStore.profile);
});

app.put('/api/profile', (req: Request, res: Response) => {
  dataStore.profile = { ...dataStore.profile, ...req.body };
  dataStore.recordActivity({
    actor: 'Sarah Jenkins',
    actorRole: 'caregiver',
    actionType: 'profile_updated',
    description: 'Updated care recipient profile and clinical goals',
    recordType: 'system'
  });
  res.json(dataStore.profile);
});

app.get('/api/settings', (req: Request, res: Response) => {
  res.json(dataStore.settings);
});

app.put('/api/settings', (req: Request, res: Response) => {
  dataStore.settings = { ...dataStore.settings, ...req.body };
  res.json(dataStore.settings);
});

// Reset demo data
app.post('/api/demo/reset', (req: Request, res: Response) => {
  dataStore.reset();
  res.json({ message: 'Demo data reset successfully to initial state' });
});

// AI Agent Chat & Tool Execution
app.post('/api/agent/chat', async (req: Request, res: Response) => {
  const { message, confirmedAction } = req.body;
  if (!message && !confirmedAction) {
    return res.status(400).json({ error: 'Message or confirmed action required' });
  }

  try {
    const responseMessage = await agentService.processUserMessage(message || '', confirmedAction);
    res.json(responseMessage);
  } catch (err: any) {
    console.error('Agent chat error:', err);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

app.post('/api/agent/execute-tool', (req: Request, res: Response) => {
  const { tool, input, actor } = req.body;
  if (!tool) {
    return res.status(400).json({ error: 'Tool name required' });
  }

  const result = agentService.executeTool(tool, input || {}, actor || 'Caregiver User');
  res.json(result);
});

// Conversational Voice Assistant Endpoints (Alexa-Style Multi-Turn)
app.post('/api/voice/turn', async (req: Request, res: Response) => {
  const { sessionId, transcript, language, confirmedAction } = req.body;
  if (!transcript && !confirmedAction) {
    return res.status(400).json({ error: 'Transcript or confirmedAction required' });
  }

  try {
    const turnResult = await voiceConversationService.processTurn({
      sessionId,
      transcript: transcript || '',
      language,
      confirmedAction
    });
    res.json(turnResult);
  } catch (err: any) {
    console.error('Voice turn error:', err);
    res.status(500).json({ error: err.message || 'Failed to process voice turn' });
  }
});

app.get('/api/voice/session/:id?', (req: Request, res: Response) => {
  const session = voiceSessionManager.getSession(req.params.id);
  res.json(session);
});

app.delete('/api/voice/session/:id', (req: Request, res: Response) => {
  voiceSessionManager.clearSession(req.params.id);
  res.json({ message: 'Voice session cleared' });
});

// Custom LLM Model Serving & Training Endpoints
app.get('/api/model/health', (req: Request, res: Response) => {
  res.json(modelServer.getHealth());
});

app.get('/api/model/config', (req: Request, res: Response) => {
  res.json(modelServer.getConfig());
});

app.post('/api/model/config', (req: Request, res: Response) => {
  const updated = modelServer.updateConfig(req.body);
  res.json(updated);
});

app.post('/api/model/inference', async (req: Request, res: Response) => {
  try {
    const result = await modelServer.generate(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Model inference failed' });
  }
});

app.get('/api/model/evaluation', (req: Request, res: Response) => {
  const evalPath = path.resolve(process.cwd(), 'training/evaluations/results.json');
  if (fs.existsSync(evalPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(evalPath, 'utf-8'));
      return res.json(data);
    } catch (e) {
      console.warn('Error reading evaluation file:', e);
    }
  }
  res.status(404).json({ error: 'Evaluation results not found' });
});

app.get('/api/model/dataset-summary', (req: Request, res: Response) => {
  const summaryPath = path.resolve(process.cwd(), 'training/data/dataset_summary.json');
  if (fs.existsSync(summaryPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      return res.json(data);
    } catch (e) {
      console.warn('Error reading dataset summary:', e);
    }
  }
  res.status(404).json({ error: 'Dataset summary not found' });
});

app.get('/api/model/loss-history', (req: Request, res: Response) => {
  const lossPath = path.resolve(process.cwd(), 'models/echocare-lora-adapter/training_loss_history.json');
  if (fs.existsSync(lossPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(lossPath, 'utf-8'));
      return res.json(data);
    } catch (e) {
      console.warn('Error reading loss history:', e);
    }
  }
  res.status(404).json({ error: 'Loss history not found' });
});

// MCP (Model Context Protocol) API Endpoints
app.get('/api/mcp/tools', (req: Request, res: Response) => {
  res.json({
    protocolVersion: '2024-11-05',
    serverInfo: {
      name: 'echocare-mcp-server',
      version: '1.0.0',
      description: 'EchoCare AI Model Context Protocol Server for Care Coordination'
    },
    tools: AGENT_TOOLS
  });
});

app.post('/api/mcp/invoke', (req: Request, res: Response) => {
  const { jsonrpc, method, params, id } = req.body;

  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: { tools: AGENT_TOOLS }
    });
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params || {};
    const execution = agentService.executeTool(name, args || {}, 'MCP Client');
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify(execution.data, null, 2)
          }
        ],
        isError: !execution.success
      }
    });
  }

  res.status(400).json({
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method "${method}" not found.` }
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, _next: any) => {
  console.error('[EchoCare Server Error]:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error', details: err?.message || String(err) });
  }
});

// Process-level safety to prevent unhandled rejections from crashing dev server
process.on('uncaughtException', (err) => {
  console.error('[EchoCare Process Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[EchoCare Process Unhandled Rejection]:', reason);
});

// Mount Vite middleware in dev or serve static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  // Support both CLI flags (--port, --host) and environment variables
  const args = process.argv.slice(2);
  const getArgValue = (flag: string, shortFlag?: string): string | undefined => {
    for (let i = 0; i < args.length; i++) {
      if (args[i] === flag || (shortFlag && args[i] === shortFlag)) {
        return args[i + 1];
      }
      if (args[i].startsWith(`${flag}=`)) {
        return args[i].split('=')[1];
      }
    }
    return undefined;
  };

  const cliPort = getArgValue('--port', '-p');
  const cliHost = getArgValue('--host', '-h');

  const PORT = cliPort 
    ? parseInt(cliPort, 10) 
    : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

  const HOST = cliHost || process.env.HOST || '0.0.0.0';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`[EchoCare AI] Full-Stack server running on http://${HOST}:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[EchoCare AI] Port ${PORT} is already in use. Please wait or stop conflicting process.`);
    } else {
      console.error('[EchoCare AI] Server error:', err);
    }
  });

  // Handle graceful termination
  const shutdown = () => {
    server.close(() => {
      console.log('[EchoCare AI] Server closed gracefully.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});

