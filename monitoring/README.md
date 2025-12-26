# Nexus Sphere - Monitoring Setup

## 🚨 Critical: Your Contract is Live on Mainnet

**Contract Address:** `SP11MXPJA03GJ9FS5H6GWPWH3ZDNR7P1DSAPKP6KD.nexus-sphere`

This monitoring system uses [@hirosystems/chainhooks-client](https://www.npmjs.com/package/@hirosystems/chainhooks-client) to track all contract activity in real-time.

## Prerequisites

1. **Install Dependencies**

   ```bash
   npm install @hirosystems/chainhooks-client express @types/express
   npm install --save-dev tsx
   ```

2. **Get Hiro API Key**
   - Sign up at [Hiro Platform](https://platform.hiro.so/)
   - Create an API key for mainnet access

3. **Set Up Webhook Endpoint**
   - Deploy a public webhook server (use the `webhook-server.ts` example)
   - Or use a service like ngrok for local testing:

     ```bash
     npx ngrok http 3000
     ```

## Quick Start

1. **Configure Environment Variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```env
   CHAINHOOKS_API_KEY=your_hiro_api_key_here
   WEBHOOK_URL=https://your-webhook-endpoint.com/events
   WEBHOOK_SECRET=your_secret_token_here
   ```

2. **Start Webhook Server** (in one terminal)

   ```bash
   npm run webhook:start
   ```

3. **Set Up Monitoring** (in another terminal)

   ```bash
   npm run monitor:setup
   ```

## Available Commands

```bash
# Set up all monitoring chainhooks
npm run monitor:setup

# List all existing chainhooks
npm run monitor:list

# Check API status
npm run monitor:status

# Delete a specific chainhook
npm run monitor:delete <uuid>

# Start webhook server
npm run webhook:start
```

## Monitored Events

The system monitors these critical events:

### 1. **Member Joins** 🟢

- Event: `member-joined`
- Data: member address, deposit amount, block height
- Use: Track community growth, update member database

### 2. **Member Exits** 🔴

- Event: `member-exited`
- Data: member address, withdrawal amount, block height
- Use: Track withdrawals, update analytics

### 3. **Proposal Submissions** 📋

- Event: `proposal-submitted`
- Data: proposal ID, proposer, funding amount
- Use: Notify community, display in dashboard

### 4. **Votes Cast** 🗳️

- Event: `vote-cast`
- Data: proposal ID, voter, support (yes/no), voting power
- Use: Real-time vote tracking, governance analytics

### 5. **Proposal Executions** ✅ **CRITICAL**

- Event: `proposal-executed`
- Data: proposal ID, amount transferred, beneficiary
- Use: **ALERT on fund movements**, accounting, audit trail

### 6. **All Contract Calls** 🔍

- Tracks every function call
- Use: Security monitoring, detect anomalies

## Security Alerts

Set up alerts for these critical conditions:

```typescript
// Example alert conditions
if (event === 'proposal-executed' && event.amount > 1000000000) {
  // Alert: Large fund transfer (>1000 STX)
  sendAlert('🚨 Large transfer detected!');
}

if (callsPerHour > 100) {
  // Alert: Unusual activity
  sendAlert('⚠️ High activity detected');
}

if (proposalExecuted && quorumVotes < 10) {
  // Alert: Low participation execution
  sendAlert('⚠️ Proposal passed with low turnout');
}
```

## Production Recommendations

### 1. **Database Integration**

Store events in a database for analytics:

```typescript
// Example with PostgreSQL
await db.events.create({
  type: 'member-joined',
  member: event.member,
  amount: event.amount,
  block: event.block,
  timestamp: new Date()
});
```

### 2. **Real-Time Dashboard**

- Build a dashboard showing live stats
- Display active proposals
- Show voting progress
- Track total funds

### 3. **Notifications**

- Email alerts for new proposals
- Discord/Slack notifications for votes
- SMS for critical events (large transfers)

### 4. **Anomaly Detection**

- Monitor for unusual patterns
- Flag suspicious activity
- Track member behavior

### 5. **Backup Monitoring**

Since this is mainnet with real funds:

- Run monitoring on multiple servers
- Set up health checks
- Configure automatic failover
- Keep audit logs

## Testing

Test your webhook locally:

```bash
# Start webhook server
npm run webhook:start

# In another terminal, test with curl
curl -X POST http://localhost:3000/events/member-joined \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_secret" \
  -d '{
    "member": "SP11MXPJA03GJ9FS5H6GWPWH3ZDNR7P1DSAPKP6KD",
    "amount": 5000000,
    "block": 12345
  }'
```

## Troubleshooting

### Chainhooks not triggering

1. Check API key is valid: `npm run monitor:status`
2. Verify webhook URL is publicly accessible
3. Check chainhook is enabled: `npm run monitor:list`
4. Review Hiro dashboard for errors

### Missing events

- Chainhooks can take 1-2 blocks to activate
- Check contract address matches exactly
- Verify print events in contract are correct

### Webhook errors

- Check server logs for errors
- Verify SSL certificate (if using HTTPS)
- Test with ngrok for debugging

## Emergency Procedures

If you detect malicious activity:

1. **Immediate Response**
   - You cannot pause the contract (no pause function)
   - Warn community members immediately
   - Document the incident

2. **Investigation**
   - Review all transaction logs
   - Identify affected proposals
   - Check voting patterns

3. **Communication**
   - Notify all members
   - Post public disclosure
   - Report to Hiro support

## Cost Monitoring

Track costs to ensure sustainability:

- Hiro API costs (check your plan)
- Webhook hosting costs
- Database storage costs

## Support

- Chainhooks Documentation: <https://docs.hiro.so/chainhooks>
- Hiro API Support: <support@hiro.so>
- Contract on Explorer: <https://explorer.hiro.so/txid/SP11MXPJA03GJ9FS5H6GWPWH3ZDNR7P1DSAPKP6KD.nexus-sphere?chain=mainnet>
