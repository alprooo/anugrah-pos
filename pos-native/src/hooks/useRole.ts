import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/database';

export function useRole(): { role: UserRole | null; isAdmin: boolean; isStaff: boolean } {
  const { user } = useAuth();

  const role = useMemo<UserRole | null>(() => {
    if (!user) return null;
    // Try user_metadata first, fallback to app_metadata
    return (user.user_metadata?.role as UserRole) ??
      (user.app_metadata?.role as UserRole) ??
      null;
  }, [user]);

  return {
    role,
    isAdmin: role === 'admin',
    isStaff: role === 'staff',
  };
}
