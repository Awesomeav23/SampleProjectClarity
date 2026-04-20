import knex from 'knex';
import { config } from '../config.js';

export const db = knex({
  client: 'pg',
  connection: config.database.url,
  pool: { min: 2, max: 10 },
});

export async function checkConnection(): Promise<void> {
  await db.raw('SELECT 1');
}
