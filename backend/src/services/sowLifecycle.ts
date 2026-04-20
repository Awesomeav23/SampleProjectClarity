/**
 * SOW Lifecycle Service
 *
 * Orchestrates the full SOW lifecycle after approval:
 *   1. Generate SOW document (placeholder — real implementation would use a template engine)
 *   2. Upload to SharePoint
 *   3. Create DocuSign envelope for multi-party signature
 *   4. On signature completion: mark SOW as signed, lock baseline allocations
 *
 * Each step uses the service provider so mock/real clients swap transparently.
 */

import { db } from '../lib/db.js';
import { logger } from '../lib/logger.js';
import { services } from './index.js';
import { SHAREPOINT_FOLDERS } from './sharepointClient.js';

// ─── Step 1: Generate Document ─────────────────────────────────────────────────

export async function generateSOWDocument(sowId: string): Promise<string> {
  const sow = await db('sows')
    .select('sows.*', 'customers.name as customer_name')
    .join('customers', 'sows.customer_id', 'customers.id')
    .where('sows.id', sowId)
    .first();

  if (!sow) throw new Error(`SOW ${sowId} not found`);

  // In a real implementation, this would use a template engine (Handlebars, etc.)
  // to generate a PDF/Word document from the SOW data and template.
  // For now, we create a placeholder content string.
  const documentContent = `SOW Document: ${sow.title}\nCustomer: ${sow.customer_name}\nValue: $${sow.total_value}\nPeriod: ${sow.start_date} to ${sow.end_date}`;

  logger.info({ sowId }, 'SOW document generated');
  return documentContent;
}

// ─── Step 2: Upload to SharePoint ──────────────────────────────────────────────

export async function uploadSOWToSharePoint(sowId: string, documentContent: string): Promise<string> {
  const sow = await db('sows')
    .select('sows.*', 'customers.name as customer_name')
    .join('customers', 'sows.customer_id', 'customers.id')
    .where('sows.id', sowId)
    .first();

  if (!sow) throw new Error(`SOW ${sowId} not found`);

  const fileName = `${sowId}-${sow.customer_name.replace(/\s+/g, '')}.pdf`;

  const doc = await services.sharepoint.uploadDocument({
    fileName,
    folderPath: SHAREPOINT_FOLDERS.SOWS,
    content: documentContent,
    metadata: {
      sowId: sow.id,
      customerId: sow.customer_id,
      customerName: sow.customer_name,
      status: 'pending_signature',
      type: sow.type,
    },
    createdBy: sow.created_by,
    comment: 'Generated for DocuSign signature',
  });

  // Update SOW with SharePoint URL
  await db('sows').where('id', sowId).update({
    sharepoint_doc_url: doc.fullUrl,
    updated_at: new Date().toISOString(),
  });

  logger.info({ sowId, url: doc.fullUrl }, 'SOW uploaded to SharePoint');
  return doc.fullUrl;
}

// ─── Step 3: Create DocuSign Envelope ──────────────────────────────────────────

export async function createDocuSignEnvelope(sowId: string): Promise<string> {
  const sow = await db('sows')
    .select('sows.*', 'customers.name as customer_name', 'customers.primary_contact_name', 'customers.primary_contact_email')
    .join('customers', 'sows.customer_id', 'customers.id')
    .where('sows.id', sowId)
    .first();

  if (!sow) throw new Error(`SOW ${sowId} not found`);

  const envelope = await services.docusign.createEnvelope({
    sowId: sow.id,
    sowTitle: sow.title,
    documentUrl: sow.sharepoint_doc_url ?? '',
    signers: [
      {
        name: sow.primary_contact_name ?? 'Customer Contact',
        email: sow.primary_contact_email ?? 'customer@example.com',
        role: 'customer',
        routingOrder: 1,
      },
      {
        name: 'DynPro Leadership',
        email: sow.approved_by ?? 'leadership@dynpro.com',
        role: 'dynpro_leadership',
        routingOrder: 2,
      },
    ],
    emailSubject: `Please sign: ${sow.title}`,
    emailBody: `The SOW "${sow.title}" for ${sow.customer_name} is ready for your signature.`,
  });

  // Update SOW with envelope ID
  await db('sows').where('id', sowId).update({
    docusign_envelope_id: envelope.envelopeId,
    updated_at: new Date().toISOString(),
  });

  // Audit log
  await db('audit_log').insert({
    entity_type: 'sow',
    entity_id: sowId,
    action: 'docusign_sent',
    actor_id: 'system',
    actor_email: 'system@dynpro.com',
    changes: JSON.stringify({ envelopeId: envelope.envelopeId, status: 'sent' }),
  });

  logger.info({ sowId, envelopeId: envelope.envelopeId }, 'DocuSign envelope created');
  return envelope.envelopeId;
}

