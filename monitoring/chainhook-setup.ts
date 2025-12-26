/**
 * Nexus Sphere - Chainhook Monitoring Setup
 * 
 * This script sets up comprehensive monitoring for the deployed contract
 * using the @hirosystems/chainhooks-client package.
 */

import 'dotenv/config';
import { ChainhooksClient, CHAINHOOKS_BASE_URL } from '@hirosystems/chainhooks-client';

// Configuration
const CONTRACT_ADDRESS = 'SP11MXPJA03GJ9FS5H6GWPWH3ZDNR7P1DSAPKP6KD.nexus-sphere';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://your-webhook-endpoint.com/events';
const CHAINHOOKS_API_KEY = process.env.CHAINHOOKS_API_KEY;

if (!CHAINHOOKS_API_KEY) {
  console.error('Error: CHAINHOOKS_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize client
const client = new ChainhooksClient({
  baseUrl: CHAINHOOKS_BASE_URL.mainnet,
  apiKey: CHAINHOOKS_API_KEY,
});

/**
 * Set up all monitoring chainhooks for Nexus Sphere
 */
async function setupMonitoring() {
  console.log('🔍 Setting up chainhook monitoring for Nexus Sphere...\n');

  try {
    // 1. Monitor member joins
    const joinHook = await client.registerChainhook({
      name: 'NexusSphere - Member Joins',
      chain: 'stacks',
      network: 'mainnet',
      version: 1,
      filters: {
        events: [
          {
            type: 'contract_log',
            contract_identifier: CONTRACT_ADDRESS
          }
        ]
      },
      action: {
        type: 'http_post',
        url: `${WEBHOOK_URL}/member-joined`,
        authorization_header: `Bearer ${process.env.WEBHOOK_SECRET || ''}`
      },
      options: {
        start_at_block_height: 'current', // Start monitoring from now
        enable_on_registration: true
      }
    });
    console.log('✅ Member Join Hook registered:', joinHook.uuid);

    // 2. Monitor member exits
    const exitHook = await client.registerChainhook({
      name: 'NexusSphere - Member Exits',
      chain: 'stacks',
      network: 'mainnet',
      version: 1,
      filters: {
        events: [
          {
            type: 'contract_log',
            contract_identifier: CONTRACT_ADDRESS
          }
        ]
      },
      action: {
        type: 'http_post',
        url: `${WEBHOOK_URL}/member-exited`,
        authorization_header: `Bearer ${process.env.WEBHOOK_SECRET || ''}`
      },
      options: {
        start_at_block_height: 'current',
        enable_on_registration: true
      }
    });
    console.log('✅ Member Exit Hook registered:', exitHook.uuid);

    // 3. Monitor proposal submissions
    const proposalHook = await client.registerChainhook({
      name: 'NexusSphere - Proposals',
      chain: 'stacks',
      network: 'mainnet',
      version: 1,
      filters: {
        events: [
          {
            type: 'contract_log',
            contract_identifier: CONTRACT_ADDRESS
          }
        ]
      },
      action: {
        type: 'http_post',
        url: `${WEBHOOK_URL}/proposal-submitted`,
        authorization_header: `Bearer ${process.env.WEBHOOK_SECRET || ''}`
      },
      options: {
        start_at_block_height: 'current',
        enable_on_registration: true
      }
    });
    console.log('✅ Proposal Submission Hook registered:', proposalHook.uuid);

    // 4. Monitor votes
    const voteHook = await client.registerChainhook({
      name: 'NexusSphere - Votes',
      chain: 'stacks',
      network: 'mainnet',
      version: 1,
      filters: {
        events: [
          {
            type: 'contract_log',
            contract_identifier: CONTRACT_ADDRESS
          }
        ]
      },
      action: {
        type: 'http_post',
        url: `${WEBHOOK_URL}/vote-cast`,
        authorization_header: `Bearer ${process.env.WEBHOOK_SECRET || ''}`
      },
      options: {
        start_at_block_height: 'current',
        enable_on_registration: true
      }
    });
    console.log('✅ Vote Cast Hook registered:', voteHook.uuid);

    // 5. Monitor proposal executions (CRITICAL - track fund movements)
    const executionHook = await client.registerChainhook({
      name: 'NexusSphere - Proposal Executions',
      chain: 'stacks',
      network: 'mainnet',
      version: 1,
      filters: {
        events: [
          {
            type: 'contract_log',
            contract_identifier: CONTRACT_ADDRESS
          }
        ]
      },
      action: {
        type: 'http_post',
        url: `${WEBHOOK_URL}/proposal-executed`,
        authorization_header: `Bearer ${process.env.WEBHOOK_SECRET || ''}`
      },
      options: {
        start_at_block_height: 'current',
        enable_on_registration: true
      }
    });
    console.log('✅ Proposal Execution Hook registered:', executionHook.uuid);

    // 6. Monitor ALL contract calls (for security)
    const allCallsHook = await client.registerChainhook({
      name: 'NexusSphere - All Contract Calls',
      chain: 'stacks',
      network: 'mainnet',
      version: 1,
      filters: {
        events: [
          {
            type: 'contract_call',
            contract_identifier: CONTRACT_ADDRESS
          }
        ]
      },
      action: {
        type: 'http_post',
        url: `${WEBHOOK_URL}/all-calls`,
        authorization_header: `Bearer ${process.env.WEBHOOK_SECRET || ''}`
      },
      options: {
        start_at_block_height: 'current',
        enable_on_registration: true
      }
    });
    console.log('✅ All Calls Hook registered:', allCallsHook.uuid);

    console.log('\n🎉 All chainhooks successfully registered!');
    console.log('\n📊 Summary:');
    console.log(`   Contract: ${CONTRACT_ADDRESS}`);
    console.log(`   Webhook Endpoint: ${WEBHOOK_URL}`);
    console.log(`   Monitoring: Member joins, exits, proposals, votes, executions, all calls`);
    
    return {
      joinHook: joinHook.uuid,
      exitHook: exitHook.uuid,
      proposalHook: proposalHook.uuid,
      voteHook: voteHook.uuid,
      executionHook: executionHook.uuid,
      allCallsHook: allCallsHook.uuid
    };

  } catch (error: any) {
    console.error('❌ Error setting up chainhooks:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * List all existing chainhooks
 */
async function listChainhooks() {
  try {
    const { results, total } = await client.getChainhooks({ limit: 50 });
    console.log(`\n📋 Found ${total} existing chainhooks:`);
    results.forEach((hook, index) => {
      console.log(`${index + 1}. ${hook.definition.name} (${hook.uuid})`);
      console.log(`   Status: ${hook.enabled ? '🟢 Enabled' : '🔴 Disabled'}`);
    });
    return results;
  } catch (error: any) {
    console.error('❌ Error listing chainhooks:', error.message);
    throw error;
  }
}

/**
 * Delete a chainhook by UUID
 */
async function deleteChainhook(uuid: string) {
  try {
    await client.deleteChainhook(uuid);
    console.log(`✅ Deleted chainhook: ${uuid}`);
  } catch (error: any) {
    console.error(`❌ Error deleting chainhook ${uuid}:`, error.message);
    throw error;
  }
}

/**
 * Check API status
 */
async function checkStatus() {
  try {
    const status = await client.getStatus();
    console.log('✅ Chainhooks API Status:');
    console.log(`   Status: ${status.status}`);
    console.log(`   Server Version: ${status.server_version}`);
    console.log(`   Chain Tip: Block ${status.chain_tip?.block_height || 'N/A'}`);
    return status;
  } catch (error: any) {
    console.error('❌ Error checking status:', error.message);
    throw error;
  }
}

// CLI Interface
const command = process.argv[2];

(async () => {
  try {
    switch (command) {
      case 'setup':
        await checkStatus();
        await setupMonitoring();
        break;
      
      case 'list':
        await listChainhooks();
        break;
      
      case 'status':
        await checkStatus();
        break;
      
      case 'delete':
        const uuid = process.argv[3];
        if (!uuid) {
          console.error('Error: Please provide a UUID to delete');
          process.exit(1);
        }
        await deleteChainhook(uuid);
        break;
      
      default:
        console.log('Nexus Sphere - Chainhook Monitoring\n');
        console.log('Usage:');
        console.log('  npm run monitor:setup   - Set up all monitoring chainhooks');
        console.log('  npm run monitor:list    - List all existing chainhooks');
        console.log('  npm run monitor:status  - Check API status');
        console.log('  npm run monitor:delete <uuid> - Delete a chainhook\n');
        console.log('Environment Variables:');
        console.log('  CHAINHOOKS_API_KEY - Required: Your Hiro API key');
        console.log('  WEBHOOK_URL        - Required: Your webhook endpoint URL');
        console.log('  WEBHOOK_SECRET     - Optional: Webhook authorization secret');
        break;
    }
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
})();
