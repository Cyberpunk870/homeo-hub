import type { APIRoute } from 'astro';
import { initPostgres, isPostgresBackend, jsonResponse } from '@/server/postgres';

export const GET: APIRoute = async () => {
  try {
    if (isPostgresBackend()) {
      await initPostgres();
    }

    return jsonResponse({
      ok: true,
      backend: isPostgresBackend() ? 'postgres' : 'local',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      500
    );
  }
};
