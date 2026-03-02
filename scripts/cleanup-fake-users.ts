// Sahte/test kullanıcıları tespit ve temizleme scripti
import { prisma } from '../lib/db';

async function cleanupFakeUsers() {
  console.log('Sahte kullanıcılar aranıyor...');
  
  // Şüpheli e-posta kalıpları
  const suspiciousPatterns = [
    'example.com',
    '@doe.com',
    'test@test',
    'admin@admin',
    'user@user',
    'fake@',
    'bot@',
  ];

  const fakeUsers = await prisma.user.findMany({
    where: {
      OR: suspiciousPatterns.map(pattern => ({
        email: { contains: pattern, mode: 'insensitive' }
      }))
    },
    select: { id: true, name: true, email: true, isAdmin: true, createdAt: true }
  });

  console.log(`${fakeUsers.length} şüpheli kullanıcı bulundu:`);
  fakeUsers.forEach(u => console.log(`- ${u.email} (Admin: ${u.isAdmin})`));

  if (fakeUsers.length > 0) {
    // Admin yetkilerini kaldır
    const adminIds = fakeUsers.filter(u => u.isAdmin).map(u => u.id);
    if (adminIds.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: adminIds } },
        data: { isAdmin: false }
      });
      console.log(`${adminIds.length} sahte admin'in yetkisi kaldırıldı.`);
    }

    // Kullanıcıları sil
    const userIds = fakeUsers.map(u => u.id);
    
    // İlişkili kayıtları sil
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.message.deleteMany({ where: { OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }] } });
    await prisma.like.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.comment.deleteMany({ where: { authorId: { in: userIds } } });
    await prisma.listingLike.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.listingComment.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.petMatchRequest.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.pointsHistory.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.dailySpin.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.donation.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.report.deleteMany({ where: { reporterId: { in: userIds } } });
    await prisma.listing.deleteMany({ where: { userId: { in: userIds } } });
    
    // Petler ve ilişkili kayıtları sil
    const petIds = (await prisma.pet.findMany({ where: { ownerId: { in: userIds } }, select: { id: true } })).map(p => p.id);
    if (petIds.length > 0) {
      await prisma.competitionEntry.deleteMany({ where: { petId: { in: petIds } } });
      await prisma.petMatchRequest.deleteMany({ where: { OR: [{ petId: { in: petIds } }, { targetPetId: { in: petIds } }] } });
      await prisma.story.deleteMany({ where: { petId: { in: petIds } } });
      await prisma.pet.deleteMany({ where: { id: { in: petIds } } });
    }
    
    // Hikayeleri sil
    await prisma.story.deleteMany({ where: { authorId: { in: userIds } } });
    
    // Session ve Account kayıtlarını sil
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.account.deleteMany({ where: { userId: { in: userIds } } });
    
    // Kullanıcıları sil
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    
    console.log(`${userIds.length} sahte kullanıcı silindi.`);
  }

  await prisma.$disconnect();
}

cleanupFakeUsers().catch(console.error);
