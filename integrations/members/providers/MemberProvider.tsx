import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { MemberActions, MemberContext, MemberState } from '.';
import { getCurrentMember, Member } from '..';

interface MemberProviderProps {
  children: ReactNode;
}

async function readErrorMessage(response: Response) {
  try {
    const body = await response.json();
    return typeof body?.error === 'string' ? body.error : 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export const MemberProvider: React.FC<MemberProviderProps> = ({ children }) => {
  const [state, setState] = useState<MemberState>({
    member: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const updateState = useCallback((updates: Partial<MemberState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const loadCurrentMember = useCallback(async () => {
    try {
      updateState({ isLoading: true, error: null });
      const member = await getCurrentMember();

      updateState({
        member,
        isAuthenticated: Boolean(member),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      updateState({
        member: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load current doctor session',
      });
    }
  }, [updateState]);

  const login = useCallback<MemberActions['login']>(
    async ({ email, password }) => {
      updateState({ isLoading: true, error: null });
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const errorMessage = await readErrorMessage(response);
          updateState({
            isLoading: false,
            error: errorMessage,
            member: null,
            isAuthenticated: false,
          });
          return { success: false, error: errorMessage };
        }

        const body = await response.json();
        const member: Member = {
          email: String(body.member.email),
          displayName: String(body.member.displayName || 'Doctor'),
          status: 'APPROVED',
          lastLoginDate: new Date().toISOString(),
        };

        updateState({
          member,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
        updateState({
          isLoading: false,
          error: errorMessage,
          member: null,
          isAuthenticated: false,
        });
        return { success: false, error: errorMessage };
      }
    },
    [updateState]
  );

  const logout = useCallback<MemberActions['logout']>(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      updateState({
        member: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, [updateState]);

  const clearMember = useCallback(() => {
    updateState({
      member: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, [updateState]);

  useEffect(() => {
    void loadCurrentMember();
  }, [loadCurrentMember]);

  const actions: MemberActions = {
    loadCurrentMember,
    login,
    logout,
    clearMember,
  };

  return <MemberContext.Provider value={{ ...state, actions }}>{children}</MemberContext.Provider>;
};
