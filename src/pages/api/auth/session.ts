import type { APIRoute } from 'astro';
import { readDoctorSession } from '@/server/auth';

export const GET: APIRoute = async ({ request }) => {
  const session = readDoctorSession(request);
  return new Response(
    JSON.stringify({
      authenticated: Boolean(session),
      member: session,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
