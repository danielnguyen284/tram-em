import Shell from '@/components/layout/Shell';
import { getCommunityProfile } from '@/lib/supabase/community';
import { notFound } from 'next/navigation';
import CommunityProfileClient from './CommunityProfileClient';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CommunityProfilePage({ params }: Props) {
  const { id } = await params;
  const profileData = await getCommunityProfile(id);

  if (!profileData) {
    notFound();
  }

  return (
    <Shell>
      <CommunityProfileClient data={profileData} />
    </Shell>
  );
}
