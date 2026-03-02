import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ListingDetailClient from './listing-detail-client';

export const dynamic = 'force-dynamic';

export default async function ListingDetailPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/');
  }
  return <ListingDetailClient />;
}
