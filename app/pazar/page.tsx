import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PazarClient } from './pazar-client';

export const dynamic = 'force-dynamic';

export default async function PazarPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/');
  }
  
  return <PazarClient />;
}
