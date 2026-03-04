'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import {
  Trophy,
  Calendar,
  Heart,
  MapPin,
  Clock,
  ArrowRight,
  PawPrint,
  BookOpen,
  Users,
  Sparkles,
  AlertTriangle,
  Home,
  Stethoscope,
  Utensils,
  Scissors,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import Navbar from '@/components/navbar';

interface Competition {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  entryPoints: number;
  _count: { entries: number };
  entries?: Array<{
    pet: { id: string; name: string; imageUrl: string | null };
    votesCount: number;
  }>;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  location: string | null;
  eventDate: string;
  endDate: string | null;
  eventType: string;
}

interface Story {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
  pet: { id: string; name: string; imageUrl: string | null; species: string } | null;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  age: number | null;
  imageUrl: string | null;
  owner: { id: string; name: string | null };
}

interface Listing {
  id: string;
  type: string;
  title: string;
  petName: string;
  species: string;
  location: string;
  imageUrl: string | null;
  createdAt: string;
  user: { id: string; name: string | null };
}

interface Article {
  id: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  category: string;
  createdAt: string;
}

interface AffiliateProduct {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  affiliateUrl: string;
  platform: string;
  price: string | null;
}

interface HomeData {
  featuredCompetition: Competition | null;
  competitions: Competition[];
  currentEvents: Event[];
  upcomingEvents: Event[];
  stories: Story[];
  matchingPets: Pet[];
  listings: Listing[];
  articles: Article[];
  affiliateProducts: AffiliateProduct[];
}

