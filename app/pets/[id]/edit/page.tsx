import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import PetForm from '../../pet-form';

export default async function EditPetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/');
  }

  const pet = await prisma.pet.findUnique({
    where: { id },
  });

  if (!pet) {
    redirect('/pets');
  }

  if (pet.ownerId !== session.user.id) {
    redirect('/pets');
  }

  return <PetForm pet={pet} />;
}
