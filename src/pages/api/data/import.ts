import type { APIRoute } from 'astro';
import { resolveAuditActor } from '@/server/auth';
import { importCollections, initPostgres, isPostgresBackend, jsonResponse } from '@/server/postgres';

export const POST: APIRoute = async ({ request }) => {
  if (!isPostgresBackend()) {
    return jsonResponse({ error: 'Postgres backend is disabled. Set PUBLIC_DATA_BACKEND=postgres.' }, 400);
  }

  try {
    await initPostgres();
    const payload = await request.json();

    if (!payload?.collections || typeof payload.collections !== 'object') {
      return jsonResponse({ error: 'Backup payload must include collections' }, 400);
    }

    await importCollections(payload.collections as Record<string, Record<string, unknown>[]>, resolveAuditActor(request));
    return jsonResponse({ imported: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import data';
    return jsonResponse({ error: message }, 500);
  }
};
