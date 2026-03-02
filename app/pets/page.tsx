import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PetsClient from './pets-client';

export const dynamic = 'force-dynamic';

export default async function PetsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/');
  }

  return <PetsClient />;
}
