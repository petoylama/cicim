# CiciPet - Veritabanı Yapısı (Database Schema)

> Bu döküman, CiciPet projesinin veritabanı yapısını, tablolar arası ilişkileri ve veri akışını açıklar.

---

## 🗄️ Veritabanı Bilgileri

| Özellik | Değer |
|---------|--------|
| **DBMS** | PostgreSQL |
| **ORM** | Prisma 6.7.0 |
| **Host** | Abacus AI Hosted DB |
| **Schema Dosyası** | `prisma/schema.prisma` |

---

## 📊 Entity-Relationship Diyagramı

```
                                    ┌───────────────┐
                                    │    User      │
                                    │───────────────│
                                    │ id          │
                                    │ email       │
                                    │ password    │
                                    │ isAdmin     │
                                    │ points      │
                                    └───────┬───────┘
                                            │
        ┌──────────┬──────────┬─────────┼──────────┬──────────┬──────────┐
        │          │          │         │          │          │          │
        ▼          ▼          ▼         ▼          ▼          ▼          ▼
    ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐
    │  Pet  │  │ Story │  │Listing│  │Message│  │Donation│  │DailySpin│  │Notific.│
    └───┬───┘  └───┬───┘  └───┬───┘  └───────┘  └───┬───┘  └───────┘  └───────┘
        │          │          │                    │
        ▼          ▼          ▼                    ▼
    ┌───────┐  ┌───────┐  ┌───────┐          ┌───────┐
    │Comment│  │ Like  │  │Listing│          │Shelter│
    └───────┘  └───────┘  │Comment│          └───────┘
                       └───────┘
```

---

## 📝 Tablo Detayları

### 1. User (Kullanıcı)

**NextAuth.js ile entegre ana kullanıcı tablosu**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | String (cuid) | Primary key |
| `name` | String? | Kullanıcı adı |
| `email` | String? (unique) | Email adresi |
| `emailVerified` | DateTime? | Email doğrulama tarihi |
| `image` | String? | Profil fotoğrafı URL |
| `password` | String? | Hashlenmiş şifre (bcrypt) |
| `isAdmin` | Boolean | Admin yetkisi (default: false) |
| `points` | Int | CiciPuan bakiyesi (default: 100) |
| `createdAt` | DateTime | Kayıt tarihi |
| `updatedAt` | DateTime | Güncelleme tarihi |

**İlişkiler:**
- `accounts` → Account[] (OAuth hesapları)
- `sessions` → Session[] (Oturumlar)
- `pets` → Pet[] (Sahip olunan petler)
- `stories` → Story[] (Yazdığı hikayeler)
- `comments` → Comment[] (Yorumları)
- `likes` → Like[] (Beğenileri)
- `notifications` → Notification[] (Bildirimleri)
- `donations` → Donation[] (Bağışları)
- `messages (sent/received)` → Message[]

---

### 2. Account (OAuth Hesap)

**NextAuth.js Prisma Adapter için**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | String | Primary key |
| `userId` | String | User FK |
| `type` | String | Hesap tipi |
| `provider` | String | OAuth sağlayıcı (google) |
| `providerAccountId` | String | Sağlayıcı hesap ID |
| `access_token` | String? | Erişim token |
| `refresh_token` | String? | Yenileme token |
| `expires_at` | Int? | Token süresi |

**Unique:** `[provider, providerAccountId]`

---

### 3. Pet (Evcil Hayvan)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | String | Primary key |
| `name` | String | Pet adı |
| `species` | String | Tür (kedi, köpek, kuş, diğer) |
| `breed` | String? | Irk |
| `gender` | String? | Cinsiyet (erkek, dişi, bilinmiyor) |
| `age` | Int? | Yaş |
| `description` | String? (Text) | Açıklama |
| `imageUrl` | String? | Fotoğraf URL |
| `cloudStoragePath` | String? | S3 key |
| `isPublic` | Boolean | Herkese açık mı |
| `moderationStatus` | String | Durum (pending, approved, rejected) |
| `likesCount` | Int | Beğeni sayısı |
| `commentsCount` | Int | Yorum sayısı |
| `ownerId` | String | Sahip User FK |

**İlişkiler:**
- `owner` → User
- `stories` → Story[]
- `likes` → Like[]
- `comments` → Comment[]
- `competitionEntries` → CompetitionEntry[]
- `matchRequests (sent/received)` → PetMatchRequest[]

