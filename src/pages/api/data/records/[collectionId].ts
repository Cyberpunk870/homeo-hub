import type { APIRoute } from 'astro';
import {
  createRecord,
  getCollectionId,
  initPostgres,
  isPostgresBackend,
  jsonResponse,
  listRecords,
  parsePagination,
} from '@/server/postgres';
import { resolveAuditActor } from '@/server/auth';

export const GET: APIRoute = async ({ params, url }) => {
  if (!isPostgresBackend()) {
    return jsonResponse({ error: 'Postgres backend is disabled. Set PUBLIC_DATA_BACKEND=postgres.' }, 400);
  }

  try {
    await initPostgres();
    const collectionId = getCollectionId(params);
    return jsonResponse(await listRecords(collectionId, parsePagination(url)));
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to fetch records' }, 500);
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  if (!isPostgresBackend()) {
    return jsonResponse({ error: 'Postgres backend is disabled. Set PUBLIC_DATA_BACKEND=postgres.' }, 400);
  }

  try {
    await initPostgres();
    const collectionId = getCollectionId(params);
    const payload = await request.json();
    const record = (payload?.itemData ?? payload) as Record<string, unknown>;
    return jsonResponse(await createRecord(collectionId, record, resolveAuditActor(request)), 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create record';
    return jsonResponse({ error: message }, 500);
  }
};
