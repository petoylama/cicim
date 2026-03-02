import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SpinClient from './spin-client';

export const dynamic = 'force-dynamic';

export default async function SpinPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/');
  }
  return <SpinClient />;
}
