import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { notFound } from '../lib/AppError.js';
import { logger } from '../lib/logger.js';
import {
  triggerSOWSignatureFlow,
  handleSignatureCompleted,
  handleSignatureDeclined,
} from '../services/sowLifecycle.js';
import { services } from '../services/index.js';
import { db } from '../lib/db.js';

const router = Router();

/**
 * POST /api/docusign/webhook
 * Receives DocuSign Connect webhook events.
 * In production, this would validate the webhook signature.
 * No auth required — DocuSign calls this directly.
 */
router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const { eventType, envelopeId, recipientEmail, recipientName } = req.body;

    logger.info({ eventType, envelopeId, recipientEmail }, 'DocuSign webhook received');

    switch (eventType) {
      case 'envelope-completed':
        await handleSignatureCompleted(envelopeId);
        break;

      case 'recipient-declined':
        await handleSignatureDeclined(envelopeId, recipientEmail ?? 'unknown');
        break;

      case 'recipient-signed':
        logger.info({ envelopeId, recipientName, recipientEmail }, 'Recipient signed');
        break;

      case 'envelope-sent':
      case 'envelope-delivered':
        logger.info({ envelopeId, eventType }, 'DocuSign envelope event');
        break;

      default:
        logger.warn({ eventType, envelopeId }, 'Unknown DocuSign event type');
    }

    res.json({ received: true });
  })
);

/**
 * POST /api/docusign/send/:sowId
 * Trigger the full signature flow for an approved SOW.
 * Generates document → uploads to SharePoint → creates DocuSign envelope.
 */
router.post(
  '/send/:sowId',
  verifyJWT,
  requirePermission('sow:approve'),
  asyncHandler(async (req, res) => {
    const sowId = req.params.sowId as string;

    const sow = await db('sows').where('id', sowId).first();
    if (!sow) throw notFound(`SOW ${sowId} not found`);

    if (sow.status !== 'approved') {
      throw notFound(`SOW ${sowId} must be approved before sending for signature (current: ${sow.status})`);
    }

    if (sow.docusign_envelope_id) {
      throw notFound(`SOW ${sowId} already has a DocuSign envelope: ${sow.docusign_envelope_id}`);
    }

    const result = await triggerSOWSignatureFlow(sowId);

    res.json({
      sowId,
      status: 'sent_for_signature',
      documentUrl: result.documentUrl,
      envelopeId: result.envelopeId,
    });
  })
);

/**
 * GET /api/docusign/status/:envelopeId
 * Check the status of a DocuSign envelope.
 */
router.get(
  '/status/:envelopeId',
  verifyJWT,
  requirePermission('sow:read'),
  asyncHandler(async (req, res) => {
    const envelopeId = req.params.envelopeId as string;
    const envelope = await services.docusign.getEnvelopeStatus(envelopeId);
    if (!envelope) throw notFound(`Envelope ${envelopeId} not found`);
    res.json(envelope);
  })
);

/**
 * POST /api/docusign/simulate/:envelopeId
 * DEV ONLY — Simulate a signer action (sign or decline) for testing.
 */
router.post(
  '/simulate/:envelopeId',
  verifyJWT,
  requirePermission('sow:approve'),
  asyncHandler(async (req, res) => {
    const envelopeId = req.params.envelopeId as string;
    const { signerEmail, action } = req.body;

    if (!signerEmail || !['sign', 'decline'].includes(action)) {
      throw notFound('Required: signerEmail and action (sign|decline)');
    }

    const result = await services.docusign.simulateSignerAction(envelopeId, signerEmail, action);
    if (!result.success) throw notFound(`Could not simulate action on envelope ${envelopeId}`);

    // Process any webhook events that would normally come from DocuSign
    for (const event of result.events) {
      if (event.eventType === 'envelope-completed') {
        await handleSignatureCompleted(envelopeId);
      } else if (event.eventType === 'recipient-declined') {
        await handleSignatureDeclined(envelopeId, event.recipientEmail ?? 'unknown');
      }
    }

    res.json({
      envelopeId,
      envelope: result.envelope,
      events: result.events,
    });
  })
);

export default router;
