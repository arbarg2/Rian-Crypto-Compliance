
import { supabase } from '@/integrations/supabase/client';

// Real-time blockchain API integration service - PRODUCTION GRADE
interface EtherscanResponse {
  status: string;
  message: string;
  result: any;
}

interface BlockstreamAddressInfo {
  address: string;
  chain_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
  mempool_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
}

interface BlockstreamTransaction {
  txid: string;
  version: number;
  locktime: number;
  vin: Array<{
    txid: string;
    vout: number;
    prevout?: {
      scriptpubkey: string;
      scriptpubkey_asm: string;
      scriptpubkey_type: string;
      scriptpubkey_address?: string;
      value: number;
    };
  }>;
  vout: Array<{
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address?: string;
    value: number;
  }>;
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

interface EthereumTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
}

class RealBlockchainAPI {
  private readonly BLOCKSTREAM_BASE_URL = 'https://blockstream.info/api';

  // Rate limiting
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

  constructor() {
    // Etherscan key is no longer fetched to the client; calls are proxied server-side.
  }

  // Server-side Etherscan proxy. Never exposes the API key to the browser.
  private async etherscanProxy(params: Record<string, string | number>): Promise<EtherscanResponse> {
    const { data, error } = await supabase.functions.invoke('etherscan-proxy', {
      body: params,
    });
    if (error) {
      throw new Error(`Etherscan proxy error: ${error.message}`);
    }
    return data as EtherscanResponse;
  }

