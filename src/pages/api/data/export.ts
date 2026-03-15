import type { APIRoute } from 'astro';
import { exportCollections, initPostgres, isPostgresBackend, jsonResponse } from '@/server/postgres';

export const GET: APIRoute = async () => {
  if (!isPostgresBackend()) {
    return jsonResponse({ error: 'Postgres backend is disabled. Set PUBLIC_DATA_BACKEND=postgres.' }, 400);
  }

  try {
    await initPostgres();
    const exported = await exportCollections();
    return jsonResponse(exported, 200, {
      'Content-Disposition': `attachment; filename="homeo-hub-backup-${exported.exportedAt.slice(0, 10)}.json"`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export data';
    return jsonResponse({ error: message }, 500);
  }
};
