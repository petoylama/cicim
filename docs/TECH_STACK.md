# CiciPet - Teknoloji Yığını (Tech Stack)

> Bu döküman, CiciPet projesinde kullanılan tüm teknolojileri, kütüphaneleri ve araçları detaylı olarak açıklar.

---

## 🏗️ Temel Teknolojiler

### Framework

| Teknoloji | Versiyon | Açıklama |
|-----------|----------|----------|
| **Next.js** | 14.2.28 | React tabanlı full-stack framework |
| **React** | 18.2.0 | UI kütüphanesi |
| **TypeScript** | 5.2.2 | Tip güvenli JavaScript |

### Çalışma Ortamı

```
Next.js App Router (app/ dizini)
├── Server Components (varsayılan)
├── Client Components ('use client' ile)
├── API Routes (app/api/)
└── Middleware desteği
```

---

## 🗄️ Veritabanı

| Teknoloji | Açıklama |
|-----------|----------|
| **PostgreSQL** | İlişkisel veritabanı |
| **Prisma ORM** | 6.7.0 - Type-safe veritabanı erişimi |
| **@prisma/client** | Otomatik oluşturulan client |

### Prisma Komutları

```bash
# Şema değişikliklerini veritabanına uygula
yarn prisma db push

# Client'ı yeniden oluştur
yarn prisma generate

# Seed verilerini ekle
yarn prisma db seed

# Veritabanını görselleştir
yarn prisma studio
```

---

## 🔐 Authentication

| Teknoloji | Versiyon | Açıklama |
|-----------|----------|----------|
| **NextAuth.js** | 4.24.11 | Authentication framework |
| **@next-auth/prisma-adapter** | 1.0.7 | Prisma entegrasyonu |
| **bcryptjs** | 2.4.3 | Şifre hashleme |

### Desteklenen Giriş Yöntemleri

1. **Email/Password** - Credentials Provider
2. **Google OAuth** - Google Provider

### Konfigürasyon Dosyaları

```
lib/auth.ts              # NextAuth options
app/api/auth/[...nextauth]/route.ts  # Auth handler
next-auth.d.ts           # TypeScript type extensions
```

---

## 🎨 UI Framework

### Styling

| Teknoloji | Versiyon | Açıklama |
|-----------|----------|----------|
| **Tailwind CSS** | 3.3.3 | Utility-first CSS |
| **tailwindcss-animate** | 1.0.7 | Animasyon eklentisi |
| **tailwind-merge** | 2.5.2 | Class birleştirme |
| **class-variance-authority** | 0.7.0 | Variant yönetimi |

### Bileşen Kütüphaneleri

| Teknoloji | Açıklama |
|-----------|----------|
| **shadcn/ui** | Radix UI tabanlı bileşenler |
| **Radix UI** | Erişilebilir headless bileşenler |
| **Lucide React** | 0.446.0 - İkon kütüphanesi |

### Kullanılan Radix Bileşenleri

```
@radix-ui/react-dialog       # Modal/Dialog
@radix-ui/react-dropdown-menu
@radix-ui/react-tabs
@radix-ui/react-select
@radix-ui/react-avatar
@radix-ui/react-checkbox
@radix-ui/react-label
@radix-ui/react-popover
@radix-ui/react-toast
@radix-ui/react-tooltip
... ve daha fazlası
```

---

## ☁️ Dosya Depolama

| Teknoloji | Açıklama |
|-----------|----------|
| **AWS S3** | Dosya depolama |
| **@aws-sdk/client-s3** | S3 client |
| **@aws-sdk/s3-request-presigner** | Presigned URL oluşturma |

### Upload Akışı

```
1. Client: /api/upload/presigned çağır
2. Server: S3 presigned URL oluştur
3. Client: Dosyayı S3'e direkt yükle
4. Client: /api/upload/complete ile kaydı tamamla
```

---

## 🛡️ Güvenlik

| Teknoloji | Açıklama |
|-----------|----------|
| **Google reCAPTCHA v2** | Bot koruması |
| **JWT** | Oturum yönetimi |
| **HTTPS** | SSL/TLS şifreleme |
| **Profanity Filter** | İçerik moderasyonu |

### Environment Variables

