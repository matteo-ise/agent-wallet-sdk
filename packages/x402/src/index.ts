import { AgentIdentity, PaymentRequest, PaymentResult } from '@agent-wallet-sdk/core';
import nacl from 'tweetnacl';
import { encodeBase64, decodeUTF8 } from 'tweetnacl-util';

export class X402Client {
  private identity: AgentIdentity;
  private keyPair: nacl.SignKeyPair;

  constructor(identity: AgentIdentity, privateKeyHex: string) {
    this.identity = identity;
    const secretKey = new Uint8Array(Buffer.from(privateKeyHex, 'hex'));
    this.keyPair = nacl.sign.keyPair.fromSecretKey(secretKey);
  }

  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    let response = await fetch(url, options);

    if (response.status === 402) {
      const authHeader = response.headers.get('www-authenticate');
      if (authHeader && (authHeader.startsWith('L402') || authHeader.startsWith('X402'))) {
        const paymentProof = await this.handlePaymentChallenge(authHeader);
        
        const newOptions = {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': paymentProof
          }
        };
        
        response = await fetch(url, newOptions);
      }
    }

    return response;
  }

  private async handlePaymentChallenge(challenge: string): Promise<string> {
    // Parse challenge, e.g., L402 macaroon=... invoice=...
    // In a real implementation, this would interact with a crypto wallet
    // or Lightning node to pay the invoice and retrieve the preimage.
    
    console.log(`[X402] Handling challenge: ${challenge}`);
    
    // Simulating payment and proof generation
    const fakePreimage = 'fake_preimage_for_demo';
    const fakeMacaroon = 'fake_macaroon_data';
    
    // Create a cryptographic proof of identity tying the payment to this agent
    const message = decodeUTF8(`x402_proof_${Date.now()}`);
    const signature = nacl.sign(message, this.keyPair.secretKey);
    const sigBase64 = encodeBase64(signature);

    return `X402 macaroon="${fakeMacaroon}", preimage="${fakePreimage}", agent_sig="${sigBase64}"`;
  }
}
