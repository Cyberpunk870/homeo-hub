import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE = 'homeo_hub_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export interface DoctorSession {
  email: string;
  displayName: string;
  exp: number;
}

interface SignedPayload {
  email: string;
  displayName: string;
  exp: number;
}

function getDoctorEmail() {
  const email = process.env.DOCTOR_EMAIL?.trim();
  if (!email) throw new Error('DOCTOR_EMAIL is not configured');
  return email.toLowerCase();
}

function getDoctorPassword() {
  const password = process.env.DOCTOR_PASSWORD;
  if (!password) throw new Error('DOCTOR_PASSWORD is not configured');
  return password;
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not configured');
  return secret;
}

function getDoctorDisplayName() {
  return process.env.DOCTOR_NAME?.trim() || 'Doctor';
}

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
}

function signValue(value: string) {
  return createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

export function createDoctorSession(email: string): DoctorSession {
  return {
    email: email.toLowerCase(),
    displayName: getDoctorDisplayName(),
    exp: Date.now() + SESSION_TTL_MS,
  };
}

export function serializeSession(session: DoctorSession) {
  const encoded = toBase64Url(JSON.stringify(session));
  return `${encoded}.${signValue(encoded)}`;
}

export function parseSessionCookie(rawValue?: string | null): DoctorSession | null {
  if (!rawValue) return null;

  const [encoded, signature] = rawValue.split('.');
  if (!encoded || !signature) return null;

  const expected = signValue(encoded);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encoded)) as SignedPayload;
    if (!payload.email || !payload.exp || payload.exp <= Date.now()) return null;
    return {
      email: payload.email.toLowerCase(),
      displayName: payload.displayName || getDoctorDisplayName(),
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export function readDoctorSession(request: Request): DoctorSession | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map((part) => part.trim());
  const sessionCookie = cookies.find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!sessionCookie) return null;
  return parseSessionCookie(sessionCookie.slice(SESSION_COOKIE.length + 1));
}

export function requireDoctorSession(request: Request): DoctorSession {
  const session = readDoctorSession(request);
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export function resolveAuditActor(request?: Request) {
  return readDoctorSession(request ?? new Request('http://localhost'))?.email || process.env.DOCTOR_EMAIL?.trim().toLowerCase() || 'system';
}

export function verifyDoctorCredentials(email: string, password: string) {
  return email.trim().toLowerCase() === getDoctorEmail() && password === getDoctorPassword();
}

export function buildSessionCookie(session: DoctorSession) {
  const serialized = serializeSession(session);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${serialized}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(
    SESSION_TTL_MS / 1000
  )}${secure}`;
}

export function buildLogoutCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
