import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ── Users ──────────────────────────────────────────────────────────────────
  await knex.schema.createTable('users', (t) => {
    t.string('id', 20).primary();
    t.string('email', 200).unique().notNullable();
    t.string('name', 200).notNullable();
    t.string('role_id', 30).notNullable();
    t.string('resource_id', 20).references('id').inTable('resources').onDelete('SET NULL').nullable();
    t.string('bu_practice', 50);
    t.string('location', 50);
    t.boolean('is_active').defaultTo(true);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // ── Stakeholders ───────────────────────────────────────────────────────────
  await knex.schema.createTable('stakeholders', (t) => {
    t.string('id', 20).primary();
    t.string('name', 200).notNullable();
    t.string('email', 200).unique().notNullable();
    t.string('role', 100);
    t.boolean('approval_authority').defaultTo(false);
    t.decimal('approval_threshold', 5, 1);
  });

  // ── Audit Log ──────────────────────────────────────────────────────────────
  await knex.schema.createTable('audit_log', (t) => {
    t.bigIncrements('id').primary();
    t.string('entity_type', 50).notNullable();
    t.string('entity_id', 20).notNullable();
    t.string('action', 50).notNullable();
    t.string('actor_id', 20).notNullable();
    t.string('actor_email', 200).notNullable();
    t.jsonb('changes');
    t.jsonb('metadata');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['entity_type', 'entity_id']);
    t.index('actor_id');
    t.index('created_at');
  });

  // ── Opportunities ──────────────────────────────────────────────────────────
  await knex.schema.createTable('opportunities', (t) => {
    t.string('id', 20).primary();
    t.string('customer_id', 20).notNullable().references('id').inTable('customers').onDelete('CASCADE');
    t.string('title', 300).notNullable();
    t.decimal('estimated_value', 12, 2).defaultTo(0);
    t.integer('probability');
    t.date('expected_close_date');
    t.string('status', 20).defaultTo('prospecting');
    t.text('notes');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('opportunities');
  await knex.schema.dropTableIfExists('audit_log');
  await knex.schema.dropTableIfExists('stakeholders');
  await knex.schema.dropTableIfExists('users');
}
