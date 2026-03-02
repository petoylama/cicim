import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ListingsClient from './listings-client';

export const dynamic = 'force-dynamic';

export default async function ListingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/');
  }
  return <ListingsClient />;
}
