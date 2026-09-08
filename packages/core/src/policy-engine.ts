import * as yaml from 'js-yaml';
import { z } from 'zod';
import { readFileSync } from 'fs';

export const PolicySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  rules: z.object({
    max_per_transaction: z.number(),
    max_per_day: z.number(),
    max_per_month: z.number(),
    currency: z.enum(['EUR', 'USD', 'USDC']),
    require_approval_above: z.number().optional(),
    blocked_categories: z.array(z.string()).optional(),
    allowed_categories: z.array(z.string()).optional(),
    allowed_merchants: z.array(z.string()).optional(),
    allowed_hours: z.string().optional(),
    timezone: z.string().optional()
  })
});

export type Policy = z.infer<typeof PolicySchema>;

export class PolicyEngine {
  private policy: Policy;

  constructor(policyInput: string | Policy) {
    if (typeof policyInput === 'string') {
      const parsed = yaml.load(policyInput);
      this.policy = PolicySchema.parse(parsed);
    } else {
      this.policy = PolicySchema.parse(policyInput);
    }
  }

  static fromFile(filePath: string): PolicyEngine {
    const fileContent = readFileSync(filePath, 'utf-8');
    return new PolicyEngine(fileContent);
  }

  getPolicy(): Policy {
    return this.policy;
  }

  evaluateTransaction(amount: number, currency: string, category?: string, merchant?: string): { allowed: boolean; reason?: string; requires_approval?: boolean } {
    if (currency !== this.policy.rules.currency) {
      return { allowed: false, reason: `Currency mismatch. Policy requires ${this.policy.rules.currency}.` };
    }

    if (amount > this.policy.rules.max_per_transaction) {
      return { allowed: false, reason: `Amount exceeds max_per_transaction of ${this.policy.rules.max_per_transaction}.` };
    }

    if (category && this.policy.rules.blocked_categories?.includes(category)) {
      return { allowed: false, reason: `Category ${category} is blocked.` };
    }

    if (this.policy.rules.allowed_categories && category && !this.policy.rules.allowed_categories.includes(category)) {
      return { allowed: false, reason: `Category ${category} is not in allowed list.` };
    }

    if (this.policy.rules.allowed_merchants && merchant && !this.policy.rules.allowed_merchants.includes(merchant)) {
      return { allowed: false, reason: `Merchant ${merchant} is not in allowed list.` };
    }

    const requiresApproval = this.policy.rules.require_approval_above !== undefined && amount >= this.policy.rules.require_approval_above;

    return { allowed: true, requires_approval: requiresApproval };
  }
}
