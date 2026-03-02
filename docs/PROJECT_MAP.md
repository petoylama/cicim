# CiciPet - Proje Haritası

> Bu doküman, CiciPet projesinin tüm yapısını, modüllerini ve nasıl çalıştığını açıklar.
> Harici bir yazılımcının projeyi anlaması için hazırlanmıştır.

---

## 📊 Proje Genel Bakış

```
cicipet/
└── nextjs_space/           # Ana uygulama dizini
    ├── app/                # Next.js App Router (sayfa ve API'ler)
    ├── components/         # Yeniden kullanılabilir React bileşenleri
    ├── lib/                # Yardımcı fonksiyonlar ve konfigürasyonlar
    ├── hooks/              # Özel React hooks
    ├── prisma/             # Veritabanı şeması
    ├── scripts/            # Seed ve yardımcı scriptler
    ├── public/             # Statik dosyalar
    └── docs/               # Dokümantasyon
```

---

## 📁 Dizin Yapısı ve Açıklamalar

### `/app` - Sayfalar ve API Rotaları

#### Sayfa Yapısı (Her sayfa 2 dosyadan oluşur)

| Dosya | Açıklama |
|-------|----------|
| `page.tsx` | Server-side rendered giriş noktası (authentication kontrolü) |
| `*-client.tsx` | Client-side interaktif bileşen (tüm UI mantığı) |

#### Ana Sayfalar

```
app/
├── page.tsx                    # Giriş/Kayıt sayfası (login/signup)
├── layout.tsx                  # Root layout (providers, metadata, GA)
├── globals.css                 # Global stiller
├── providers.tsx               # Context providers (Session, Theme, Toast)
│
├── dashboard/                  # 🏠 Ana Sayfa (giriş sonrası)
│   ├── page.tsx
│   └── dashboard-client.tsx    # Tüm modüller burada
│
├── pets/                       # 🐾 Pet Yönetimi
│   ├── page.tsx                # Pet listesi
│   ├── pets-client.tsx
│   ├── pet-form.tsx            # Pet ekleme/düzenleme formu
│   ├── new/page.tsx            # Yeni pet ekleme
│   └── [id]/                   # Dinamik pet detay
│       ├── page.tsx
│       ├── pet-detail-client.tsx
│       └── edit/page.tsx       # Pet düzenleme
│
├── stories/                    # 📚 Hikayeler
│   ├── page.tsx
│   ├── stories-client.tsx
│   ├── new/                    # Yeni hikaye
│   └── [id]/                   # Hikaye detay
│
├── competitions/               # 🏆 Yarışmalar
│   ├── page.tsx
│   ├── competitions-client.tsx
│   └── [id]/                   # Yarışma detay ve oy verme
│
├── listings/                   # 📌 Kayıp/Sahiplendirme İlanları
│   ├── page.tsx
│   ├── listings-client.tsx
│   ├── new/page.tsx            # Yeni ilan
│   └── [id]/                   # İlan detay
│
├── matching/                   # 💕 Eş Eşleştirme
│   ├── page.tsx
│   └── matching-client.tsx
│
├── messages/                   # 💬 Mesajlaşma
│   ├── page.tsx
│   └── messages-client.tsx
│
├── donations/                  # 🎁 Bağış Sistemi
│   ├── page.tsx
│   └── donations-client.tsx
│
├── spin/                       # 🎰 CiciŞans (Çarkıfelek)
│   ├── page.tsx
│   └── spin-client.tsx
│
├── pazar/                      # 🛒 CiciPazar (Market)
│   ├── page.tsx
│   └── pazar-client.tsx
│
├── points/                     # 💰 Puan Geçmişi
├── notifications/              # 🔔 Bildirimler
├── profile/                    # 👤 Profil
├── settings/                   # ⚙️ Ayarlar
└── admin/                      # 🔐 Admin Paneli
    ├── page.tsx
    └── admin-client.tsx
```

#### API Rotaları (`/app/api/`)

