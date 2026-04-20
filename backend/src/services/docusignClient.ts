/**
 * DocuSign Mock Client
 *
 * Simulates DocuSign REST API for SOW e-signature workflows.
 * Swap with real DocuSign SDK when credentials are available.
 *
 * Capabilities:
 *   - Create signature envelopes for SOWs
 *   - Multi-signer routing (customer + DynPro leadership)
 *   - Status tracking and webhook event simulation
 *   - Capture signed date and effective date
 */

import { nanoid } from 'nanoid';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DocuSignSigner {
  name: string;
  email: string;
  role: 'customer' | 'dynpro_leadership' | 'dynpro_legal';
  routingOrder: number; // 1 = first signer, 2 = second, etc.
}

export interface CreateEnvelopeInput {
  sowId: string;
  sowTitle: string;
  documentUrl: string; // SharePoint URL or local path to the SOW PDF
  signers: DocuSignSigner[];
  emailSubject?: string;
  emailBody?: string;
}

export interface DocuSignEnvelope {
  envelopeId: string;
  sowId: string;
  status: 'created' | 'sent' | 'delivered' | 'signed' | 'completed' | 'declined' | 'voided';
  signers: DocuSignSignerStatus[];
  createdAt: string;
  sentAt: string | null;
  completedAt: string | null;
  documentUrl: string;
}

export interface DocuSignSignerStatus {
  name: string;
  email: string;
  role: string;
  routingOrder: number;
  status: 'pending' | 'sent' | 'delivered' | 'signed' | 'declined';
  signedAt: string | null;
}

export interface DocuSignWebhookEvent {
  eventType: 'envelope-sent' | 'envelope-delivered' | 'recipient-signed' | 'envelope-completed' | 'recipient-declined';
  envelopeId: string;
  timestamp: string;
  recipientEmail?: string;
  recipientName?: string;
}

// ─── In-Memory Store ───────────────────────────────────────────────────────────

const envelopes = new Map<string, DocuSignEnvelope>();

// ─── API Methods ───────────────────────────────────────────────────────────────

export async function createEnvelope(input: CreateEnvelopeInput): Promise<DocuSignEnvelope> {
  await simulateLatency();

  const envelopeId = `DS-ENV-${nanoid(8).toUpperCase()}`;
  const now = new Date().toISOString();

  const envelope: DocuSignEnvelope = {
    envelopeId,
    sowId: input.sowId,
    status: 'sent',
    signers: input.signers.map((s) => ({
      ...s,
      status: s.routingOrder === 1 ? 'sent' : 'pending',
      signedAt: null,
    })),
    createdAt: now,
    sentAt: now,
    completedAt: null,
    documentUrl: input.documentUrl,
  };

  envelopes.set(envelopeId, envelope);
  console.log(`[DOCUSIGN MOCK] Envelope ${envelopeId} created for SOW ${input.sowId}`);
  console.log(`[DOCUSIGN MOCK] Sent to first signer: ${input.signers[0]?.email}`);

  return envelope;
}

export async function getEnvelopeStatus(envelopeId: string): Promise<DocuSignEnvelope | null> {
  await simulateLatency();
  return envelopes.get(envelopeId) ?? null;
}

export async function simulateSignerAction(
  envelopeId: string,
  signerEmail: string,
  action: 'sign' | 'decline'
): Promise<{ success: boolean; envelope: DocuSignEnvelope | null; events: DocuSignWebhookEvent[] }> {
  await simulateLatency();

  const envelope = envelopes.get(envelopeId);
  if (!envelope) {
    return { success: false, envelope: null, events: [] };
  }

  const signer = envelope.signers.find((s) => s.email === signerEmail);
  if (!signer) {
    return { success: false, envelope: null, events: [] };
  }

  const now = new Date().toISOString();
  const events: DocuSignWebhookEvent[] = [];

  if (action === 'sign') {
    signer.status = 'signed';
    signer.signedAt = now;
    events.push({
      eventType: 'recipient-signed',
      envelopeId,
      timestamp: now,
      recipientEmail: signerEmail,
      recipientName: signer.name,
    });

    // Advance to next signer if any
    const nextSigner = envelope.signers.find((s) => s.status === 'pending');
    if (nextSigner) {
      nextSigner.status = 'sent';
      events.push({
        eventType: 'envelope-delivered',
        envelopeId,
        timestamp: now,
        recipientEmail: nextSigner.email,
        recipientName: nextSigner.name,
      });
    }

    // Check if all signed
    const allSigned = envelope.signers.every((s) => s.status === 'signed');
    if (allSigned) {
      envelope.status = 'completed';
      envelope.completedAt = now;
      events.push({ eventType: 'envelope-completed', envelopeId, timestamp: now });
      console.log(`[DOCUSIGN MOCK] Envelope ${envelopeId} fully signed!`);
    }
  } else {
    signer.status = 'declined';
    envelope.status = 'declined';
    events.push({
      eventType: 'recipient-declined',
      envelopeId,
      timestamp: now,
      recipientEmail: signerEmail,
      recipientName: signer.name,
    });
    console.log(`[DOCUSIGN MOCK] Envelope ${envelopeId} declined by ${signerEmail}`);
  }

  return { success: true, envelope, events };
}

export async function voidEnvelope(
  envelopeId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  await simulateLatency();

  const envelope = envelopes.get(envelopeId);
  if (!envelope) {
    return { success: false, error: `Envelope ${envelopeId} not found` };
  }

  if (envelope.status === 'completed') {
    return { success: false, error: 'Cannot void a completed envelope' };
  }

  envelope.status = 'voided';
  console.log(`[DOCUSIGN MOCK] Envelope ${envelopeId} voided. Reason: ${reason}`);
  return { success: true };
}

export async function listEnvelopes(filters?: {
  sowId?: string;
  status?: DocuSignEnvelope['status'];
}): Promise<DocuSignEnvelope[]> {
  await simulateLatency();

  let results = Array.from(envelopes.values());
  if (filters?.sowId) results = results.filter((e) => e.sowId === filters.sowId);
  if (filters?.status) results = results.filter((e) => e.status === filters.status);
  return results;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function simulateLatency(): Promise<void> {
  const ms = 150 + Math.random() * 250;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
