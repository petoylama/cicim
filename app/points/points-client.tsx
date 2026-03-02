'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  History,
  Star,
  MessageCircle,
  Share2,
  BookOpen,
  PawPrint,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface PointsHistoryItem {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export default function PointsClient() {
  const { data: session } = useSession() || {};
  const [history, setHistory] = useState<PointsHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    currentPoints: 0,
    totalEarned: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/points?page=${page}&limit=15`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
        setTotalPages(data.totalPages || 1);
        setStats({
          currentPoints: data.currentPoints || 0,
          totalEarned: data.totalEarned || 0,
          totalSpent: data.totalSpent || 0,
        });
      }
    } catch (error) {
      console.error('Fetch history error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (description: string) => {
    if (description.includes('Hikaye')) return <BookOpen className="w-4 h-4" />;
    if (description.includes('Yorum')) return <MessageCircle className="w-4 h-4" />;
    if (description.includes('Paylaş')) return <Share2 className="w-4 h-4" />;
    if (description.includes('Kayıt')) return <Star className="w-4 h-4" />;
    return <Coins className="w-4 h-4" />;
  };

  const earnMethods = [
    { icon: <Star className="w-6 h-6" />, title: 'İlk Kayıt', points: '+100', color: 'bg-yellow-100 text-yellow-600' },
    { icon: <BookOpen className="w-6 h-6" />, title: 'Hikaye Paylaş', points: '+20', color: 'bg-purple-100 text-purple-600' },
    { icon: <MessageCircle className="w-6 h-6" />, title: 'Yorum Yap', points: '+5', color: 'bg-blue-100 text-blue-600' },
    { icon: <Share2 className="w-6 h-6" />, title: 'Dış Paylaşım', points: '+10', color: 'bg-green-100 text-green-600' },
  ];

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

      <main className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Coins className="w-8 h-8 text-yellow-500" />
            CiciPuan
          </h1>
          <p className="text-gray-600 mt-1">Puan kazan, ödüllerini al!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm">Mevcut Puan</p>
                    <p className="text-4xl font-bold">{stats.currentPoints}</p>
                  </div>
                  <Coins className="w-12 h-12 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Toplam Kazanılan</p>
                    <p className="text-3xl font-bold text-green-500">+{stats.totalEarned}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Toplam Harcanan</p>
                    <p className="text-3xl font-bold text-red-500">-{stats.totalSpent}</p>
                  </div>
                  <TrendingDown className="w-10 h-10 text-red-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* How to Earn */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Nasıl Puan Kazanılır?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {earnMethods.map((method, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg ${method.color} text-center`}
                >
                  <div className="flex justify-center mb-2">{method.icon}</div>
                  <p className="font-medium text-sm">{method.title}</p>
                  <p className="font-bold">{method.points}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Puan Geçmişi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Henüz puan geçmişiniz yok.
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          item.type === 'EARNED'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {getActivityIcon(item.description)}
                      </div>
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(item.createdAt), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={item.type === 'EARNED' ? 'default' : 'destructive'}
                      className="text-sm"
                    >
                      {item.type === 'EARNED' ? '+' : ''}
                      {item.amount}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Önceki
                </Button>
                <span className="flex items-center px-4">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sonraki
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