```
api/
├── auth/
│   └── [...nextauth]/route.ts    # NextAuth.js authentication
│
├── signup/route.ts               # Kullanıcı kayıt
├── recaptcha/verify/route.ts     # reCAPTCHA doğrulama
│
├── home/route.ts                 # Anasayfa verileri (tüm modüller)
├── dashboard/stats/route.ts      # Dashboard istatistikleri
│
├── pets/
│   ├── route.ts                  # GET: liste, POST: oluştur
│   ├── [id]/route.ts             # GET/PUT/DELETE: tek pet
│   ├── [id]/like/route.ts        # Beğeni toggle
│   ├── [id]/comments/route.ts    # Yorumlar
│   ├── [id]/match/route.ts       # Eş isteği gönder
│   └── match/
│       ├── route.ts              # Eşleşen petleri listele
│       ├── requests/route.ts     # Gelen istekler
│       └── [requestId]/route.ts  # İstek kabul/red
│
├── stories/
│   ├── route.ts                  # CRUD
│   ├── [id]/route.ts
│   ├── [id]/like/route.ts
│   ├── [id]/comments/route.ts
│   └── cleanup/route.ts          # 15 günlük temizlik (cron)
│
├── competitions/
│   ├── route.ts                  # Liste/Oluştur
│   ├── [id]/route.ts             # Detay
│   ├── [id]/enter/route.ts       # Yarışmaya katıl
│   └── [id]/vote/route.ts        # Oy ver
│
├── listings/
│   ├── route.ts                  # Kayıp/Sahiplendirme ilanları
│   ├── [id]/route.ts
│   ├── [id]/like/route.ts
│   └── [id]/comments/route.ts
│
├── messages/
│   ├── route.ts                  # Mesaj listesi/gönder
│   ├── [userId]/route.ts         # Belirli kullanıcıyla mesajlar
│   └── unread/route.ts           # Okunmamış sayısı
│
├── notifications/
│   ├── route.ts                  # Bildirim listesi
│   ├── count/route.ts            # Okunmamış sayısı
│   ├── [id]/read/route.ts        # Okundu işaretle
│   └── read-all/route.ts         # Tümünü okundu yap
│
├── donations/route.ts            # Bağış yap/listele
├── shelters/route.ts             # Barınak listesi
├── spin/route.ts                 # Günlük çarkıfelek
├── points/route.ts               # Puan geçmişi
├── comments/                     # Genel yorum yönetimi
│
├── upload/
│   ├── presigned/route.ts        # S3 upload URL oluştur
│   └── complete/route.ts         # Upload tamamlandı
│
└── admin/
    ├── stats/route.ts            # Admin istatistikleri
    ├── reports/route.ts          # Şikayet listesi
    ├── reports/[id]/resolve/     # Şikayeti çöz
    ├── pets/pending/route.ts     # Onay bekleyen petler
    └── pets/[id]/moderate/       # Pet onayla/reddet
```

---

### `/components` - UI Bileşenleri

```
components/
├── navbar.tsx              # Ana navigasyon (desktop + mobil hamburger)
├── ad-banner.tsx           # Reklam banner bileşeni
├── recaptcha.tsx           # Google reCAPTCHA bileşeni
├── theme-provider.tsx      # Tema yönetimi (light/dark)
│
└── ui/                     # shadcn/ui bileşenleri (Radix UI tabanlı)
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── dialog.tsx
    ├── dropdown-menu.tsx
    ├── sheet.tsx             # Mobil menü için
    ├── tabs.tsx
    ├── badge.tsx
    ├── avatar.tsx
    ├── toast.tsx
    ├── ... (40+ bileşen)
    └── use-toast.ts
```

---

### `/lib` - Yardımcı Modüller

