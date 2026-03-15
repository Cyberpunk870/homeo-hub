import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildSessionCookie,
  createDoctorSession,
  parseSessionCookie,
  readDoctorSession,
  verifyDoctorCredentials,
} from '@/server/auth';

describe('auth session helpers', () => {
  beforeEach(() => {
    process.env.DOCTOR_EMAIL = 'doctor@example.com';
    process.env.DOCTOR_PASSWORD = 'strong-password';
    process.env.DOCTOR_NAME = 'Dr. Upadhyaya';
    process.env.SESSION_SECRET = 'super-secret-session-key';
    process.env.PUBLIC_APP_NAME = 'Homeo Hub';
  });

  it('verifies doctor credentials from environment', () => {
    expect(verifyDoctorCredentials('doctor@example.com', 'strong-password')).toBe(true);
    expect(verifyDoctorCredentials('wrong@example.com', 'strong-password')).toBe(false);
    expect(verifyDoctorCredentials('doctor@example.com', 'wrong-password')).toBe(false);
  });

  it('serializes and parses signed sessions', () => {
    const session = createDoctorSession('doctor@example.com');
    const cookie = buildSessionCookie(session);
    const raw = cookie.split(';')[0]?.split('=')[1];

    expect(raw).toBeTruthy();
    expect(parseSessionCookie(raw)).toMatchObject({
      email: 'doctor@example.com',
      displayName: 'Dr. Upadhyaya',
    });
  });

  it('reads signed sessions from request cookies', () => {
    const session = createDoctorSession('doctor@example.com');
    const cookie = buildSessionCookie(session).split(';')[0];
    const request = new Request('http://localhost/api/auth/session', {
      headers: {
        cookie,
      },
    });

    expect(readDoctorSession(request)).toMatchObject({
      email: 'doctor@example.com',
    });
  });
});
