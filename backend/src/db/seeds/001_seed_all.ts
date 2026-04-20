import type { Knex } from 'knex';
import {
  LOCATIONS,
  HOLIDAYS_2026,
  CUSTOMER_HOLIDAY_CALENDARS,
  ROLES,
  SKILLS,
  CUSTOMERS,
  MSAS,
  RESOURCES,
  PROJECTS,
  SOWS,
  RESOURCE_ALLOCATIONS,
  TIMESHEET_ENTRIES,
  OPPORTUNITIES,
} from '../../services/mockData.js';
import { MOCK_USERS } from '../../services/authConfig.js';
import { STAKEHOLDERS } from '../../services/mockData.js';

export async function seed(knex: Knex): Promise<void> {
  // Clear all tables in reverse dependency order
  await knex('change_order_lines').del();
  await knex('change_orders').del();
  await knex('timesheets').del();
  await knex('assignments').del();
  await knex('resource_allocations').del();
  await knex('sow_resource_lines').del();
  await knex('opportunities').del();
  await knex('audit_log').del();
  await knex('users').del();
  await knex('stakeholders').del();
  // Clear sow_id FK on projects before deleting sows
  await knex('projects').update({ sow_id: null });
  await knex('sows').del();
  await knex('projects').del();
  await knex('msa_clauses').del();
  await knex('msas').del();
  await knex('resource_skills').del();
  await knex('resources').del();
  await knex('role_rates').del();
  await knex('roles').del();
  await knex('skills').del();
  await knex('holidays').del();
  await knex('customers').del();
  await knex('locations').del();

  // ── Locations ────────────────────────────────────────────────────────────
  await knex('locations').insert(
    LOCATIONS.map((l) => ({
      id: l.id,
      name: l.name,
      country: l.country,
      timezone: l.timezone,
      standard_hours_per_week: l.standardHoursPerWeek,
    }))
  );

  // ── Customers ────────────────────────────────────────────────────────────
  await knex('customers').insert(
    CUSTOMERS.map((c) => ({
      id: c.id,
      name: c.name,
      industry: c.industry,
      primary_contact_name: c.primaryContactName,
      primary_contact_email: c.primaryContactEmail,
      payment_terms: c.paymentTerms,
      status: c.status,
    }))
  );

  // ── Holidays ─────────────────────────────────────────────────────────────
  const holidayRows: any[] = [];
  for (const h of HOLIDAYS_2026) {
    for (const locId of h.locationIds) {
      holidayRows.push({ date: h.date, name: h.name, location_id: locId, customer_id: null });
    }
  }
  for (const cal of CUSTOMER_HOLIDAY_CALENDARS) {
    for (const h of cal.additionalHolidays) {
      for (const locId of h.locationIds) {
        holidayRows.push({ date: h.date, name: h.name, location_id: locId, customer_id: cal.customerId });
      }
    }
  }
  await knex('holidays').insert(holidayRows);

  // ── Roles ────────────────────────────────────────────────────────────────
  await knex('roles').insert(
    ROLES.map((r) => ({
      id: r.id,
      title: r.title,
      practice: r.practice,
      sub_practice: r.subPractice,
      level: r.level,
    }))
  );

  // ── Role Rates ───────────────────────────────────────────────────────────
  const rateRows: any[] = [];
  for (const role of ROLES) {
    for (const rate of role.standardRates) {
      rateRows.push({
        role_id: role.id,
        location_id: rate.locationId,
        bill_rate: rate.billRate,
        flc: rate.flc,
        effective_date: '2026-01-01',
      });
    }
  }
  await knex('role_rates').insert(rateRows);

  // ── Skills ───────────────────────────────────────────────────────────────
  await knex('skills').insert(
    SKILLS.map((s) => ({
      id: s.id,
      name: s.name,
      competency: s.competency,
      sub_practice: s.subPractice,
      practice: s.practice,
    }))
  );

  // ── Resources (insert without manager_id first, then update) ─────────────
  await knex('resources').insert(
    RESOURCES.map((r) => ({
      id: r.id,
      jobdiva_employee_id: r.jobdivaEmployeeId,
      name: r.name,
      email: r.email,
      role_id: r.roleId,
      location_id: r.locationId,
      manager_id: null, // set after all resources exist
      bu_practice: r.buPractice,
      flc_per_hour: r.flcPerHour,
      start_date: r.startDate,
      status: r.status,
    }))
  );

  // Update manager_id references
  for (const r of RESOURCES) {
    if (r.managerId) {
      await knex('resources').where('id', r.id).update({ manager_id: r.managerId });
    }
  }

  // ── Resource Skills ──────────────────────────────────────────────────────
  const skillRows: any[] = [];
  for (const r of RESOURCES) {
    for (const skillId of r.skills) {
      skillRows.push({ resource_id: r.id, skill_id: skillId });
    }
  }
  if (skillRows.length > 0) {
    await knex('resource_skills').insert(skillRows);
  }

  // ── MSAs ─────────────────────────────────────────────────────────────────
  await knex('msas').insert(
    MSAS.map((m) => ({
      id: m.id,
      customer_id: m.customerId,
      signed_date: m.signedDate,
      expiration_date: m.expirationDate,
      auto_renew: m.autoRenew,
      payment_terms: m.paymentTerms,
      governing_law: m.governingLaw,
      status: m.status,
    }))
  );

  // ── MSA Clauses ──────────────────────────────────────────────────────────
  const clauseRows: any[] = [];
  for (const msa of MSAS) {
    for (let i = 0; i < msa.clauses.length; i++) {
      const c = msa.clauses[i];
      clauseRows.push({
        id: `${c.id}-${msa.id}`,
        msa_id: msa.id,
        type: c.type,
        title: c.title,
        text: c.text,
        sort_order: i,
      });
    }
  }
  await knex('msa_clauses').insert(clauseRows);

  // ── Projects (without sow_id first) ──────────────────────────────────────
  await knex('projects').insert(
    PROJECTS.map((p) => ({
      id: p.id,
      name: p.name,
      customer_id: p.customerId,
      sow_id: null, // set after SOWs exist
      type: p.type,
      status: p.status,
      start_date: p.startDate,
      end_date: p.endDate,
      total_value: p.totalValue,
      planned_margin_percent: p.plannedMarginPercent,
    }))
  );

  // ── SOWs ─────────────────────────────────────────────────────────────────
  await knex('sows').insert(
    SOWS.map((s) => ({
      id: s.id,
      customer_id: s.customerId,
      project_id: s.projectId,
      msa_id: s.msaId,
      template_id: s.type === 'lean_tm' ? 'TPL-LEAN-TM' : s.type === 'elaborate_tm' ? 'TPL-ELAB-TM' : 'TPL-FIXED-FEE',
      title: s.title,
      type: s.type,
      status: s.status,
      total_value: s.totalValue,
      operating_margin_percent: s.operatingMarginPercent,
      start_date: s.startDate,
      end_date: s.endDate,
      created_by: s.createdBy,
      approved_by: s.approvedBy,
      signed_date: s.signedDate,
      effective_date: s.effectiveDate,
      docusign_envelope_id: s.docusignEnvelopeId,
      sharepoint_doc_url: s.sharepointDocUrl,
    }))
  );

  // Update projects with sow_id
  for (const p of PROJECTS) {
    if (p.sowId) {
      await knex('projects').where('id', p.id).update({ sow_id: p.sowId });
    }
  }

  // ── Change Orders ────────────────────────────────────────────────────────
  for (const sow of SOWS) {
    for (const co of sow.changeOrders) {
      await knex('change_orders').insert({
        id: co.id,
        sow_id: co.sowId,
        type: co.type,
        description: co.description,
        additions_total: co.additions,
        credits_total: co.credits,
        net_impact: co.netImpact,
        status: co.status,
        created_by: 'sharad@dynpro.com',
        approved_by: co.status === 'approved' ? 'madhup@dynpro.com' : null,
        approved_at: co.approvedDate ? new Date(co.approvedDate).toISOString() : null,
      });
    }
  }

  // ── Resource Allocations ─────────────────────────────────────────────────
  await knex('resource_allocations').insert(
    RESOURCE_ALLOCATIONS.map((a) => ({
      id: a.id,
      resource_id: a.resourceId,
      project_id: a.projectId,
      role_id: a.roleId,
      start_date: a.startDate,
      end_date: a.endDate,
      allocation_percent: a.allocationPercent,
      bill_rate: a.billRate,
      type: a.type,
    }))
  );

  // ── Timesheets ───────────────────────────────────────────────────────────
  await knex('timesheets').insert(
    TIMESHEET_ENTRIES.map((ts) => ({
      id: ts.id,
      resource_id: ts.resourceId,
      project_id: ts.projectId,
      week_start_date: ts.weekStartDate,
      monday: ts.monday,
      tuesday: ts.tuesday,
      wednesday: ts.wednesday,
      thursday: ts.thursday,
      friday: ts.friday,
      saturday: ts.saturday,
      sunday: ts.sunday,
      total_hours: ts.totalHours,
      status: ts.status,
      approved_by: ts.approvedBy,
      submitted_at: ts.submittedAt,
    }))
  );

  // ── Opportunities ────────────────────────────────────────────────────────
  await knex('opportunities').insert(
    OPPORTUNITIES.map((o) => ({
      id: o.id,
      customer_id: o.customerId,
      title: o.title,
      estimated_value: o.estimatedValue,
      probability: o.probability,
      expected_close_date: o.expectedCloseDate,
      status: o.status,
      notes: o.notes,
    }))
  );

  // ── Users ────────────────────────────────────────────────────────────────
  await knex('users').insert(
    MOCK_USERS.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role_id: u.roleId,
      resource_id: u.resourceId,
      bu_practice: u.buPractice,
      location: u.location,
    }))
  );

  // ── Stakeholders ─────────────────────────────────────────────────────────
  await knex('stakeholders').insert(
    STAKEHOLDERS.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: s.role,
      approval_authority: s.approvalAuthority,
      approval_threshold: s.approvalThreshold,
    }))
  );
}
