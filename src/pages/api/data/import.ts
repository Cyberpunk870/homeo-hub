import type { APIRoute } from 'astro';
import { requireDoctorSession } from '@/server/auth';
import { importCollections, initPostgres, isPostgresBackend, jsonResponse } from '@/server/postgres';

export const POST: APIRoute = async ({ request }) => {
  if (!isPostgresBackend()) {
    return jsonResponse({ error: 'Postgres backend is disabled. Set PUBLIC_DATA_BACKEND=postgres.' }, 400);
  }

  try {
    const session = requireDoctorSession(request);
    await initPostgres();
    const payload = await request.json();

    if (!payload?.collections || typeof payload.collections !== 'object') {
      return jsonResponse({ error: 'Backup payload must include collections' }, 400);
    }

    await importCollections(payload.collections as Record<string, Record<string, unknown>[]>, session.email);
    return jsonResponse({ imported: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import data';
    const status = message === 'Unauthorized' ? 401 : 500;
    return jsonResponse({ error: message }, status);
  }
};
