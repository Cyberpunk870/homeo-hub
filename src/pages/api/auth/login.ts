import type { APIRoute } from 'astro';
import { buildSessionCookie, createDoctorSession, verifyDoctorCredentials } from '@/server/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();
    const email = String(payload?.email ?? '');
    const password = String(payload?.password ?? '');

    if (!email.trim() || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!verifyDoctorCredentials(email, password)) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = createDoctorSession(email);
    return new Response(JSON.stringify({ authenticated: true, member: session }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': buildSessionCookie(session),
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to sign in' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
