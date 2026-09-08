import { AgentWallet, AgentIdentity, Balance, PaymentRequest, PaymentResult, SpendingMandate, MandateToken, TransactionFilter, Transaction } from '@agent-wallet-sdk/core';
import Stripe from 'stripe';

export class StripeAgentWallet implements AgentWallet {
  public readonly provider = 'stripe';
  private stripe: Stripe;

  constructor(
    public readonly id: string,
    public readonly identity: AgentIdentity,
    stripeSecretKey: string
  ) {
    this.stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
  }

  async getBalance(): Promise<Balance> {
    const balance = await this.stripe.balance.retrieve();
    return {
      amount: balance.available[0]?.amount / 100 || 0,
      currency: balance.available[0]?.currency.toUpperCase() as 'EUR' | 'USD' | 'USDC' || 'USD'
    };
  }

  async pay(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100),
        currency: request.currency.toLowerCase(),
        description: request.description,
        metadata: {
          ...request.metadata as Record<string, string>,
          agent_id: this.identity.agent_id,
          principal_id: this.identity.principal_id
        },
        confirm: true,
        payment_method_data: {
          type: 'customer_balance' // Simplified for agent representation
        }
      });

      return {
        transaction_id: intent.id,
        status: intent.status === 'succeeded' ? 'success' : 'pending',
        amount: request.amount,
        currency: request.currency,
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
    // In Stripe, a mandate might map to an Issuing Authorization or a setup intent
    // depending on if it's agent-to-merchant or virtual card creation.
    return {
      token: `stripe_mandate_${Date.now()}`,
      mandate,
      expires_at: mandate.expires_at
    };
  }

  async getTransactionHistory(filter?: TransactionFilter): Promise<Transaction[]> {
    const charges = await this.stripe.charges.list({
      limit: filter?.limit || 10,
    });

    return charges.data.map(charge => ({
      id: charge.id,
      amount: charge.amount / 100,
      currency: charge.currency.toUpperCase() as 'EUR' | 'USD' | 'USDC',
      recipient: charge.destination as string || 'unknown',
      status: charge.status === 'succeeded' ? 'success' : charge.status === 'pending' ? 'pending' : 'failed',
      timestamp: new Date(charge.created * 1000).toISOString()
    }));
  }
}
