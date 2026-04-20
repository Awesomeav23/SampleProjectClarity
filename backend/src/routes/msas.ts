import { Router } from 'express';
import { db } from '../lib/db.js';
import { notFound } from '../lib/AppError.js';
import { verifyJWT } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getAutoInjectClauses } from '../services/legalApprovals.js';

const router = Router();
router.use(verifyJWT);

/**
 * GET /api/msas
 * List MSAs. Optional ?customerId=C001 filter.
 */
router.get(
  '/',
  requirePermission('sow:read'),
  asyncHandler(async (req, res) => {
    let query = db('msas')
      .select('msas.*', 'customers.name as customer_name')
      .join('customers', 'msas.customer_id', 'customers.id')
      .orderBy('msas.customer_id');

    if (req.query.customerId) {
      query = query.where('msas.customer_id', req.query.customerId as string);
    }

    const msas = await query;

    // Add clause count for each MSA
    const clauseCounts = await db('msa_clauses')
      .select('msa_id')
      .count('* as clause_count')
      .groupBy('msa_id');

    const countMap = new Map(clauseCounts.map((c: any) => [c.msa_id, parseInt(c.clause_count)]));

    res.json(
      msas.map((m) => ({
        ...m,
        clauseCount: countMap.get(m.id) ?? 0,
      }))
    );
  })
);

/**
 * GET /api/msas/:id/clauses
 * Get MSA clauses with auto-inject/manual-review status.
 * Optional ?templateType=elaborate_tm to filter by SOW template type.
 */
router.get(
  '/:id/clauses',
  requirePermission('sow:read'),
  asyncHandler(async (req, res) => {
    const msa = await db('msas').where('id', req.params.id).first();
    if (!msa) throw notFound(`MSA ${req.params.id} not found`);

    const clauses = await db('msa_clauses')
      .where('msa_id', req.params.id)
      .orderBy('sort_order');

    const templateType = req.query.templateType as string | undefined;

    if (templateType && ['lean_tm', 'elaborate_tm', 'fixed_fee'].includes(templateType)) {
      // Use legal approval rules to categorize clauses
      const approvalResult = getAutoInjectClauses(
        templateType as 'lean_tm' | 'elaborate_tm' | 'fixed_fee',
        msa.customer_id
      );

      const autoInjectIds = new Set(approvalResult.autoInject.map((c) => c.clauseId));
      const manualReviewIds = new Set(approvalResult.manualReview.map((c) => c.clauseId));
      const blockedIds = new Set(approvalResult.blocked.map((c) => c.clauseId));

      const categorized = clauses.map((clause) => {
        // Extract base clause ID (msa_clauses have IDs like "CL-001-MSA-001")
        const baseClauseId = clause.id.split('-').slice(0, 2).join('-');
        let approvalStatus: string;
        if (autoInjectIds.has(baseClauseId)) approvalStatus = 'auto_inject';
        else if (manualReviewIds.has(baseClauseId)) approvalStatus = 'manual_review';
        else if (blockedIds.has(baseClauseId)) approvalStatus = 'blocked';
        else approvalStatus = 'not_applicable';

        return { ...clause, approvalStatus };
      });

      res.json({
        msaId: req.params.id,
        customerId: msa.customer_id,
        templateType,
        clauses: categorized,
        summary: {
          autoInject: categorized.filter((c) => c.approvalStatus === 'auto_inject').map((c) => c.title),
          manualReview: categorized.filter((c) => c.approvalStatus === 'manual_review').map((c) => c.title),
          blocked: categorized.filter((c) => c.approvalStatus === 'blocked').map((c) => c.title),
        },
      });
    } else {
      // Return all clauses without approval categorization
      res.json({ msaId: req.params.id, customerId: msa.customer_id, clauses });
    }
  })
);

export default router;
