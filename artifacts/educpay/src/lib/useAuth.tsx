import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, withSupabaseTimeout } from './supabase';

export type Profile = {
  id: string;
  role?: string;
  establishment_id?: string | null;
  must_change_password?: boolean;
  is_active?: boolean;
};

type AuthContextValue = {
  loading: boolean;
  user: User | null;
  profile: Profile | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (nextUser: User | null) => {
    setUser(nextUser);

    if (!nextUser) {
      setProfile(null);
      return;
    }

    const { data: nextProfile } = await withSupabaseTimeout(
      supabase
        .from('profiles')
          .select('id, role, establishment_id, must_change_password, is_active')
        .eq('id', nextUser.id)
        .single(),
      'Supabase ne répond pas pendant la récupération du profil.',
    );

    if (
      nextProfile &&
      (nextProfile.role === 'DIRECTOR' || nextProfile.role === 'ESTABLISHMENT_ADMIN') &&
      !nextProfile.is_active
    ) {
      try {
        const { data: appData } = await supabase
          .from('establishment_applications')
          .select('status, responsible_account_status, establishment_id')
          .eq('responsible_user_id', nextUser.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (appData?.status === 'APPROVED' && appData?.responsible_account_status === 'ACTIVE') {
          nextProfile.is_active = true;
          if (!nextProfile.establishment_id && appData.establishment_id) {
            nextProfile.establishment_id = appData.establishment_id;
          }
        }
      } catch {
        // Fallback to database value
      }
    }

    setProfile(nextProfile ?? null);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await withSupabaseTimeout(
        supabase.auth.getSession(),
        'Supabase ne répond pas pendant la récupération de la session.',
      );
      await loadProfile(sessionData.session?.user ?? null);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('useAuth refresh error', err);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  useEffect(() => {
    let active = true;
    void refresh();

    const { data: subscriptionData } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || event === 'INITIAL_SESSION') return;

      if (!session) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      void (async () => {
        try {
          await loadProfile(session.user);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('useAuth auth state error', err);
          setProfile(null);
        } finally {
          if (active) setLoading(false);
        }
      })();
    });

    return () => {
      active = false;
      subscriptionData.subscription.unsubscribe();
    };
  }, [loadProfile, refresh]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const value = { loading, user, profile, refresh, signOut } satisfies AuthContextValue;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l’intérieur de AuthProvider.');
  }
  return context;
}