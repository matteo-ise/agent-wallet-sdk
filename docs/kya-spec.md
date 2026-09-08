# Know Your Agent (KYA) Specification

**Version:** 1.0.0
**Author:** Matteo Ise

## Abstract
Traditional AML/KYC frameworks are designed for human identities. As autonomous agents become economic actors, a new framework is required: Know Your Agent (KYA). This specification details how an autonomous agent establishes a verifiable cryptographic identity, binds itself to a human or organizational principal, and interacts with payment rails in compliance with financial regulations (like the FATF Travel Rule).

## 1. Agent Identity Lifecycle

### 1.1 Key Generation
Each agent generates a unique Ed25519 key pair at initialization. The public key serves as the core identifier (the `agent_id`).
The private key is securely held by the agent (e.g., in a trusted execution environment or local encrypted storage) and never shared.

### 1.2 The KYA Identity Document
The agent creates a self-signed identity document containing:
- `agent_id`: The public key (or a hash thereof).
- `principal_id`: The identifier of the human/organization responsible for the agent.
- `capabilities`: A list of authorized actions (e.g., `["payment:execute", "contract:sign"]`).
- `timestamp`: Creation time.

### 1.3 Principal Binding
To be legally and financially valid, the `principal_id` must counter-sign the agent's identity document. This proves the human/organization authorizes this specific agent to act on its behalf.

## 2. Verification (The Signature Verification)

When an agent initiates a payment, it signs the `PaymentRequest` using its private key. 
The merchant or payment gateway verifies the transaction by:
1. Fetching the agent's KYA Identity Document.
2. Verifying the Principal's counter-signature (to ensure the agent is authorized).
3. Verifying the Agent's signature on the specific `PaymentRequest`.
4. Checking the requested amount against the Agent's Spending Mandate.

## 3. Registration with Payment Providers

Providers like Stripe or Coinbase require the KYA document during the onboarding phase. 
- **Stripe:** The agent is mapped to a specific Customer or Connect account, using the `principal_id` for traditional KYC, while the `agent_id` is used for programmatic session verification.
- **Coinbase / Web3:** The `agent_id` is used to deploy a Smart Account (ERC-7579 / ERC-8211), and the Principal acts as the ultimate recovery or admin key.

## 4. Compliance and FATF Travel Rule

For cross-border or crypto transactions over certain thresholds, the Travel Rule applies. 
The KYA specification ensures that every transaction can mathematically trace back to a KYC-verified Principal, satisfying regulatory requirements while preserving the agent's autonomy for daily operations.
