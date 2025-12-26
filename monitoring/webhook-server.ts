/**
 * Simple Express webhook server to receive chainhook events
 * 
 * This is a basic example. In production, you should:
 * - Add database storage for events
 * - Implement proper authentication
 * - Add rate limiting
 * - Set up alerting for critical events
 */

import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

app.use(express.json({ limit: '10mb' }));

// Middleware to verify webhook signature
const verifyWebhook = (req: Request, res: Response, next: any) => {
  if (WEBHOOK_SECRET) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  next();
};

// Member Joins
app.post('/events/member-joined', verifyWebhook, (req: Request, res: Response) => {
  const event = req.body;
  console.log('👤 NEW MEMBER JOINED:', {
    member: event.member,
    amount: event.amount,
    block: event.block,
    timestamp: new Date().toISOString()
  });
  
  // TODO: Store in database, send notifications, update analytics
  
  res.status(200).json({ received: true });
});

// Member Exits
app.post('/events/member-exited', verifyWebhook, (req: Request, res: Response) => {
  const event = req.body;
  console.log('👋 MEMBER EXITED:', {
    member: event.member,
    amount: event.amount,
    block: event.block,
    timestamp: new Date().toISOString()
  });
  
  // TODO: Store in database, update member count
  
  res.status(200).json({ received: true });
});

// Proposal Submissions
app.post('/events/proposal-submitted', verifyWebhook, (req: Request, res: Response) => {
  const event = req.body;
  console.log('📋 NEW PROPOSAL:', {
    proposalId: event['proposal-id'],
    proposer: event.proposer,
    amount: event.amount,
    timestamp: new Date().toISOString()
  });
  
  // TODO: Notify community members, update dashboard
  
  res.status(200).json({ received: true });
});

// Vote Cast
app.post('/events/vote-cast', verifyWebhook, (req: Request, res: Response) => {
  const event = req.body;
  console.log('🗳️  VOTE CAST:', {
    proposalId: event['proposal-id'],
    voter: event.voter,
    support: event.support,
    power: event.power,
    timestamp: new Date().toISOString()
  });
  
  // TODO: Update proposal vote counts in real-time
  
  res.status(200).json({ received: true });
});

// Proposal Executed (CRITICAL)
app.post('/events/proposal-executed', verifyWebhook, (req: Request, res: Response) => {
  const event = req.body;
  console.log('✅ PROPOSAL EXECUTED (FUNDS TRANSFERRED):', {
    proposalId: event['proposal-id'],
    amount: event.amount,
    beneficiary: event.beneficiary,
    timestamp: new Date().toISOString()
  });
  
  // TODO: Send alerts, update accounting, verify transaction
  
  res.status(200).json({ received: true });
});

// All Contract Calls (Security monitoring)
app.post('/events/all-calls', verifyWebhook, (req: Request, res: Response) => {
  const event = req.body;
  console.log('📞 CONTRACT CALL:', {
    function: event.function_name,
    sender: event.sender,
    block: event.block_height,
    timestamp: new Date().toISOString()
  });
  
  // TODO: Log all activity, detect anomalies
  
  res.status(200).json({ received: true });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    contract: 'SP11MXPJA03GJ9FS5H6GWPWH3ZDNR7P1DSAPKP6KD.nexus-sphere'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Nexus Sphere Webhook Server running on port ${PORT}`);
  console.log(`📡 Listening for events from: SP11MXPJA03GJ9FS5H6GWPWH3ZDNR7P1DSAPKP6KD.nexus-sphere`);
  console.log(`🔒 Webhook secret: ${WEBHOOK_SECRET ? 'Configured' : 'Not configured (WARNING)'}`);
});