export default function DashboardClient() {
  const { data: session } = useSession() || {};
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [streakReward, setStreakReward] = useState<{ points: number; streak: number } | null>(null);

  useEffect(() => {
    // Ana sayfa verisini çek
    fetch('/api/home')
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Günlük giriş ödülünü kontrol et ve al
    fetch('/api/login-streak', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.pointsEarned > 0 && !data.alreadyClaimedToday) {
          setStreakReward({ points: data.pointsEarned, streak: data.currentStreak });
          // 5 saniye sonra kaldır
          setTimeout(() => setStreakReward(null), 5000);
        }
      })
      .catch(() => { });
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return 'Sona erdi';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days} gün ${hours} saat`;
    return `${hours} saat`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'health':
        return <Stethoscope className="h-4 w-4" />;
      case 'nutrition':
        return <Utensils className="h-4 w-4" />;
      case 'care':
        return <Scissors className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'health':
        return 'Sağlık';
      case 'nutrition':
        return 'Beslenme';
      case 'care':
        return 'Bakım';
      default:
        return category;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'meetup':
        return 'Buluşma';
      case 'adoption_day':
        return 'Sahiplendirme Günü';
      case 'health_check':
        return 'Sağlık Kontrolü';
      case 'workshop':
        return 'Atölye';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cici-50 to-white">
        <Navbar />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center">
            <PawPrint className="mx-auto h-12 w-12 animate-pulse text-cici-500" />
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cici-50 to-white">
      <Navbar />
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Hoş Geldin Mesajı */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Hoş Geldin, {session?.user?.name?.split(' ')[0] || 'CiciPet\'e'}! 🐾
          </h1>
          <p className="mt-1 text-gray-600">Patleri keşfet, hikayeler paylaş, yarışmalara katıl!</p>
        </div>

        {/* Günlük Giriş Ödülü Banner */}
        {streakReward && (
          <Card className="mb-6 bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 animate-pulse">
            <CardContent className="py-4">
              <div className="flex items-center justify-center gap-4">
                <span className="text-3xl">🔥</span>
                <div className="text-center">
                  <p className="text-lg font-bold">{streakReward.streak}. Gün Giriş Ödülü!</p>
                  <p className="text-sm opacity-90">+{streakReward.points} CiciPuan kazandınız!</p>
                </div>
                <span className="text-3xl">🎁</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 1. Tür Bazlı Düello Alanı - Yakında */}
        <section className="mb-8">
          <Card className="overflow-hidden bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col items-center justify-center text-center py-6">
                <PawPrint className="h-12 w-12 mb-4 opacity-80" />
                <h2 className="text-2xl font-bold md:text-3xl mb-2">Tür Bazlı Düello</h2>
                <p className="text-white/90 max-w-md">
                  Kedi mi, köpek mi? Yakında petleriniz arasında heyecan verici düellolar başlıyor!
                </p>
                <Badge className="mt-4 bg-white/20 text-white hover:bg-white/30">
                  <Sparkles className="mr-1 h-3 w-3" /> Yakında
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 2. Güncel Yarışmalar */}
        {data?.competitions && data.competitions.length > 0 && (
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                <Trophy className="mr-2 inline h-5 w-5 text-cici-500" />
                Güncel Yarışmalar
              </h2>
              <Link href="/competitions" className="text-sm text-cici-600 hover:underline">
                Tümünü Gör <ArrowRight className="ml-1 inline h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {data.competitions.map((comp) => (
                <Link key={comp.id} href={`/competitions/${comp.id}`}>
                  <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                    {comp.imageUrl && (
                      <div className="relative aspect-video bg-muted">
                        <Image
                          src={comp.imageUrl}
                          alt={comp.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-cici-500" />
                        <CardTitle className="text-lg">{comp.title}</CardTitle>
                      </div>
                      <CardDescription>{comp._count.entries} katılımcı</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          <Clock className="mr-1 inline h-4 w-4" />
                          {getTimeRemaining(comp.endDate)}
                        </span>
                        <Badge variant="outline">{comp.entryPoints} Puan</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 5. Hikaye Akışı */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              <BookOpen className="mr-2 inline h-5 w-5 text-cici-500" />
              Son Hikayeler
            </h2>
            <Link href="/stories" className="text-sm text-cici-600 hover:underline">
              Tümünü Gör <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {data?.stories && data.stories.length > 0 ? (
              data.stories.map((story) => (
                <Link key={story.id} href={`/stories/${story.id}`}>
                  <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="relative aspect-video bg-gray-100">
                      {story.imageUrl ? (
                        <Image loading="eager" src={story.imageUrl} alt={story.title} fill className="object-cover" unoptimized />
                      ) : story.pet?.imageUrl ? (
                        <Image loading="eager" src={story.pet.imageUrl} alt={story.pet.name} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <PawPrint className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{story.title}</h3>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {story.content.substring(0, 100)}...
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={story.author.image || undefined} />
                            <AvatarFallback>{story.author.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-500">{story.author.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" /> {story.likesCount}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="md:col-span-3">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="mb-4 h-12 w-12 text-gray-300" />
                  <p className="text-gray-500">Henüz hikaye paylaşılmamış.</p>
                  <Link href="/stories/new">
                    <Button className="mt-4" variant="outline">
                      İlk Hikayeyi Paylaş
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* 6. Eş Arayan Petler */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              <Heart className="mr-2 inline h-5 w-5 text-pink-500" />
              Eş Arayan Patiler
            </h2>
            <Link href="/matching" className="text-sm text-cici-600 hover:underline">
              Tümünü Gör <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {data?.matchingPets && data.matchingPets.length > 0 ? (
              data.matchingPets.map((pet) => (
                <Link key={pet.id} href={`/pets/${pet.id}`}>
                  <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="relative aspect-square bg-gray-100">
                      {pet.imageUrl ? (
                        <Image loading="eager" src={pet.imageUrl} alt={pet.name} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <PawPrint className="h-16 w-16 text-gray-300" />
                        </div>
                      )}
                      <Badge className="absolute right-2 top-2 bg-pink-500">
                        {pet.gender === 'erkek' ? '♂ Erkek' : '♀ Dişi'}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900">{pet.name}</h3>
                      <p className="text-sm text-gray-600">
                        {pet.species} {pet.breed && `• ${pet.breed}`}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">Sahibi: {pet.owner.name}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="md:col-span-3">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Heart className="mb-4 h-12 w-12 text-gray-300" />
                  <p className="text-gray-500">Eş arayan pet bulunamadı.</p>
                  <Link href="/matching">
                    <Button className="mt-4" variant="outline">
                      Eş Bul Sayfasına Git
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* 7. Kayıp/Sahiplendirme İlanları */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              <AlertTriangle className="mr-2 inline h-5 w-5 text-cici-500" />
              Kayıp & Sahiplendirme
            </h2>
            <Link href="/listings" className="text-sm text-cici-600 hover:underline">
              Tümünü Gör <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {data?.listings && data.listings.length > 0 ? (
              data.listings.map((listing) => (
                <Link key={listing.id} href={`/listings/${listing.id}`}>
                  <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="relative aspect-video bg-gray-100">
                      {listing.imageUrl ? (
                        <Image loading="eager" src={listing.imageUrl} alt={listing.petName} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <PawPrint className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      <Badge
                        className={`absolute left-2 top-2 ${listing.type === 'lost' ? 'bg-red-500' : 'bg-green-500'
                          }`}
                      >
                        {listing.type === 'lost' ? 'Kayıp' : 'Sahiplendirme'}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{listing.title}</h3>
                      <p className="text-sm text-gray-600">
                        {listing.petName} • {listing.species}
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" /> {listing.location}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="md:col-span-3">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Home className="mb-4 h-12 w-12 text-gray-300" />
                  <p className="text-gray-500">İlan bulunamadı.</p>
                  <Link href="/listings/new">
                    <Button className="mt-4" variant="outline">
                      İlan Oluştur
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* 8. Önerilen Ürünler */}
        {data?.affiliateProducts && data.affiliateProducts.length > 0 && (
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                <ShoppingBag className="mr-2 inline h-5 w-5 text-cici-500" />
                Önerilen Ürünler
              </h2>
            </div>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {data.affiliateProducts.map((product) => (
                <a
                  key={product.id}
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                    <div className="relative aspect-square bg-gray-100">
                      {product.imageUrl ? (
                        <Image loading="eager" src={product.imageUrl} alt={product.name} fill className="object-cover rounded-t-lg" unoptimized />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-2">{product.name}</h3>
                      {product.price && (
                        <p className="mt-1 text-sm font-bold text-cici-600">{product.price}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">{product.platform}</Badge>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
