'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Trophy,
  Calendar,
  Users,
  Star,
  Clock,
  ChevronRight,
  PawPrint,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Competition {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  status: string;
  entryPoints: number;
  winner: {
    id: string;
    name: string;
    imageUrl: string | null;
    species: string;
  } | null;
  _count: {
    entries: number;
  };
}

export default function CompetitionsClient() {
  const { data: session } = useSession() || {};
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('active');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetitions(activeTab);
  }, [activeTab]);

  const fetchCompetitions = async (status: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/competitions?status=${status}`);
      if (response.ok) {
        const data = await response.json();
        setCompetitions(data.competitions || []);
      }
    } catch (error) {
      console.error('Fetch competitions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (competition: Competition) => {
    const now = new Date();
    const start = new Date(competition.startDate);
    const end = new Date(competition.endDate);

    if (isPast(end)) {
      return <Badge variant="secondary">Sona Erdi</Badge>;
    }
    if (isFuture(start)) {
      return <Badge variant="outline">Yakında</Badge>;
    }
    return <Badge className="bg-green-500">Aktif</Badge>;
  };

  const getTimeRemaining = (competition: Competition) => {
    const now = new Date();
    const end = new Date(competition.endDate);
    const start = new Date(competition.startDate);

    if (isPast(end)) {
      return 'Yarışma sona erdi';
    }
    if (isFuture(start)) {
      return `Başlamasına ${formatDistanceToNow(start, { locale: tr })}`;
    }
    return `Bitmesine ${formatDistanceToNow(end, { locale: tr })}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <PawPrint className="w-12 h-12 animate-bounce text-orange-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Navbar />

      <main className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Yarışmalar
          </h1>
          <p className="text-gray-600 mt-1">
            Petini yarışmalara kat ve ödüller kazan!
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-8 bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="p-3 bg-yellow-200 rounded-full">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Nasıl Çalışır?</h3>
                <ul className="text-sm text-gray-700 mt-2 space-y-1">
                  <li>• Yeterli CiciPuan ile petini yarışmaya kat</li>
                  <li>• Diğer kullanıcılar petlere oy verir</li>
                  <li>• En çok oy alan pet yarışmayı kazanır!</li>
                  <li>• Kazananlar ödüller alabilir</li>
                </ul>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <p className="text-sm text-gray-500">Mevcut Puanın</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {session?.user?.points || 0}
                </p>
                <p className="text-xs text-gray-400">CiciPuan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="active" onClick={() => setActiveTab('active')}>
              <Clock className="w-4 h-4 mr-2" />
              Aktif
            </TabsTrigger>
            <TabsTrigger value="upcoming" onClick={() => setActiveTab('upcoming')}>
              <Calendar className="w-4 h-4 mr-2" />
              Yakında
            </TabsTrigger>
            <TabsTrigger value="completed" onClick={() => setActiveTab('completed')}>
              <Trophy className="w-4 h-4 mr-2" />
              Tamamlanan
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {competitions.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    {activeTab === 'active'
                      ? 'Aktif yarışma yok'
                      : activeTab === 'upcoming'
                      ? 'Yakında başlayacak yarışma yok'
                      : 'Tamamlanan yarışma yok'}
                  </h3>
                  <p className="text-gray-500">
                    Yeni yarışmalar için takipte kalın!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {competitions.map((competition, index) => (
                  <motion.div
                    key={competition.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      {competition.imageUrl && (
                        <div className="relative aspect-video bg-muted">
                          <Image
                            src={competition.imageUrl}
                            alt={competition.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Competition Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-yellow-100 rounded-full">
                                <Trophy className="w-6 h-6 text-yellow-600" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold">
                                  {competition.title}
                                </h3>
                                {getStatusBadge(competition)}
                              </div>
                            </div>

                            {competition.description && (
                              <p className="text-gray-600 mb-4">
                                {competition.description}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(competition.startDate), 'd MMM', {
                                  locale: tr,
                                })}{' '}
                                -{' '}
                                {format(new Date(competition.endDate), 'd MMM yyyy', {
                                  locale: tr,
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {competition._count.entries} Katılımcı
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="w-4 h-4" />
                                {competition.entryPoints} Puan Gerekli
                              </span>
                            </div>

                            <p className="text-sm text-orange-600 mt-3 font-medium">
                              <Clock className="w-4 h-4 inline mr-1" />
                              {getTimeRemaining(competition)}
                            </p>
                          </div>

                          {/* Winner (if completed) */}
                          {competition.winner && (
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                              <p className="text-sm text-gray-500 mb-2">Kazanan</p>
                              {competition.winner.imageUrl ? (
                                <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-4 border-yellow-400">
                                  <Image
                                    src={competition.winner.imageUrl}
                                    alt={competition.winner.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-20 h-20 mx-auto rounded-full bg-gray-200 flex items-center justify-center">
                                  <PawPrint className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              <p className="font-semibold mt-2">
                                {competition.winner.name}
                              </p>
                            </div>
                          )}

                          {/* Action Button */}
                          <div className="flex items-center">
                            <Button asChild>
                              <Link href={`/competitions/${competition.id}`}>
                                {activeTab === 'completed'
                                  ? 'Sonuçları Gör'
                                  : 'Detaylar'}
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
