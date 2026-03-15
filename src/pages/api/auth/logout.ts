import type { APIRoute } from 'astro';
import { buildLogoutCookie } from '@/server/auth';

export const POST: APIRoute = async () =>
  new Response(JSON.stringify({ authenticated: false }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': buildLogoutCookie(),
    },
  });
