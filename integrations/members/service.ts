import { Member } from ".";

export const getCurrentMember = async (): Promise<Member | null> => {
  const response = await fetch('/api/auth/session', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to load session');
  }

  const body = await response.json();
  if (!body?.authenticated || !body.member) {
    return null;
  }

  return {
    email: String(body.member.email),
    displayName: String(body.member.displayName || 'Doctor'),
    status: 'APPROVED',
    lastLoginDate: new Date().toISOString(),
  };
};
