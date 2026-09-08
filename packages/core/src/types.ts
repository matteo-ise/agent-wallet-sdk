export interface AgentWallet {
  readonly id: string;
  readonly provider: 'stripe' | 'coinbase' | 'crossmint' | 'manual';
  readonly identity: AgentIdentity;

  getBalance(): Promise<Balance>;
  pay(request: PaymentRequest): Promise<PaymentResult>;
  preauthorize(mandate: SpendingMandate): Promise<MandateToken>;
  getTransactionHistory(filter?: TransactionFilter): Promise<Transaction[]>;
}

export interface Balance {
  amount: number;
  currency: 'EUR' | 'USD' | 'USDC';
}

export interface PaymentRequest {
  amount: number;
  currency: 'EUR' | 'USD' | 'USDC';
  recipient: string;
  description: string;
  metadata?: Record<string, unknown>;
  require_approval?: boolean;
}

export interface PaymentResult {
  transaction_id: string;
  status: 'success' | 'pending' | 'failed' | 'requires_approval';
  amount: number;
  currency: 'EUR' | 'USD' | 'USDC';
  timestamp: string;
  receipt_url?: string;
  error?: string;
}

export interface SpendingMandate {
  max_amount_per_tx: number;
  max_amount_per_day: number;
  max_amount_per_month: number;
  allowed_merchants?: string[];
  allowed_categories?: string[];
  expires_at: string; // ISO8601
  require_approval_above?: number;
}

export interface MandateToken {
  token: string;
  mandate: SpendingMandate;
  expires_at: string;
}

export interface TransactionFilter {
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: 'EUR' | 'USD' | 'USDC';
  recipient: string;
  status: 'success' | 'pending' | 'failed';
  timestamp: string;
}

export interface AgentIdentity {
  agent_id: string;
  agent_name: string;
  principal_id: string;
  principal_name: string;
  public_key: string;
  capabilities: string[];
  created_at: string; // ISO8601
  signature: string;
}
