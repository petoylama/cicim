# 🐾 CiciPet — Pet Severlerin Buluşma Noktası

Türkiye'nin pet sosyal ağı. Petini paylaş, hikayeler yaz, yarışmalara katıl, CiciPuan kazan!

## 🛠️ Teknoloji Yığını

- **Framework:** Next.js 14 (App Router)
- **Auth:** NextAuth v4 (Google OAuth + Email/Şifre)
- **Veritabanı:** Supabase (PostgreSQL via Prisma)
- **Dosya Depolama:** Supabase Storage
- **UI:** TailwindCSS + shadcn/ui + Radix UI
- **Deploy:** Vercel

## 🚀 Kurulum

### 1. Repoyu Klonla

```bash
git clone https://github.com/petoylama/cici.git
cd cici
yarn install
```

### 2. Ortam Değişkenlerini Ayarla

```bash
cp .env.example .env
```

`.env` dosyasını düzenle:

| Değişken | Nerede Bulunur |
|----------|----------------|
| `DATABASE_URL` | Supabase → Settings → Database → Connection Pooling (Transaction, port 6543) |
| `DIRECT_URL` | Supabase → Settings → Database → Connection String (port 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` çalıştır |
| `NEXTAUTH_URL` | Yerel: `http://localhost:3000`, Prod: Vercel URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/) |

### 3. Veritabanı Kur

```bash
# Prisma client oluştur
npx prisma generate

# Supabase'e şema push et
npx prisma db push
```

### 4. Supabase Storage Bucket Oluştur

Supabase Dashboard → Storage → New Bucket:
- **Name:** `cicipet-uploads`
- **Public:** ✅ (açık işaretle)

### 5. Geliştirme Sunucusu

```bash
yarn dev
# http://localhost:3000
```

## 📦 Vercel Deploy

1. [vercel.com](https://vercel.com) → New Project → GitHub repoyu seç
2. **Environment Variables** bölümüne `.env.example`'daki tüm değişkenleri gir
3. **Build Command:** `npx prisma generate && next build` (vercel.json'da otomatik)
4. Deploy et!
5. Deploy sonrası `NEXTAUTH_URL`'i Vercel URL'i ile güncelle
6. Google Cloud Console → OAuth Credentials → Authorized redirect URIs'e `https://[url]/api/auth/callback/google` ekle

## 🗃️ Veritabanı Modelleri

`User` · `Pet` · `Story` · `Competition` · `Listing` · `Message` · `Donation` · `Shelter` · `PointsHistory` · `DailySpin` · `DailyLoginStreak` · *ve daha fazlası*

## 🌟 Özellikler

- 📸 **Stories** — Pet hikayeleri paylaş
- 🏆 **Yarışmalar** — Petinle yarış, oy topla
- 🔍 **Kayıp & Sahiplendirme** — İlan ver, kayıp hayvan bul
- ❤️ **Eş Bul** — Petlerin için çift ara
- 💬 **Mesajlaşma** — Kullanıcılarla iletişim kur
- 🎰 **CiciŞans** — Günlük çark çevir, puan kazan
- 🛍️ **CiciPazar** — Affiliate ürün önerileri
- 🏦 **Bağış** — CiciPuan ile barınaklara mama bağışı
- 🛡️ **Admin Paneli** — İçerik moderasyonu

---

© 2026 CiciPet — Sevgiyi Hisset 🐾