  // ---------- Wallet cache (TTL'd chain data) ----------
  // 5 min TTL keeps lookups fresh enough for compliance while massively cutting API calls.
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  private async getCached<T>(network: string, address: string): Promise<T | null> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return null; // cache is only available to signed-in users
      const { data } = await supabase.functions.invoke('wallet-cache-write', {
        body: { action: 'read', network, address },
      });
      if (data?.data) {
        console.log(`⚡ [CACHE HIT] ${network}:${address}`);
        return data.data as T;
      }
    } catch (e) {
      console.warn('Cache read failed (non-fatal):', e);
    }
    return null;
  }

  private async setCached(network: string, address: string, data: unknown): Promise<void> {
    try {
      await supabase.functions.invoke('wallet-cache-write', {
        body: { network, address, data },
      });
    } catch (e) {
      console.warn('Cache write failed (non-fatal):', e);
    }
  }

  // Rate limiting helper
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`⏱️ Rate limiting: waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  // (API key initialization removed — handled server-side by etherscan-proxy)

  // Bitcoin API integration using Blockstream (free, no API key needed)
  async getBitcoinAddressData(address: string): Promise<{
    balance: number;
    totalReceived: number;
    totalSent: number;
    transactionCount: number;
    transactions: any[];
  }> {
    // Check cache first
    const cached = await this.getCached<{
      balance: number; totalReceived: number; totalSent: number;
      transactionCount: number; transactions: any[];
    }>('bitcoin', address);
    if (cached) return cached;

    await this.enforceRateLimit();
    
    try {
      console.log(`🔍 [BITCOIN LIVE] Fetching real-time data for: ${address}`);
      
      // Validate Bitcoin address format
      if (!this.isValidBitcoinAddress(address)) {
        throw new Error(`Invalid Bitcoin address format: ${address}`);
      }
      
      // Get address info with timeout
      const addressController = new AbortController();
      const addressTimeout = setTimeout(() => {
        console.log('⚠️ Bitcoin address request timeout, aborting...');
        addressController.abort();
      }, 20000); // Increased timeout to 20 seconds
      
      const addressResponse = await fetch(`${this.BLOCKSTREAM_BASE_URL}/address/${address}`, {
        signal: addressController.signal,
        headers: {
          'User-Agent': 'Rian-Blockchain-Intelligence/1.0',
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(addressTimeout);
      
      if (!addressResponse.ok) {
        if (addressResponse.status === 404) {
          throw new Error(`Bitcoin address not found: ${address}`);
        }
        if (addressResponse.status === 429) {
          throw new Error(`Rate limited by Blockstream API. Please wait before retrying.`);
        }
        throw new Error(`Blockstream API error: ${addressResponse.status} - ${addressResponse.statusText}`);
      }
      
      const addressInfo: BlockstreamAddressInfo = await addressResponse.json();
      console.log('📊 Bitcoin address info received:', addressInfo);
      
      // Get transactions with timeout and limit to first 25 for performance
      await this.enforceRateLimit(); // Rate limit between requests
      
      const txController = new AbortController();
      const txTimeout = setTimeout(() => {
        console.log('⚠️ Bitcoin transactions request timeout, aborting...');
        txController.abort();
      }, 20000);
      
      const txResponse = await fetch(`${this.BLOCKSTREAM_BASE_URL}/address/${address}/txs`, {
        signal: txController.signal,
        headers: {
          'User-Agent': 'Rian-Blockchain-Intelligence/1.0',
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(txTimeout);
      
      const transactions: BlockstreamTransaction[] = txResponse.ok ? await txResponse.json() : [];
      console.log(`📊 Bitcoin transactions received: ${transactions.length}`);
      
      const totalStats = {
        funded: addressInfo.chain_stats.funded_txo_sum + addressInfo.mempool_stats.funded_txo_sum,
        spent: addressInfo.chain_stats.spent_txo_sum + addressInfo.mempool_stats.spent_txo_sum,
        txCount: addressInfo.chain_stats.tx_count + addressInfo.mempool_stats.tx_count
      };

      const result = {
        balance: (totalStats.funded - totalStats.spent) / 100000000, // Convert satoshis to BTC
        totalReceived: totalStats.funded / 100000000,
        totalSent: totalStats.spent / 100000000,
        transactionCount: totalStats.txCount,
        transactions: transactions.slice(0, 25) // Limit for performance
      };

      console.log(`✅ [BITCOIN LIVE] Real-time data retrieved:`, {
        balance: result.balance,
        txCount: result.transactionCount,
        totalReceived: result.totalReceived
      });

      void this.setCached('bitcoin', address, result);
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Bitcoin API request timed out. Please try again.');
      }
      console.error('❌ [BITCOIN] Live API failed:', error);
      throw error; // Don't fall back, throw the error
    }
  }

  // Ethereum API integration using Etherscan
  async getEthereumAddressData(address: string): Promise<{
    balance: number;
    transactionCount: number;
    transactions: EthereumTransaction[];
    tokenTransfers: any[];
  }> {
    if (!this.isValidEthereumAddress(address)) {
      throw new Error(`Invalid Ethereum address format: ${address}`);
    }

    const cached = await this.getCached<{
      balance: number; transactionCount: number;
      transactions: EthereumTransaction[]; tokenTransfers: any[];
    }>('ethereum', address);
    if (cached) return cached;

    await this.enforceRateLimit();

    try {
      console.log(`🔍 [ETHEREUM LIVE] Fetching real-time data for: ${address}`);

      console.log('📡 Making parallel proxied calls to Etherscan V2...');

      const [balanceResult, txResult, tokenResult] = await Promise.allSettled([
        this.etherscanProxy({ module: 'account', action: 'balance', address, chainid: 1 }),
        this.etherscanProxy({
          module: 'account', action: 'txlist', address, chainid: 1,
          page: 1, offset: 25, sort: 'desc',
        }),
        this.etherscanProxy({
          module: 'account', action: 'tokentx', address, chainid: 1,
          page: 1, offset: 25, sort: 'desc',
        }),
      ]);

      const balanceData = balanceResult.status === 'fulfilled'
        ? balanceResult.value
        : { status: '0', message: 'Balance request failed', result: '0' } as EtherscanResponse;

      if (balanceData.status !== '1') {
        console.warn('⚠️ Balance API warning:', balanceData.message);
      }

      const txData = txResult.status === 'fulfilled'
        ? txResult.value
        : { status: '0', message: 'Transactions request failed', result: [] } as EtherscanResponse;

      const tokenData = tokenResult.status === 'fulfilled'
        ? tokenResult.value
        : { status: '0', message: 'Token transfers request failed', result: [] } as EtherscanResponse;

      console.log('📊 Token transfers status:', tokenData.status, 'count:', tokenData.result?.length || 0);

      const result = {
        balance: parseInt(balanceData.result || '0') / 1e18,
        transactionCount: txData.status === '1' ? txData.result.length : 0,
        transactions: txData.status === '1' ? txData.result.slice(0, 25) : [],
        tokenTransfers: tokenData.status === '1' ? tokenData.result.slice(0, 25) : [],
      };

      console.log(`✅ [ETHEREUM LIVE] Real-time data retrieved:`, {
        balance: result.balance,
        txCount: result.transactionCount,
        tokenTransfers: result.tokenTransfers.length,
      });

      void this.setCached('ethereum', address, result);
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Ethereum API request timed out. Please try again.');
      }
      console.error('❌ [ETHEREUM] Live API failed:', error);
      throw error;
    }
  }

  private isValidBitcoinAddress(address: string): boolean {
    // Legacy (P2PKH): start with 1
    if (address.match(/^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/)) return true;
    // Script (P2SH): start with 3
    if (address.match(/^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/)) return true;
    // Bech32: start with bc1
    if (address.match(/^bc1[a-z0-9]{39,59}$/)) return true;
    return false;
  }

  private isValidEthereumAddress(address: string): boolean {
    return address.match(/^0x[a-fA-F0-9]{40}$/) !== null;
  }

  private isValidSolanaAddress(address: string): boolean {
    return address.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/) !== null;
  }

  // Solana API integration using public RPC
  async getSolanaAddressData(address: string): Promise<{
    balance: number;
    transactionCount: number;
    transactions: any[];
    tokenAccounts: any[];
  }> {
    await this.enforceRateLimit();
    
    try {
      console.log(`🔍 [SOLANA LIVE] Fetching real-time data for: ${address}`);
      
      // Validate Solana address format
      if (!this.isValidSolanaAddress(address)) {
        throw new Error(`Invalid Solana address format: ${address}`);
      }
      
      // Multiple reliable Solana RPC endpoints to handle 403 errors
      const rpcEndpoints = [
        'https://solana.publicnode.com',
        'https://rpc.ankr.com/solana',
        'https://api.mainnet-beta.solana.com',
        'https://solana-api.projectserum.com'
      ];
      const timeout = 4000;
      
      let lastError = null;
      
      for (const rpcUrl of rpcEndpoints) {
        try {
          console.log(`🔗 Trying Solana RPC: ${rpcUrl}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          // Single parallel request for only essential data
          const [balanceResponse, signaturesResponse] = await Promise.all([
            fetch(rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getBalance',
                params: [address]
              })
            }),
            fetch(rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 2,
                method: 'getSignaturesForAddress',
                params: [address, { limit: 2 }]
              })
            })
          ]);

          clearTimeout(timeoutId);

          if (!balanceResponse.ok) {
            throw new Error(`Solana RPC failed: ${balanceResponse.status}`);
          }

          const balanceData = await balanceResponse.json();
          const signaturesData = signaturesResponse.ok ? await signaturesResponse.json() : { result: [] };
          
          const result = {
            balance: balanceData.result?.value ? (balanceData.result.value / 1e9) : 0,
            transactionCount: signaturesData.result?.length || 0,
            transactions: signaturesData.result || [],
            tokenAccounts: []
          };
          
          console.log(`✅ [SOLANA LIVE] Success with ${rpcUrl}:`, {
            balance: result.balance,
            txCount: result.transactionCount
          });
          
          return result;
          
        } catch (error) {
          lastError = error;
          console.warn(`❌ ${rpcUrl} failed:`, error);
          continue;
        }
      }
      
      throw new Error(`All Solana RPCs failed. Last error: ${lastError?.message}`);
    } catch (error) {
      console.error('❌ [SOLANA] All endpoints failed:', error);
      throw error;
    }
  }

  // Helper method to generate consistent hash from address
  private hashAddress(address: string): number {
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      const char = address.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Risk calculation based on real blockchain data

  calculateRealRiskScore(networkData: any, network: 'bitcoin' | 'ethereum' | 'solana'): {
    riskScore: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    riskFactors: Record<string, boolean>;
    explanation: string;
  } {
    let riskScore = 0;
    const riskFactors = {
      sanctioned: false,
      fraud_reports: false,
      dark_market_exposure: false,
      mixer_usage: false,
      high_frequency_trading: false
    };

    // Network-specific transaction volume risk assessment
    const txCount = networkData.transactionCount || networkData.transactions?.length || 0;
    
    if (network === 'solana') {
      // Solana-specific thresholds (lower due to different usage patterns)
      if (txCount > 500) {
        riskScore += 4;
        riskFactors.high_frequency_trading = true;
      } else if (txCount > 100) {
        riskScore += 2;
        riskFactors.high_frequency_trading = true;
      } else if (txCount > 20) {
        riskScore += 1;
      }
    } else {
      // Bitcoin/Ethereum thresholds (unchanged)
      if (txCount > 10000) {
        riskScore += 4;
        riskFactors.high_frequency_trading = true;
      } else if (txCount > 1000) {
        riskScore += 2;
        riskFactors.high_frequency_trading = true;
      } else if (txCount > 100) {
        riskScore += 1;
      }
    }

    // Network-specific balance risk assessment
    const balance = networkData.balance || 0;
    
    if (network === 'bitcoin') {
      if (balance > 100) riskScore += 3;
      else if (balance > 10) riskScore += 1;
    } else if (network === 'ethereum') {
      if (balance > 1000) riskScore += 3;
      else if (balance > 100) riskScore += 1;
    } else if (network === 'solana') {
      // Solana-specific balance thresholds (lower due to price difference)
      if (balance > 50) riskScore += 3;
      else if (balance > 10) riskScore += 1;
      
      // Additional Solana-specific risk factors
      const tokenCount = networkData.tokenAccounts?.length || 0;
      if (tokenCount > 20) {
        riskScore += 2; // Many tokens could indicate trading/mixing activity
      } else if (tokenCount > 10) {
        riskScore += 1;
      }
      
      // Recent activity bonus for Solana (more weight given to active addresses)
      if (txCount > 5 && balance > 1) {
        riskScore += 1; // Active address with meaningful balance
      }
    }

    // Pattern analysis for potential mixing behavior
    if (networkData.transactions && txCount > 20) {
      // For Bitcoin: Look for many small outputs (potential mixing)
      if (network === 'bitcoin') {
        const smallTxCount = networkData.transactions.filter((tx: any) => 
          tx.vout && tx.vout.some((out: any) => out.value < 1000000) // < 0.01 BTC
        ).length;
        
        if (smallTxCount > txCount * 0.7) {
          riskScore += 3;
          riskFactors.mixer_usage = true;
        }
      }
      
      // For Ethereum: Look for round number transactions (potential mixing)
      if (network === 'ethereum') {
        const roundTxCount = networkData.transactions.filter((tx: any) => {
          const value = parseInt(tx.value) / 1e18;
          return value === Math.round(value) && value > 0; // Round numbers
        }).length;
        
        if (roundTxCount > txCount * 0.5) {
          riskScore += 2;
          riskFactors.mixer_usage = true;
        }
      }
      
      // For Solana: Look for high frequency small transactions
      if (network === 'solana') {
        // Solana signatures don't contain value data, so we use frequency as indicator
        if (txCount > 100 && networkData.tokenAccounts?.length > 10) {
          riskScore += 2;
          riskFactors.mixer_usage = true;
        }
      }
    }

    // Very high frequency trading pattern
    if (txCount > 50000) {
      riskScore += 2;
      riskFactors.dark_market_exposure = true; // High volume could indicate exchange or marketplace
    }

    // Determine risk level
    let riskLevel: 'Low' | 'Medium' | 'High';
    if (riskScore >= 6) riskLevel = 'High';
    else if (riskScore >= 3) riskLevel = 'Medium';
    else riskLevel = 'Low';

    const explanation = `Real-time blockchain analysis of ${network} address shows ${riskLevel.toLowerCase()} risk indicators. Analyzed ${txCount} transactions with current balance of ${balance.toFixed(6)} ${network.toUpperCase()}. Risk factors include transaction patterns, volume analysis, and behavioral indicators.`;

    return {
      riskScore: Math.min(riskScore, 10),
      riskLevel,
      riskFactors,
      explanation
    };
  }

  // Entity attribution based on real data patterns
  deriveEntityAttribution(networkData: any, network: 'bitcoin' | 'ethereum' | 'solana'): {
    name: string;
    type: string;
    risk_level: string;
    confidence: number;
  } {
    const txCount = networkData.transactionCount || networkData.transactions?.length || 0;
    const balance = networkData.balance || 0;

    // Enhanced entity classification based on real transaction patterns
    if (txCount > 100000) {
      return {
        name: 'Major Exchange or Service',
        type: 'exchange',
        risk_level: 'Medium',
        confidence: 0.85
      };
    } else if (txCount > 10000) {
      return {
        name: 'Commercial Exchange',
        type: 'exchange',
        risk_level: 'Medium',
        confidence: 0.75
      };
    } else if (txCount > 1000 && balance > (network === 'bitcoin' ? 10 : network === 'ethereum' ? 100 : 1000)) {
      return {
        name: 'Institutional Wallet',
        type: 'custodial',
        risk_level: 'Low',
        confidence: 0.65
      };
    } else if (balance > (network === 'bitcoin' ? 100 : network === 'ethereum' ? 1000 : 10000)) {
      return {
        name: 'High-Value Wallet',
        type: 'private',
        risk_level: 'Medium',
        confidence: 0.6
      };
    } else if (txCount > 500) {
      return {
        name: 'Active Trading Wallet',
        type: 'private',
        risk_level: 'Low',
        confidence: 0.55
      };
    } else {
      return {
        name: 'Personal Wallet',
        type: 'private',
        risk_level: 'Low',
        confidence: 0.45
      };
    }
  }

  calculateVolumeMetrics(networkData: any, network: 'bitcoin' | 'ethereum' | 'solana') {
    const balance = networkData.balance || 0;
    const txCount = networkData.transactionCount || networkData.transactions?.length || 0;

    // Only report volumes the chain actually gave us. No estimates, no
    // hardcoded market prices — an unknown figure is reported as unknown.
    const inboundVolume =
      typeof networkData.totalReceived === 'number' ? networkData.totalReceived : undefined;
    const outboundVolume =
      typeof networkData.totalSent === 'number' ? networkData.totalSent : undefined;

    const knownVolume =
      inboundVolume !== undefined && outboundVolume !== undefined
        ? inboundVolume + outboundVolume
        : undefined;

    return {
      lifetime_value: {
        inbound: inboundVolume,
        outbound: outboundVolume,
        net: balance,
        usd_equivalent: undefined as number | undefined
      },
      average_transaction_size:
        knownVolume !== undefined && txCount > 0 ? knownVolume / (txCount * 2) : undefined
    };
  }

}

export const realBlockchainAPI = new RealBlockchainAPI();