---

### 4. Story (Hikaye)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | String | Primary key |
| `title` | String | Başlık |
| `content` | String (Text) | İçerik |
| `imageUrl` | String? | Görsel URL |
| `cloudStoragePath` | String? | S3 key |
| `isPublic` | Boolean | Herkese açık |
| `likesCount` | Int | Beğeni sayısı |
| `commentsCount` | Int | Yorum sayısı |
| `sharesCount` | Int | Paylaşım sayısı |
| `authorId` | String | Yazar User FK |
| `petId` | String | İlgili Pet FK |
| `createdAt` | DateTime | Oluşturma tarihi |

**Önemli:** 15 günden eski hikayeler otomatik silinir (`/api/stories/cleanup`)

---

### 5. Competition (Yarışma)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | String | Primary key |
| `title` | String | Yarışma adı |
| `description` | String? (Text) | Açıklama |
| `startDate` | DateTime | Başlangıç |
| `endDate` | DateTime | Bitiş |
| `status` | String | Durum (active, ended) |
| `entryPoints` | Int | Katılım maliyeti (default: 50) |
| `winnerId` | String? | Kazanan Pet FK |

**İlişkiler:**
- `winner` → Pet?
- `entries` → CompetitionEntry[]

---

### 6. CompetitionEntry (Yarışma Katılımı)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | String | Primary key |
| `competitionId` | String | Yarışma FK |
| `petId` | String | Pet FK |
| `votesCount` | Int | Oy sayısı |
| `createdAt` | DateTime | Katılım tarihi |

**Unique:** `[competitionId, petId]`

**İlişkiler:**
- `voters` → User[] (Many-to-many)

---

### 7. Listing (Kayıp/Sahiplendirme İlanı)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | String | Primary key |
| `type` | String | Tip (lost, adoption) |
| `title` | String | İlan başlığı |
| `description` | String (Text) | Detay |
| `petName` | String | Hayvan adı |
| `species` | String | Tür |
| `breed` | String? | Irk |
| `gender` | String? | Cinsiyet |
| `age` | String? | Yaş grubu |
| `color` | String? | Renk |
| `location` | String | Konum (il/ilçe) |
| `contactPhone` | String? | Telefon |
| `contactEmail` | String? | Email |
| `imageUrl` | String? | Fotoğraf |
| `status` | String | Durum (active, found, adopted, closed) |
| `lastSeenDate` | DateTime? | Son görülme (kayıp için) |
| `likesCount` | Int | Beğeni |
| `commentsCount` | Int | Yorum |
| `userId` | String | İlan sahibi FK |

---

### 8. PetMatchRequest (Eş İsteği)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | String | Primary key |
| `petId` | String | İstek gönderen Pet FK |
| `targetPetId` | String | Hedef Pet FK |
| `status` | String | Durum (pending, accepted, rejected) |
| `message` | String? (Text) | Mesaj |
| `userId` | String | İstek sahibi User FK |

**Unique:** `[petId, targetPetId]`

---

### 9. Message (Mesaj)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | String | Primary key |
| `content` | String (Text) | Mesaj içeriği |
| `senderId` | String | Gönderen User FK |
| `receiverId` | String | Alıcı User FK |
| `isRead` | Boolean | Okundu mu |
| `createdAt` | DateTime | Gönderim tarihi |

---

### 10. Shelter (Barınak)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | String | Primary key |
| `name` | String | Barınak adı |
| `description` | String? (Text) | Açıklama |
| `location` | String | Konum |
| `imageUrl` | String? | Fotoğraf |
| `contactPhone` | String? | Telefon |
| `contactEmail` | String? | Email |
| `website` | String? | Web sitesi |
| `isActive` | Boolean | Aktif mi |
| `totalDonations` | Int | Toplam bağış (mama kabı) |

---

### 11. Donation (Bağış)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | String | Primary key |
| `userId` | String | Bağışçı User FK |
| `shelterId` | String | Barınak FK |
| `pointsSpent` | Int | Harcanan CiciPuan |
| `foodBowls` | Int | Mama kabı sayısı |
| `type` | String | Tip (points, competition_prize) |
| `message` | String? (Text) | Mesaj |
| `createdAt` | DateTime | Tarih |

**Önemli:** 50 CiciPuan = 1 Mama Kabı

---

