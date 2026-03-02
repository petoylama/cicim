'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Heart, MapPin, Phone, Mail, Globe, Utensils, Coins, Gift, Trophy, User, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Shelter {
  id: string;
  name: string;
  description?: string;
  location: string;
  imageUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  totalDonations: number;
}

interface Donation {
  id: string;
  pointsSpent: number;
  foodBowls: number;
  type: string;
  message?: string;
  createdAt: string;
  user: { id: string; name?: string; image?: string };
  shelter: { id: string; name: string; location: string; imageUrl?: string };
}

const POINTS_PER_BOWL = 50;

export default function DonationsClient() {
  const sessionData = useSession();
  const session = sessionData?.data;
  const update = sessionData?.update;
  const { toast } = useToast();

  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState({ totalBowls: 0, totalPoints: 0, totalDonations: 0 });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Donation dialog
  const [donateDialogOpen, setDonateDialogOpen] = useState(false);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [bowlCount, setBowlCount] = useState(1);
  const [donationMessage, setDonationMessage] = useState('');
  const [donating, setDonating] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchShelters();
    fetchDonations();
  }, []);

  async function fetchShelters() {
    try {
      const res = await fetch('/api/shelters');
      if (res.ok) {
        const data = await res.json();
        // Handle both array and object with shelters property
        setShelters(Array.isArray(data) ? data : (data.shelters || []));
      }
    } catch (error) {
      console.error('Fetch shelters error:', error);
    }
  }

  async function fetchDonations() {
    setLoading(true);
    try {
      const res = await fetch('/api/donations?limit=50');
      if (res.ok) {
        const data = await res.json();
        setDonations(data.donations);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Fetch donations error:', error);
    } finally {
      setLoading(false);
    }
  }

  const openDonateDialog = (shelter: Shelter) => {
    setSelectedShelter(shelter);
    setBowlCount(1);
    setDonationMessage('');
    setDonateDialogOpen(true);
  };

  const handleDonate = async () => {
    if (!selectedShelter || bowlCount < 1) return;

    const pointsNeeded = bowlCount * POINTS_PER_BOWL;
    if ((session?.user?.points || 0) < pointsNeeded) {
      toast({
        title: 'Yetersiz Puan',
        description: `${bowlCount} kap mama için ${pointsNeeded} CiciPuan gerekli.`,
        variant: 'destructive',
      });
      return;
    }

    setDonating(true);
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shelterId: selectedShelter.id,
          foodBowls: bowlCount,
          message: donationMessage || undefined,
        }),
      });

      if (res.ok) {
        toast({
          title: 'Bağış Başarılı! 🎉',
          description: `${selectedShelter.name} barınağına ${bowlCount} kap mama bağışladınız!`,
        });
        setDonateDialogOpen(false);
        fetchDonations();
        fetchShelters();
        // Session'u güncelle (puan düştü)
        if (update) update();
      } else {
        const data = await res.json();
        toast({
          title: 'Hata',
          description: data.error || 'Bağış yapılamadı',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Bağış yapılamadı',
        variant: 'destructive',
      });
    } finally {
      setDonating(false);
    }
  };

  const pointsNeeded = bowlCount * POINTS_PER_BOWL;
  const canAfford = (session?.user?.points || 0) >= pointsNeeded;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="h-10 w-10 text-pink-500" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">CiciBağış</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            CiciPuanlarınızı kullanarak barınaklardaki sokak hayvanlarına mama bağışlayabilirsiniz.
            <br />
            <span className="font-semibold text-orange-600">{POINTS_PER_BOWL} CiciPuan = 1 kap mama</span>
          </p>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Utensils className="h-8 w-8" />
              </div>
              <div>
                <p className="text-pink-100">Toplam Bağışlanan</p>
                <p className="text-3xl font-bold">{stats.totalBowls.toLocaleString()} Kap</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Coins className="h-8 w-8" />
              </div>
              <div>
                <p className="text-orange-100">Kullanılan Puan</p>
                <p className="text-3xl font-bold">{stats.totalPoints.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Gift className="h-8 w-8" />
              </div>
              <div>
                <p className="text-green-100">Toplam Bağış</p>
                <p className="text-3xl font-bold">{stats.totalDonations.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kullanıcı Puanı */}
        <Card className="mb-8 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500 text-white rounded-full">
                  <Coins className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Mevcut CiciPuanınız</p>
                  <p className="text-3xl font-bold text-orange-600">{session?.user?.points || 0}</p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-gray-600 dark:text-gray-400">
                  {Math.floor((session?.user?.points || 0) / POINTS_PER_BOWL)} kap mama bağışlayabilirsiniz
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Barınaklar */}
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-orange-500" />
          Barınaklar
        </h2>

        {shelters.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Henüz barınak eklenmemiş</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {shelters.map((shelter) => (
              <motion.div
                key={shelter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow">
                  <div className="relative aspect-video bg-gray-100">
                    {shelter.imageUrl ? (
                      <Image
                        src={shelter.imageUrl}
                        alt={shelter.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Heart className="h-16 w-16 text-gray-300" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-pink-500">
                      <Utensils className="h-3 w-3 mr-1" />
                      {shelter.totalDonations} kap
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle>{shelter.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {shelter.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {shelter.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {shelter.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                      {shelter.contactPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {shelter.contactPhone}
                        </span>
                      )}
                      {shelter.contactEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {shelter.contactEmail}
                        </span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-pink-500 hover:bg-pink-600"
                      onClick={() => openDonateDialog(shelter)}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Bağış Yap
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Son Bağışlar */}
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-orange-500" />
          Son Bağışlar
        </h2>

        {donations.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Gift className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Henüz bağış yapılmamış</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {donations.slice(0, 10).map((donation) => (
              <Card key={donation.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={donation.user.image || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p>
                      <span className="font-semibold">{donation.user.name || 'Anonim'}</span>
                      {' '}
                      <span className="text-pink-600 font-medium">
                        {donation.foodBowls} kap mama
                      </span>
                      {' '}bağışladı
                    </p>
                    <p className="text-sm text-gray-500">
                      {donation.shelter.name} •{' '}
                      {formatDistanceToNow(new Date(donation.createdAt), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </p>
                    {donation.message && (
                      <p className="text-sm text-gray-600 italic mt-1">"{donation.message}"</p>
                    )}
                  </div>
                  {donation.type === 'competition_prize' && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                      <Trophy className="h-3 w-3 mr-1" />
                      Yarışma Ödülü
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Bağış Dialog */}
      <Dialog open={donateDialogOpen} onOpenChange={setDonateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              {selectedShelter?.name}'a Bağış Yap
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Kap sayısı */}
            <div>
              <label className="text-sm font-medium mb-2 block">Mama Kapı Sayısı</label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setBowlCount(Math.max(1, bowlCount - 1))}
                  disabled={bowlCount <= 1}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={bowlCount}
                  onChange={(e) => setBowlCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center"
                  min={1}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setBowlCount(bowlCount + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Hızlı seçim */}
            <div className="flex gap-2">
              {[1, 4, 10, 20].map((count) => (
                <Button
                  key={count}
                  variant={bowlCount === count ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBowlCount(count)}
                  className={bowlCount === count ? 'bg-pink-500 hover:bg-pink-600' : ''}
                >
                  {count} kap
                </Button>
              ))}
            </div>

            {/* Puan hesabı */}
            <Card className={`p-4 ${canAfford ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Gerekli Puan:</span>
                <span className="font-bold text-lg">{pointsNeeded} CiciPuan</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">Mevcut Puanınız:</span>
                <span className={`font-bold ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                  {session?.user?.points || 0} CiciPuan
                </span>
              </div>
              {!canAfford && (
                <p className="text-red-600 text-sm mt-2">
                  {pointsNeeded - (session?.user?.points || 0)} puan daha gerekli
                </p>
              )}
            </Card>

            {/* Mesaj */}
            <div>
              <label className="text-sm font-medium mb-2 block">Mesaj (isteğe bağlı)</label>
              <Textarea
                placeholder="Bağışınızla birlikte bir mesaj bırakın..."
                value={donationMessage}
                onChange={(e) => setDonationMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDonateDialogOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={handleDonate}
              disabled={!canAfford || donating}
              className="bg-pink-500 hover:bg-pink-600"
            >
              {donating ? 'Bağışlanıyor...' : `${bowlCount} Kap Bağışla`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
