import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ── Locations ──────────────────────────────────────────────────────────────
  await knex.schema.createTable('locations', (t) => {
    t.string('id', 20).primary();
    t.string('name', 100).notNullable();
    t.string('country', 5).notNullable();
    t.string('timezone', 50).notNullable();
    t.integer('standard_hours_per_week').defaultTo(40);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // ── Customers (created before holidays so FK works) ────────────────────────
  await knex.schema.createTable('customers', (t) => {
    t.string('id', 20).primary();
    t.string('name', 200).notNullable();
    t.string('industry', 100);
    t.string('primary_contact_name', 200);
    t.string('primary_contact_email', 200);
    t.string('payment_terms', 20).notNullable();
    t.string('status', 20).defaultTo('active');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // ── Holidays ───────────────────────────────────────────────────────────────
  await knex.schema.createTable('holidays', (t) => {
    t.increments('id').primary();
    t.date('date').notNullable();
    t.string('name', 100).notNullable();
    t.string('location_id', 20).references('id').inTable('locations').onDelete('CASCADE');
    t.string('customer_id', 20).references('id').inTable('customers').onDelete('CASCADE').nullable();
    t.unique(['date', 'location_id', 'customer_id']);
  });

  // ── Roles ──────────────────────────────────────────────────────────────────
  await knex.schema.createTable('roles', (t) => {
    t.string('id', 20).primary();
    t.string('title', 100).notNullable();
    t.string('practice', 50).notNullable();
    t.string('sub_practice', 50).notNullable();
    t.string('level', 20).notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // ── Role Rates ─────────────────────────────────────────────────────────────
  await knex.schema.createTable('role_rates', (t) => {
    t.increments('id').primary();
    t.string('role_id', 20).notNullable().references('id').inTable('roles').onDelete('CASCADE');
    t.string('location_id', 20).notNullable().references('id').inTable('locations').onDelete('CASCADE');
    t.decimal('bill_rate', 10, 2).notNullable();
    t.decimal('flc', 10, 2).notNullable();
    t.date('effective_date').notNullable().defaultTo(knex.fn.now());
    t.unique(['role_id', 'location_id', 'effective_date']);
  });

  // ── Skills ─────────────────────────────────────────────────────────────────
  await knex.schema.createTable('skills', (t) => {
    t.string('id', 20).primary();
    t.string('name', 100).notNullable();
    t.string('competency', 100).notNullable();
    t.string('sub_practice', 50).notNullable();
    t.string('practice', 50).notNullable();
  });

  // ── Resources ──────────────────────────────────────────────────────────────
  await knex.schema.createTable('resources', (t) => {
    t.string('id', 20).primary();
    t.string('jobdiva_employee_id', 50);
    t.string('name', 200).notNullable();
    t.string('email', 200).unique().notNullable();
    t.string('role_id', 20).references('id').inTable('roles').onDelete('SET NULL');
    t.string('location_id', 20).references('id').inTable('locations').onDelete('SET NULL');
    t.string('manager_id', 20).references('id').inTable('resources').onDelete('SET NULL').nullable();
    t.string('bu_practice', 50);
    t.decimal('flc_per_hour', 10, 2).notNullable();
    t.date('start_date');
    t.string('status', 20).defaultTo('active');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // ── Resource Skills (junction table) ───────────────────────────────────────
  await knex.schema.createTable('resource_skills', (t) => {
    t.string('resource_id', 20).notNullable().references('id').inTable('resources').onDelete('CASCADE');
    t.string('skill_id', 20).notNullable().references('id').inTable('skills').onDelete('CASCADE');
    t.primary(['resource_id', 'skill_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('resource_skills');
  await knex.schema.dropTableIfExists('resources');
  await knex.schema.dropTableIfExists('skills');
  await knex.schema.dropTableIfExists('role_rates');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('holidays');
  await knex.schema.dropTableIfExists('customers');
  await knex.schema.dropTableIfExists('locations');
}