// ─── Step 4: Handle Signature Completion ───────────────────────────────────────

export async function handleSignatureCompleted(envelopeId: string): Promise<void> {
  // Find the SOW for this envelope
  const sow = await db('sows').where('docusign_envelope_id', envelopeId).first();
  if (!sow) {
    logger.warn({ envelopeId }, 'No SOW found for completed envelope');
    return;
  }

  // Update SOW status to signed
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  await db('sows').where('id', sow.id).update({
    status: 'signed',
    signed_date: today,
    effective_date: sow.effective_date ?? today,
    updated_at: now,
  });

  // Lock all execution allocations for this project as baseline
  if (sow.project_id) {
    const allocations = await db('resource_allocations')
      .where('project_id', sow.project_id)
      .andWhere('type', 'execution');

    for (const alloc of allocations) {
      await db('resource_allocations').where('id', alloc.id).update({
        type: 'baseline',
        updated_at: now,
      });
    }

    logger.info({ sowId: sow.id, projectId: sow.project_id, locked: allocations.length }, 'Baseline allocations locked');
  }

  // Update SharePoint document metadata
  if (sow.sharepoint_doc_url) {
    const docs = await services.sharepoint.searchDocuments({ sowId: sow.id });
    if (docs.length > 0) {
      await services.sharepoint.uploadDocument({
        fileName: docs[0].name,
        folderPath: SHAREPOINT_FOLDERS.SIGNED,
        content: `Signed SOW: ${sow.title}`,
        metadata: { ...docs[0].metadata, status: 'signed', signedDate: today },
        createdBy: 'system@dynpro.com',
        comment: 'Moved to signed folder after DocuSign completion',
      });
    }
  }

  // Audit log
  await db('audit_log').insert({
    entity_type: 'sow',
    entity_id: sow.id,
    action: 'signed',
    actor_id: 'system',
    actor_email: 'system@dynpro.com',
    changes: JSON.stringify({ status: 'signed', signedDate: today, envelopeId }),
  });

  logger.info({ sowId: sow.id, envelopeId }, 'SOW signed — baseline locked');
}

// ─── Step 5: Handle Signature Declined ─────────────────────────────────────────

export async function handleSignatureDeclined(envelopeId: string, declinedBy: string): Promise<void> {
  const sow = await db('sows').where('docusign_envelope_id', envelopeId).first();
  if (!sow) return;

  // Revert SOW to approved (needs re-sending)
  await db('sows').where('id', sow.id).update({
    status: 'approved',
    docusign_envelope_id: null,
    updated_at: new Date().toISOString(),
  });

  await db('audit_log').insert({
    entity_type: 'sow',
    entity_id: sow.id,
    action: 'signature_declined',
    actor_id: 'system',
    actor_email: 'system@dynpro.com',
    changes: JSON.stringify({ declinedBy, envelopeId, status: 'approved' }),
  });

  logger.warn({ sowId: sow.id, envelopeId, declinedBy }, 'SOW signature declined');
}

// ─── Full Lifecycle Trigger (called after SOW approval) ────────────────────────

export async function triggerSOWSignatureFlow(sowId: string): Promise<{
  documentUrl: string;
  envelopeId: string;
}> {
  // Step 1: Generate document
  const content = await generateSOWDocument(sowId);

  // Step 2: Upload to SharePoint
  const documentUrl = await uploadSOWToSharePoint(sowId, content);

  // Step 3: Create DocuSign envelope
  const envelopeId = await createDocuSignEnvelope(sowId);

  return { documentUrl, envelopeId };
}
