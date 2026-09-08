import { AgentWallet, AgentIdentity, Balance, PaymentRequest, PaymentResult, SpendingMandate, MandateToken, TransactionFilter, Transaction } from '@agent-wallet-sdk/core';
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';

export class CoinbaseAgentWallet implements AgentWallet {
  public readonly provider = 'coinbase';
  private wallet: Wallet;

  private constructor(
    public readonly id: string,
    public readonly identity: AgentIdentity,
    wallet: Wallet
  ) {
    this.wallet = wallet;
  }

  static async create(id: string, identity: AgentIdentity, apiKeyName: string, privateKey: string): Promise<CoinbaseAgentWallet> {
    Coinbase.configure({ apiKeyName, privateKey });
    const wallet = await Wallet.create({ networkId: 'base-mainnet' });
    return new CoinbaseAgentWallet(id, identity, wallet);
  }

  async getBalance(): Promise<Balance> {
    const balances = await this.wallet.listBalances();
    const usdcBalance = balances.find((b: any) => b.asset === 'usdc'); // type bypass for simplicity
    
    return {
      amount: usdcBalance ? parseFloat(usdcBalance.amount) : 0,
      currency: 'USDC'
    };
  }

  async pay(request: PaymentRequest): Promise<PaymentResult> {
    try {
      if (request.currency !== 'USDC') {
        throw new Error('Coinbase provider currently only supports USDC on Base');
      }

      // Execute on-chain transfer
      const transfer = await this.wallet.createTransfer({
        amount: request.amount,
        assetId: 'usdc',
        destination: request.recipient
      });

      const receipt = await transfer.wait();

      return {
        transaction_id: receipt.getTransactionHash(),
        status: 'success',
        amount: request.amount,
        currency: 'USDC',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        transaction_id: 'unknown',
        status: 'failed',
        amount: request.amount,
        currency: request.currency,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async preauthorize(mandate: SpendingMandate): Promise<MandateToken> {
    // In Coinbase AgentKit context, this could issue a session key
    // with spend limits bound to the smart wallet.
    return {
      token: `cb_session_${Date.now()}`,
      mandate,
      expires_at: mandate.expires_at
    };
  }

  async getTransactionHistory(filter?: TransactionFilter): Promise<Transaction[]> {
    return []; // Placeholder for on-chain indexer integration
  }
}