```
lib/
├── db.ts                   # Prisma client singleton
├── auth.ts                 # NextAuth konfigürasyonu
├── aws-config.ts           # AWS S3 konfigürasyonu
├── s3.ts                   # S3 upload/download fonksiyonları
├── profanity-filter.ts     # Küfür filtresi
├── utils.ts                # Genel yardımcı fonksiyonlar (cn)
└── types.ts                # TypeScript tip tanımları
```

---

### `/prisma` - Veritabanı

```
prisma/
└── schema.prisma           # Veritabanı şeması (tüm modeller)
```

---

### `/scripts` - Yardımcı Scriptler

```
scripts/
└── seed.ts                 # Veritabanı seed (test verileri)
```

---

## 🔄 Veri Akışı

### 1. Kullanıcı Girişi Akışı

```
Kullanıcı → / (page.tsx) → Login Form → NextAuth signIn()
                                            ↓
                              /api/auth/[...nextauth]
                                            ↓
                              ├─ Google Provider (OAuth)
                              └─ Credentials Provider (email/password)
                                            ↓
                              Prisma Adapter → PostgreSQL
                                            ↓
                              JWT Token oluştur
                                            ↓
                              /dashboard'a yönlendir
```

### 2. Pet Ekleme Akışı

```
/pets/new → PetForm → Fotoğraf seç
                          ↓
              /api/upload/presigned (S3 URL al)
                          ↓
              S3'e direkt upload (client-side)
                          ↓
              /api/pets POST (pet verisi + s3 key)
                          ↓
              Prisma → Pet oluştur (status: pending)
                          ↓
              Admin onayı bekle
```

### 3. Puan Sistemi Akışı

```
Puan Kazanımı:
├─ Hikaye paylaş: +20 puan
├─ Yorum yap: +5 puan
├─ Günlük çark: 10-100 puan
└─ Yarışma kazan: +500 puan

Puan Harcama:
├─ Yarışmaya katıl: -50 puan
└─ Bağış: 50 puan = 1 mama kabı
```

---

## 🛡️ Koruma Katmanları

### Server-Side Protection

```typescript
// Her API route'ında:
const session = await getServerSession(authOptions);
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Client-Side Protection

```typescript
// Her sayfa bileşeninde:
const { data: session, status } = useSession();
if (status === 'unauthenticated') {
  redirect('/');
}
```

### Admin Protection

```typescript
// Admin sayfalarında:
if (!session?.user?.isAdmin) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## 📱 Responsive Tasarım

### Breakpoints

| Breakpoint | Piksel | Kullanım |
|------------|--------|----------|
| `sm` | 640px | Küçük telefonlar |
| `md` | 768px | Tabletler |
| `lg` | 1024px | Laptop |
| `xl` | 1280px | Desktop |

### Mobil Menü

- `lg:hidden` - Hamburger butonu sadece mobilde
- `Sheet` bileşeni ile slide-in menü
- Tüm navigasyon linkleri + kullanıcı bilgisi

---

## 🔗 Önemli Dosya Bağlantıları

| Dosya | Bağlı Olduğu |
|-------|---------------|
| `layout.tsx` | `providers.tsx`, `globals.css` |
| `providers.tsx` | `SessionProvider`, `ThemeProvider`, `Toaster` |
| `navbar.tsx` | Her sayfa tarafından kullanılır |
| `lib/auth.ts` | Tüm API route'ları |
| `lib/db.ts` | Tüm API route'ları + seed.ts |
| `prisma/schema.prisma` | `lib/db.ts` üzerinden tüm uygulama |

---

## 🚀 Deployment Bilgisi

| Ortam | URL | Hosting |
|-------|-----|----------|
| Production | https://cicipet.abacusai.app | Abacus AI |
| Database | PostgreSQL | Abacus AI Hosted |
| Storage | AWS S3 | Abacus AI |

---

Detaylı teknik bilgiler için:
- [TECH_STACK.md](./TECH_STACK.md) - Teknoloji ve kütüphaneler
- [DATABASE.md](./DATABASE.md) - Veritabanı yapısı
- [FEATURES.md](./FEATURES.md) - Tamamlanan özellikler