### 12. DailySpin (Günlük Çark)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | String | Primary key |
| `userId` | String | Kullanıcı FK |
| `reward` | Int | Kazanılan puan |
| `spinDate` | DateTime | Çevirme tarihi |

**Not:** Her kullanıcı günde 1 kez çevirebilir

---

### 13. Comment (Yorum)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | String | Primary key |
| `content` | String (Text) | Yorum metni |
| `authorId` | String | Yazar FK |
| `petId` | String? | Pet FK (opsiyonel) |
| `storyId` | String? | Story FK (opsiyonel) |
| `competitionId` | String? | Competition FK (opsiyonel) |

**Not:** Polimorfik yapı - tek tablo, çoklu ilişki

---

### 14. Like (Beğeni)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | String | Primary key |
| `userId` | String | Kullanıcı FK |
| `petId` | String? | Pet FK |
| `storyId` | String? | Story FK |
| `competitionId` | String? | Competition FK |

**Unique Constraints:**
- `[userId, petId]`
- `[userId, storyId]`
- `[userId, competitionId]`

---

### 15. Event (Etkinlik)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | String | Primary key |
| `title` | String | Başlık |
| `description` | String? (Text) | Açıklama |
| `imageUrl` | String? | Görsel |
| `location` | String? | Konum |
| `eventDate` | DateTime | Etkinlik tarihi |
| `endDate` | DateTime? | Bitiş tarihi |
| `status` | String | upcoming, active, ended |
| `eventType` | String | meetup, adoption_day, health_check, workshop |

---

### 16. Article (Makale)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | String | Primary key |
| `title` | String | Başlık |
| `content` | String (Text) | İçerik |
| `summary` | String? | Özet |
| `imageUrl` | String? | Görsel |
| `category` | String | health, care, nutrition |
| `isPublished` | Boolean | Yayında mı |
| `viewCount` | Int | Görüntülenme |

---

### 17. Notification (Bildirim)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | String | Primary key |
| `type` | String | Bildirim tipi |
| `title` | String | Başlık |
| `message` | String (Text) | Mesaj |
| `isRead` | Boolean | Okundu mu |
| `userId` | String | Kullanıcı FK |
| `relatedId` | String? | İlgili entity ID |

**Bildirim Tipleri:**
- `pet_approved` - Pet onaylandı
- `pet_comment` - Pet'e yorum yapıldı
- `story_comment` - Hikayeye yorum yapıldı
- `pet_likes_milestone` - Beğeni eşiği aşıldı
- `competition_result` - Yarışma sonucu
- `match_request` - Eş isteği
- `listing_comment` - İlana yorum

---

## 🔄 Veritabanı İşlemleri

### Prisma Client Kullanımı

```typescript
import { prisma } from '@/lib/db';

// Listeleme
const users = await prisma.user.findMany();

// Tekil
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// Oluşturma
const pet = await prisma.pet.create({
  data: { name, species, ownerId }
});

// Güncelleme
await prisma.user.update({
  where: { id: userId },
  data: { points: { increment: 20 } }
});

// Silme
await prisma.story.delete({
  where: { id: storyId }
});

// İlişkilerle birlikte
const petWithOwner = await prisma.pet.findUnique({
  where: { id: petId },
  include: {
    owner: true,
    comments: {
      include: { author: true }
    }
  }
});
```

### Transaction Örneği

```typescript
// Bağış işlemi - atomic
await prisma.$transaction([
  prisma.user.update({
    where: { id: userId },
    data: { points: { decrement: pointsSpent } }
  }),
  prisma.shelter.update({
    where: { id: shelterId },
    data: { totalDonations: { increment: foodBowls } }
  }),
  prisma.donation.create({
    data: { userId, shelterId, pointsSpent, foodBowls }
  })
]);
```

---

## 🛠️ Bakım Komutları

```bash
# Şema değişikliğini uygula
yarn prisma db push

# Client'i yeniden oluştur
yarn prisma generate

# Seed verilerini yükle
yarn prisma db seed

# Veritabanını görselleştir (tarayıcıda)
yarn prisma studio

# Veritabanı migrasyonu (production)
yarn prisma migrate dev --name migration_name
```

---

Daha fazla bilgi için:
- [PROJECT_MAP.md](./PROJECT_MAP.md) - Proje yapısı
- [TECH_STACK.md](./TECH_STACK.md) - Teknoloji detayları
- [FEATURES.md](./FEATURES.md) - Özellik listesi
