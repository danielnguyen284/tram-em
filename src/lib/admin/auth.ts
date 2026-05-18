import type { Profile } from '@/types/database';
import { createClient } from '@/utils/supabase/server';
import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export type AppRole = 'guest' | 'customer' | 'admin';

export type AdminIdentity = {
  user: User;
  profile: Profile | null;
  role: AppRole;
};

export async function getCurrentRole(): Promise<{ user: User | null; profile: Profile | null; role: AppRole }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, role: 'guest' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const profileRole = (profile as Profile | null)?.role;
  const metadataRole = user.app_metadata?.role as AppRole | undefined;
  const role: AppRole = profileRole === 'admin' || metadataRole === 'admin' ? 'admin' : 'customer';

  return {
    user,
    profile: (profile as Profile | null) ?? null,
    role,
  };
}

export async function requireAdmin(): Promise<AdminIdentity> {
  const identity = await getCurrentRole();

  if (!identity.user) {
    redirect('/login?message=Vui%20long%20dang%20nhap%20de%20vao%20admin');
  }

  if (identity.role !== 'admin') {
    redirect('/');
  }

  return identity as AdminIdentity;
}
