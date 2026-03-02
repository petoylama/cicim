import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create test account (admin)
  const hashedPassword = await bcrypt.hash('johndoe123', 12);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'John Doe',
      password: hashedPassword,
      isAdmin: true,
      points: 100,
    },
  });

  console.log('Test user created:', testUser.email);

  // Make ekremselcuk@gmail.com admin
  const adminUser = await prisma.user.updateMany({
    where: { email: 'ekremselcuk@gmail.com' },
    data: { isAdmin: true },
  });
  console.log('Admin user updated:', adminUser.count);

  // Create active competition
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  const competition = await prisma.competition.upsert({
    where: { id: 'seed-competition-1' },
    update: {},
    create: {
      id: 'seed-competition-1',
      title: 'En Sevimli Pet',
      description: 'Bu ayın en sevimli petini seçiyoruz! Petini yarışmaya dahil et ve oy topla.',
      startDate,
      endDate,
      status: 'active',
    },
  });

  console.log('Competition created:', competition.title);

  // Create sample shelters
  const shelters = [
    {
      id: 'shelter-1',
      name: 'İstanbul Hayvan Barınağı',
      description: 'İstanbul\'un en büyük hayvan barınağı. 500\'den fazla can dostu burada yeni yuvalarını bekliyor.',
      location: 'İstanbul, Ümraniye',
      imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80',
      contactPhone: '0216 555 00 00',
      contactEmail: 'istanbul@barinak.org',
    },
    {
      id: 'shelter-2',
      name: 'Ankara Sokak Hayvanları Derneği',
      description: 'Başkentimizde sokak hayvanlarına yardım eden gönüllü kuruluş.',
      location: 'Ankara, Çankaya',
      imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
      contactPhone: '0312 444 00 00',
      contactEmail: 'ankara@sokakhayvan.org',
    },
    {
      id: 'shelter-3',
      name: 'İzmir Can Dostlar Barınağı',
      description: 'Ege\'nin en modern hayvan bakım tesisi. Tedavi ve rehabilitasyon hizmetleri sunuyoruz.',
      location: 'İzmir, Bornova',
      imageUrl: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80',
      contactPhone: '0232 333 00 00',
      contactEmail: 'izmir@candostlar.org',
    },
    {
      id: 'shelter-4',
      name: 'Antalya Patili Dostlar',
      description: 'Akdeniz\'in güneşli ikliminde sokak hayvanlarına yuva arıyoruz.',
      location: 'Antalya, Muratpaşa',
      imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80',
      contactPhone: '0242 222 00 00',
      contactEmail: 'antalya@patili.org',
    },
    {
      id: 'shelter-5',
      name: 'Bursa Hayvan Hakları Derneği',
      description: 'Bursa ve çevresinde sokak hayvanlarının tedavi ve barınma ihtiyaçlarını karşılıyoruz.',
      location: 'Bursa, Nilüfer',
      imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80',
      contactPhone: '0224 111 00 00',
      contactEmail: 'bursa@hayvanhak.org',
    },
  ];

  for (const shelter of shelters) {
    await prisma.shelter.upsert({
      where: { id: shelter.id },
      update: {},
      create: shelter,
    });
  }

  console.log('Shelters created:', shelters.length);

  // Create sample events
  const now = new Date();
  const events = [
    {
      id: 'event-1',
      title: 'Patili Dostlar Buluşması',
      description: 'İstanbul\'da tüm evcil hayvan sahiplerini bir araya getiriyoruz! Petlerinizle birlikte gelin, yeni arkadaşlıklar kurun.',
      location: 'İstanbul, Maçka Parkı',
      eventDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 hafta sonra
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 saat sürecek
      status: 'upcoming',
      eventType: 'meetup',
    },
    {
      id: 'event-2',
      title: 'Ücretsiz Aşı Günü',
      description: 'Veteriner hekimlerimiz tarafından ücretsiz aşı uygulaması yapılacaktır. Sokak hayvanları önceliklidir.',
      location: 'Ankara, Kızılay Meydanı',
      eventDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 hafta sonra
      status: 'upcoming',
      eventType: 'health_check',
    },
    {
      id: 'event-3',
      title: 'Sahiplendirme Festivali',
      description: 'Yüzlerce can dostu yeni ailelerini arıyor! Gel, bir patiye yuva ol.',
      location: 'İzmir, Kordon',
      eventDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 3 hafta sonra
      status: 'upcoming',
      eventType: 'adoption_day',
    },
    {
      id: 'event-4',
      title: 'Pet Bakım Atölyesi',
      description: 'Petinizin tüy bakımı, tırnak kesimi ve temel sağlık kontrollerini öğrenin.',
      location: 'Online - Zoom',
      eventDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 gün sonra
      status: 'upcoming',
      eventType: 'workshop',
    },
  ];

  for (const event of events) {
    await prisma.event.upsert({
      where: { id: event.id },
      update: event,
      create: event,
    });
  }
  console.log('Events created:', events.length);

  // Create sample articles
  const articles = [
    {
      id: 'article-1',
      title: 'Kedilerde Doğru Beslenme Rehberi',
      content: 'Kediler obligat karnivor canlılardır, yani et yemeye zorunludurlar. Doğru beslenme, kedinizin sağlıklı ve mutlu bir yaşam sürmesi için kritik öneme sahiptir. Bu makalede kedilerin beslenme ihtiyaçlarını detaylı olarak inceleyeceğiz.\n\n## Protein İhtiyacı\nKediler, köpeklere göre daha fazla proteine ihtiyaç duyar. Günlük diyetlerinin en az %30-40\'ı proteinlerden oluşmalıdır.\n\n## Su Tüketimi\nKediler genellikle yeterli su içmezler. Islak mama vermek veya çeşme tipi su kapları kullanmak su tüketimini artırabilir.\n\n## Kaçınılması Gereken Yiyecekler\nSoğan, sarımsak, çikolata ve üzüm kediler için toksiktir. Bu gıdaları kesinlikle vermemelisiniz.',
      summary: 'Kedinizin sağlıklı beslenmesi için bilmeniz gereken her şey',
      imageUrl: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800&q=80',
      category: 'nutrition',
      isPublished: true,
    },
    {
      id: 'article-2',
      title: 'Köpeklerde Tüy Bakımının Önemi',
      content: 'Düzenli tüy bakımı sadece estetik değil, köpeğinizin sağlığı için de çok önemlidir. Tüy bakımı sayesinde deri hastalıklarını erken fark edebilir, parazitleri tespit edebilir ve köpeğinizin genel sağlığını takip edebilirsiniz.\n\n## Tarama Sıklığı\nUzun tüylü ırklar günlük, kısa tüylü ırklar haftada 2-3 kez taranmalıdır.\n\n## Banyo\nKöpekler genellikle ayda 1-2 kez yıkanmalıdır. Çok sık yıkama deri kuruluğuna neden olabilir.\n\n## Profesyonel Bakım\n6-8 haftada bir profesyonel tıraş ve bakım önerilir.',
      summary: 'Köpeğinizin tüy bakımı hakkında kapsamlı rehber',
      imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
      category: 'care',
      isPublished: true,
    },
    {
      id: 'article-3',
      title: 'Evcil Hayvanlarda Aşı Takvimi',
      content: 'Aşılar, evcil hayvanlarınızı ciddi hastalıklardan korumanın en etkili yoludur. Düzenli aşı takvimine uymak, hem petinizin hem de ailenizin sağlığı için kritiktir.\n\n## Köpek Aşıları\n- 6-8 hafta: İlk karma aşı\n- 10-12 hafta: 2. karma aşı\n- 14-16 hafta: Kuduz aşısı\n- Yıllık: Tekrar dozları\n\n## Kedi Aşıları\n- 8-9 hafta: İlk aşı\n- 12 hafta: 2. aşı\n- 16 hafta: Kuduz (gerekirse)\n\n## Önemli Notlar\nAşı sonrası 24-48 saat hafif ateş ve halsizlik normal olabilir.',
      summary: 'Kedi ve köpekler için önerilen aşı programı',
      imageUrl: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&q=80',
      category: 'health',
      isPublished: true,
    },
    {
      id: 'article-4',
      title: 'Yaz Aylarında Pet Bakımı',
      content: 'Sıcak yaz ayları evcil hayvanlarımız için zorlu olabilir. Doğru önlemleri alarak petinizin sıcaklarda sağlıklı kalmasını sağlayabilirsiniz.\n\n## Sıcak Çarpması Belirtileri\n- Aşırı soluma\n- Salya akması\n- Sendeleme\n- Kusma\n\n## Korunma Yolları\n- Günün en sıcak saatlerinde dışarı çıkmayın\n- Her zaman taze su bulundurun\n- Serin gölgelik alanlar sağlayın\n- Asla arabada bırakmayın!\n\n## Pati Bakımı\nSıcak asfalt patileri yakabilir. Elinizi 5 saniye asfalta koyamıyorsanız, köpeğiniz için de çok sıcaktır.',
      summary: 'Sıcak havalarda evcil hayvan bakımı için ipuçları',
      imageUrl: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800&q=80',
      category: 'care',
      isPublished: true,
    },
  ];

  for (const article of articles) {
    await prisma.article.upsert({
      where: { id: article.id },
      update: article,
      create: article,
    });
  }
  console.log('Articles created:', articles.length);

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
