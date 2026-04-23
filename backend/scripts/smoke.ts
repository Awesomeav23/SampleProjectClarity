/**
 * Production smoke test.
 *
 * Hits critical endpoints against a running server to verify the deploy is healthy.
 * Exits non-zero on first failure so it plugs into CI / post-deploy gates.
 *
 *   BASE_URL=https://clarity-uat.dynpro.com SMOKE_EMAIL=admin@dynpro.com npx tsx scripts/smoke.ts
 *
 * Defaults to http://localhost:4000 and admin@dynpro.com (mock auth accepts any password).
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4000';
const EMAIL = process.env.SMOKE_EMAIL ?? 'admin@dynpro.com';
const PASSWORD = process.env.SMOKE_PASSWORD ?? 'ignored-in-mock';

type Check = {
  name: string;
  run: () => Promise<void>;
};

const results: { name: string; ok: boolean; error?: string; durationMs: number }[] = [];

async function request<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText} — ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function login(): Promise<string> {
  const body = await request<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!body.token) throw new Error('login returned no token');
  return body.token;
}

function authed(token: string): RequestInit {
  return { headers: { Authorization: `Bearer ${token}` } };
}

async function main() {
  console.log(`[SMOKE] Target: ${BASE_URL}`);
  console.log(`[SMOKE] User:   ${EMAIL}`);

  let token = '';

  const checks: Check[] = [
    {
      name: 'GET /health',
      run: async () => {
        const body = await request<{ ok: boolean }>('/health');
        if (!body.ok) throw new Error('health returned ok=false');
      },
    },
    {
      name: 'POST /api/auth/login',
      run: async () => {
        token = await login();
      },
    },
    {
      name: 'GET /api/auth/me',
      run: async () => {
        const me = await request<{ email: string; permissions: string[] }>('/api/auth/me', authed(token));
        if (me.email !== EMAIL) throw new Error(`expected ${EMAIL}, got ${me.email}`);
        if (!me.permissions.includes('admin:system_config')) {
          throw new Error('smoke user lacks admin:system_config — use a sys-admin account');
        }
      },
    },
    {
      name: 'GET /api/customers',
      run: async () => {
        const list = await request<unknown[]>('/api/customers', authed(token));
        if (!Array.isArray(list) || list.length === 0) throw new Error('customers list empty');
      },
    },
    {
      name: 'GET /api/sows',
      run: async () => {
        await request<unknown[]>('/api/sows', authed(token));
      },
    },
    {
      name: 'GET /api/capacity',
      run: async () => {
        await request('/api/capacity?weekStart=2026-04-20', authed(token));
      },
    },
    {
      name: 'GET /api/burnt-reports',
      run: async () => {
        await request<unknown[]>('/api/burnt-reports', authed(token));
      },
    },
    {
      name: 'GET /api/sharepoint/folders',
      run: async () => {
        const body = await request<{ folders: string[] }>('/api/sharepoint/folders', authed(token));
        if (!Array.isArray(body.folders)) throw new Error('folders not an array');
      },
    },
    {
      name: 'GET /api/integration-health',
      run: async () => {
        const body = await request<{ overall: string; connectors: unknown[]; queues: unknown[] }>(
          '/api/integration-health',
          authed(token)
        );
        if (!['healthy', 'degraded', 'down'].includes(body.overall)) {
          throw new Error(`unexpected overall status: ${body.overall}`);
        }
        if (body.overall === 'down') {
          throw new Error('integration-health reports overall=down — dependency is unreachable');
        }
      },
    },
  ];

  for (const check of checks) {
    const started = Date.now();
    try {
      await check.run();
      const durationMs = Date.now() - started;
      results.push({ name: check.name, ok: true, durationMs });
      console.log(`  ✓ ${check.name} (${durationMs}ms)`);
    } catch (err) {
      const durationMs = Date.now() - started;
      const message = err instanceof Error ? err.message : String(err);
      results.push({ name: check.name, ok: false, error: message, durationMs });
      console.error(`  ✗ ${check.name} (${durationMs}ms) — ${message}`);
      break;
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n[SMOKE] ${passed} passed, ${failed} failed`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('[SMOKE] unexpected error:', err);
  process.exit(1);
});
