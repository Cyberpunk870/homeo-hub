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
import { requireDoctorSession } from '@/server/auth';

export const GET: APIRoute = async ({ params, request, url }) => {
  if (!isPostgresBackend()) {
    return jsonResponse({ error: 'Postgres backend is disabled. Set PUBLIC_DATA_BACKEND=postgres.' }, 400);
  }

  try {
    requireDoctorSession(request);
    await initPostgres();
    const collectionId = getCollectionId(params);
    return jsonResponse(await listRecords(collectionId, parsePagination(url)));
  } catch (error) {
    const status = error instanceof Error && error.message === 'Unauthorized' ? 401 : 500;
    return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to fetch records' }, status);
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  if (!isPostgresBackend()) {
    return jsonResponse({ error: 'Postgres backend is disabled. Set PUBLIC_DATA_BACKEND=postgres.' }, 400);
  }

  try {
    const session = requireDoctorSession(request);
    await initPostgres();
    const collectionId = getCollectionId(params);
    const payload = await request.json();
    const record = (payload?.itemData ?? payload) as Record<string, unknown>;
    return jsonResponse(await createRecord(collectionId, record, session.email), 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create record';
    const status = message === 'Unauthorized' ? 401 : 500;
    return jsonResponse({ error: message }, status);
  }
};
