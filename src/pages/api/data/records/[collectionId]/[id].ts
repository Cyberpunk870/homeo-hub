import type { APIRoute } from 'astro';
import {
  deleteRecord,
  getCollectionId,
  getRecordById,
  initPostgres,
  isPostgresBackend,
  jsonResponse,
  updateRecord,
} from '@/server/postgres';
import { requireDoctorSession } from '@/server/auth';

function getId(params: Record<string, string | undefined>) {
  const id = params.id;
  if (!id) throw new Error('id is required');
  return id;
}

export const GET: APIRoute = async ({ params, request }) => {
  if (!isPostgresBackend()) {
    return jsonResponse({ error: 'Postgres backend is disabled. Set PUBLIC_DATA_BACKEND=postgres.' }, 400);
  }

  try {
    requireDoctorSession(request);
    await initPostgres();
    const collectionId = getCollectionId(params);
    const id = getId(params);
    const record = await getRecordById(collectionId, id);
    if (!record) return jsonResponse(null, 404);
    return jsonResponse(record);
  } catch (error) {
    const status = error instanceof Error && error.message === 'Unauthorized' ? 401 : 500;
    return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to fetch record' }, status);
  }
};

export const PATCH: APIRoute = async ({ params, request }) => {
  if (!isPostgresBackend()) {
    return jsonResponse({ error: 'Postgres backend is disabled. Set PUBLIC_DATA_BACKEND=postgres.' }, 400);
  }

  try {
    const session = requireDoctorSession(request);
    await initPostgres();
    const collectionId = getCollectionId(params);
    const id = getId(params);
    const patch = (await request.json()) as Record<string, unknown>;
    return jsonResponse(await updateRecord(collectionId, id, patch, session.email));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update record';
    const status = message === 'Unauthorized' ? 401 : message === 'Record not found' ? 404 : 500;
    return jsonResponse({ error: message }, status);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  if (!isPostgresBackend()) {
    return jsonResponse({ error: 'Postgres backend is disabled. Set PUBLIC_DATA_BACKEND=postgres.' }, 400);
  }

  try {
    requireDoctorSession(request);
    await initPostgres();
    const collectionId = getCollectionId(params);
    const id = getId(params);
    return jsonResponse(await deleteRecord(collectionId, id));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete record';
    const status = message === 'Unauthorized' ? 401 : message === 'Record not found' ? 404 : 500;
    return jsonResponse({ error: message }, status);
  }
};
