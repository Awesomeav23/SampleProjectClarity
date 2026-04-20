import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ── Resource Allocations ───────────────────────────────────────────────────
  await knex.schema.createTable('resource_allocations', (t) => {
    t.string('id', 20).primary();
    t.string('resource_id', 20).notNullable().references('id').inTable('resources').onDelete('CASCADE');
    t.string('project_id', 20).notNullable().references('id').inTable('projects').onDelete('CASCADE');
    t.string('role_id', 20).references('id').inTable('roles').onDelete('SET NULL');
    t.date('start_date').notNullable();
    t.date('end_date').notNullable();
    t.integer('allocation_percent').notNullable();
    t.decimal('bill_rate', 10, 2).notNullable();
    t.string('type', 20).defaultTo('execution');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // ── Assignments ────────────────────────────────────────────────────────────
  await knex.schema.createTable('assignments', (t) => {
    t.string('id', 20).primary();
    t.string('resource_id', 20).notNullable().references('id').inTable('resources').onDelete('CASCADE');
    t.string('project_id', 20).notNullable().references('id').inTable('projects').onDelete('CASCADE');
    t.string('customer_id', 20).notNullable().references('id').inTable('customers').onDelete('CASCADE');
    t.date('start_date').notNullable();
    t.date('end_date').notNullable();
    t.integer('allocation_percent').notNullable();
    t.decimal('bill_rate', 10, 2).notNullable();
    t.string('approver_email', 200).notNullable();
    t.string('submitted_by', 200).notNullable();
    t.string('status', 20).defaultTo('submitted');
    t.string('jobdiva_assignment_id', 50);
    t.text('capacity_warning');
    t.text('notes');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // ── Timesheets ─────────────────────────────────────────────────────────────
  await knex.schema.createTable('timesheets', (t) => {
    t.string('id', 20).primary();
    t.string('resource_id', 20).notNullable().references('id').inTable('resources').onDelete('CASCADE');
    t.string('project_id', 20).notNullable().references('id').inTable('projects').onDelete('CASCADE');
    t.date('week_start_date').notNullable();
    t.decimal('monday', 4, 1).defaultTo(0);
    t.decimal('tuesday', 4, 1).defaultTo(0);
    t.decimal('wednesday', 4, 1).defaultTo(0);
    t.decimal('thursday', 4, 1).defaultTo(0);
    t.decimal('friday', 4, 1).defaultTo(0);
    t.decimal('saturday', 4, 1).defaultTo(0);
    t.decimal('sunday', 4, 1).defaultTo(0);
    t.decimal('total_hours', 5, 1);
    t.string('status', 20).defaultTo('draft');
    t.string('approved_by', 200);
    t.timestamp('submitted_at');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['resource_id', 'project_id', 'week_start_date']);
  });

  // ── Change Orders ──────────────────────────────────────────────────────────
  await knex.schema.createTable('change_orders', (t) => {
    t.string('id', 20).primary();
    t.string('sow_id', 20).notNullable().references('id').inTable('sows').onDelete('CASCADE');
    t.string('type', 20).notNullable();
    t.text('description').notNullable();
    t.decimal('additions_total', 12, 2).defaultTo(0);
    t.decimal('credits_total', 12, 2).defaultTo(0);
    t.decimal('net_impact', 12, 2).defaultTo(0);
    t.string('status', 20).defaultTo('draft');
    t.string('created_by', 200);
    t.string('approved_by', 200);
    t.timestamp('approved_at');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // ── Change Order Lines ─────────────────────────────────────────────────────
  await knex.schema.createTable('change_order_lines', (t) => {
    t.increments('id').primary();
    t.string('change_order_id', 20).notNullable().references('id').inTable('change_orders').onDelete('CASCADE');
    t.string('line_type', 10).notNullable(); // 'addition' | 'credit'
    t.string('resource_id', 20).references('id').inTable('resources').onDelete('SET NULL').nullable();
    t.string('role_id', 20).references('id').inTable('roles').onDelete('SET NULL').nullable();
    t.decimal('hours', 10, 2).notNullable();
    t.decimal('bill_rate', 10, 2).notNullable();
    t.decimal('line_total', 12, 2);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('change_order_lines');
  await knex.schema.dropTableIfExists('change_orders');
  await knex.schema.dropTableIfExists('timesheets');
  await knex.schema.dropTableIfExists('assignments');
  await knex.schema.dropTableIfExists('resource_allocations');
}