```env
# Veritabanı
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# AWS
AWS_PROFILE=...
AWS_REGION=...
AWS_BUCKET_NAME=...
AWS_FOLDER_PREFIX=...

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
RECAPTCHA_SECRET_KEY=...

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=...

# API
ABACUSAI_API_KEY=...
CLEANUP_API_KEY=...
```

---

## 📊 Analytics & Monitoring

| Teknoloji | Açıklama |
|-----------|----------|
| **Google Analytics 4** | Kullanıcı takibi |
| **Measurement ID** | G-6Z658G9X52 |

### Entegrasyon

```typescript
// app/layout.tsx
<Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
```

---

## 📦 State Yönetimi

| Teknoloji | Açıklama |
|-----------|----------|
| **React useState/useEffect** | Local state |
| **next-auth/react** | Session state |
| **SWR** | 2.2.4 - Data fetching (opsiyonel) |
| **@tanstack/react-query** | 5.0.0 - Data fetching (opsiyonel) |

### Pattern

```typescript
// Tipik sayfa yapısı
'use client';

const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/endpoint')
    .then(res => res.json())
    .then(setData)
    .finally(() => setLoading(false));
}, []);
```

---

## 🔧 Geliştirme Araçları

| Araç | Açıklama |
|------|----------|
| **Yarn** | Paket yöneticisi |
| **ESLint** | 9.24.0 - Kod kalite kontrolü |
| **TypeScript** | Tip kontrolü |
| **tsx** | 4.20.3 - TypeScript çalıştırma |
| **dotenv** | Environment değişkenleri |

### Komutlar

```bash
# Geliştirme sunucusu
yarn dev

# Production build
yarn build

# Production sunucu
yarn start

# Tip kontrolü
yarn tsc --noEmit

# Lint
yarn lint
```

---

## 📱 PWA Desteği

| Dosya | Açıklama |
|-------|----------|
| `public/manifest.json` | PWA manifest |
| `public/sw.js` | Service Worker |
| `public/favicon.svg` | App ikonu |

---

## 🌐 Hosting & Deployment

| Hizmet | Açıklama |
|--------|----------|
| **Abacus AI** | App hosting |
| **PostgreSQL** | Managed database |
| **AWS S3** | File storage |
| **SSL/TLS** | Otomatik sertifika |

### Deployment Süreci

```bash
1. yarn build          # Production build
2. Abacus AI deploy    # Otomatik deployment
3. SSL aktif           # HTTPS otomatik
```

---

## 📚 Diğer Kütüphaneler

| Kütüphane | Versiyon | Kullanım |
|-----------|----------|----------|
| **date-fns** | 3.6.0 | Tarih işlemleri |
| **dayjs** | 1.11.13 | Tarih formatı |
| **lodash** | 4.17.21 | Utility fonksiyonlar |
| **react-hook-form** | 7.53.0 | Form yönetimi |
| **zod** | 3.23.8 | Schema validation |
| **framer-motion** | 10.18.0 | Animasyonlar |
| **embla-carousel-react** | 8.3.0 | Carousel |
| **sonner** | 1.5.0 | Toast notifications |
| **cmdk** | 1.0.0 | Command palette |

---

## 📁 Dosya Yapısı Kuralları

### Naming Conventions

```
components/         # PascalCase: Button.tsx
app/api/           # kebab-case: route.ts
lib/               # kebab-case: profanity-filter.ts
hooks/             # camelCase: useToast.ts
```

### Import Aliases

```typescript
// tsconfig.json paths
@/components/*    // components/
@/lib/*           // lib/
@/hooks/*         // hooks/
```

---

## 🔄 Güncelleme Talimatları

### Paket Güncellemeleri

```bash
# Tüm paketleri güncelle
yarn upgrade-interactive --latest

# Belirli paket
yarn add package@latest
```

### Prisma Şema Güncellemeleri

```bash
1. prisma/schema.prisma düzenle
2. yarn prisma db push
3. yarn prisma generate
4. yarn build
```

---

Daha fazla bilgi için:
- [PROJECT_MAP.md](./PROJECT_MAP.md) - Proje yapısı
- [DATABASE.md](./DATABASE.md) - Veritabanı detayları
- [FEATURES.md](./FEATURES.md) - Özellik listesi
