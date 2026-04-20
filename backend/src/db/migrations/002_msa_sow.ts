import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ── MSAs ───────────────────────────────────────────────────────────────────
  await knex.schema.createTable('msas', (t) => {
    t.string('id', 20).primary();
    t.string('customer_id', 20).notNullable().references('id').inTable('customers').onDelete('CASCADE');
    t.date('signed_date');
    t.date('expiration_date');
    t.boolean('auto_renew').defaultTo(false);
    t.string('payment_terms', 20);
    t.string('governing_law', 100);
    t.string('status', 30).defaultTo('active');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // ── MSA Clauses ────────────────────────────────────────────────────────────
  await knex.schema.createTable('msa_clauses', (t) => {
    t.string('id', 20).primary();
    t.string('msa_id', 20).notNullable().references('id').inTable('msas').onDelete('CASCADE');
    t.string('type', 30).notNullable();
    t.string('title', 200).notNullable();
    t.text('text').notNullable();
    t.integer('sort_order').defaultTo(0);
  });

  // ── Projects ───────────────────────────────────────────────────────────────
  await knex.schema.createTable('projects', (t) => {
    t.string('id', 20).primary();
    t.string('name', 200).notNullable();
    t.string('customer_id', 20).notNullable().references('id').inTable('customers').onDelete('CASCADE');
    t.string('sow_id', 20).nullable(); // FK added after sows table created
    t.string('type', 20).notNullable();
    t.string('status', 20).defaultTo('pipeline');
    t.date('start_date');
    t.date('end_date');
    t.decimal('total_value', 12, 2).defaultTo(0);
    t.decimal('planned_margin_percent', 5, 1).defaultTo(0);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // ── SOWs ───────────────────────────────────────────────────────────────────
  await knex.schema.createTable('sows', (t) => {
    t.string('id', 20).primary();
    t.string('customer_id', 20).notNullable().references('id').inTable('customers').onDelete('CASCADE');
    t.string('project_id', 20).nullable().references('id').inTable('projects').onDelete('SET NULL');
    t.string('msa_id', 20).notNullable().references('id').inTable('msas').onDelete('RESTRICT');
    t.string('template_id', 30).notNullable();
    t.string('title', 300).notNullable();
    t.string('type', 20).notNullable();
    t.string('status', 30).defaultTo('draft');
    t.decimal('total_value', 12, 2).defaultTo(0);
    t.decimal('operating_margin_percent', 5, 1).defaultTo(0);
    t.date('start_date');
    t.date('end_date');
    t.string('created_by', 200).notNullable();
    t.string('approved_by', 200);
    t.timestamp('approved_at');
    t.date('signed_date');
    t.date('effective_date');
    t.string('docusign_envelope_id', 50);
    t.string('sharepoint_doc_url', 500);
    t.jsonb('form_data').defaultTo('{}');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Add FK from projects -> sows now that sows exists
  await knex.schema.alterTable('projects', (t) => {
    t.foreign('sow_id').references('id').inTable('sows').onDelete('SET NULL');
  });

  // ── SOW Resource Lines ─────────────────────────────────────────────────────
  await knex.schema.createTable('sow_resource_lines', (t) => {
    t.increments('id').primary();
    t.string('sow_id', 20).notNullable().references('id').inTable('sows').onDelete('CASCADE');
    t.string('role_id', 20).references('id').inTable('roles').onDelete('SET NULL');
    t.string('location_id', 20).references('id').inTable('locations').onDelete('SET NULL');
    t.string('resource_id', 20).references('id').inTable('resources').onDelete('SET NULL').nullable();
    t.decimal('hours', 10, 2).notNullable();
    t.decimal('bill_rate', 10, 2).notNullable();
    t.decimal('flc_rate', 10, 2).notNullable();
    t.decimal('line_revenue', 12, 2);
    t.decimal('line_cost', 12, 2);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('sow_resource_lines');
  // Remove FK from projects before dropping sows
  await knex.schema.alterTable('projects', (t) => {
    t.dropForeign('sow_id');
  });
  await knex.schema.dropTableIfExists('sows');
  await knex.schema.dropTableIfExists('projects');
  await knex.schema.dropTableIfExists('msa_clauses');
  await knex.schema.dropTableIfExists('msas');
}
