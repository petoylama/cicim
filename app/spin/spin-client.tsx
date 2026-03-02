'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Gift, Clock, Trophy, History } from 'lucide-react';
import { motion } from 'framer-motion';

interface SpinReward {
  points: number;
  probability: number;
  label: string;
  color: string;
}

interface RecentSpin {
  reward: number;
  date: string;
}

export default function SpinClient() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [canSpin, setCanSpin] = useState(false);
  const [todayReward, setTodayReward] = useState<number | null>(null);
  const [recentSpins, setRecentSpins] = useState<RecentSpin[]>([]);
  const [rewards, setRewards] = useState<SpinReward[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpinStatus();
  }, []);

  async function fetchSpinStatus() {
    try {
      const res = await fetch('/api/spin');
      if (res.ok) {
        const data = await res.json();
        setCanSpin(data.canSpin);
        setTodayReward(data.todayReward);
        setRecentSpins(data.recentSpins || []);
        setRewards(data.rewards || []);
      }
    } catch (error) {
      console.error('Fetch spin status error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSpin() {
    if (!canSpin || isSpinning) return;

    setIsSpinning(true);
    setWonReward(null);

    try {
      const res = await fetch('/api/spin', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        // Kazanılan ödülün indexini bul
        const rewardIndex = rewards.findIndex(r => r.points === data.reward);
        
        // Her dilim 360/rewards.length derece
        const sliceAngle = 360 / rewards.length;
        
        // Hedef dilimi hesapla (ibre yukarıda, 0 derece yukarıda)
        // İbre 0 derecede olduğu için, dilimi 0 dereceye getirmemiz gerek
        const targetAngle = 360 - (rewardIndex * sliceAngle) - (sliceAngle / 2);
        
        // 5-7 tam tur + hedef açı
        const fullSpins = (5 + Math.floor(Math.random() * 3)) * 360;
        const newRotation = rotation + fullSpins + targetAngle - (rotation % 360);
        
        setRotation(newRotation);

        // 3 saniye sonra sonucu göster
        setTimeout(() => {
          setWonReward(data.reward);
          setCanSpin(false);
          setTodayReward(data.reward);
          setIsSpinning(false);
          update(); // Session'ı güncelle (puanlar için)
          toast({
            title: '🎉 Tebrikler!',
            description: data.message,
          });
          fetchSpinStatus(); // Geçmişi güncelle
        }, 3000);
      } else {
        setIsSpinning(false);
        toast({
          title: 'Hata',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      setIsSpinning(false);
      toast({
        title: 'Hata',
        description: 'Bir hata oluştu.',
        variant: 'destructive',
      });
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Sparkles className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full mb-4">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">CiciŞans</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Günlük Şans Çarkı</h1>
            <p className="text-gray-600">Her gün çarkı çevir, CiciPuan kazan!</p>
          </div>

          {/* Çark Kartı */}
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-8">
              <div className="relative w-64 h-64 mx-auto mb-6">
                {/* Çark */}
                <motion.div
                  className="w-full h-full rounded-full border-8 border-purple-200 relative overflow-hidden shadow-xl"
                  animate={{ rotate: rotation }}
                  transition={{ duration: 3, ease: 'easeOut' }}
                  style={{ background: 'conic-gradient(from 0deg, #10b981, #3b82f6, #8b5cf6, #f59e0b, #ef4444, #ec4899, #10b981)' }}
                >
                  {rewards.map((reward, index) => {
                    const angle = (index * 360) / rewards.length;
                    return (
                      <div
                        key={index}
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ transform: `rotate(${angle + 30}deg)` }}
                      >
                        <span className="text-white font-bold text-sm drop-shadow-lg" style={{ transform: 'translateY(-80px)' }}>
                          {reward.label}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-purple-600 z-10" />
                {/* Center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <Gift className="h-8 w-8 text-purple-500" />
                </div>
              </div>

              {/* Sonuç veya Buton */}
              {wonReward !== null && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center mb-4"
                >
                  <Badge className="text-2xl px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500">
                    🎉 +{wonReward} CiciPuan!
                  </Badge>
                </motion.div>
              )}

              {todayReward && !wonReward && (
                <div className="text-center mb-4">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    Bugün {todayReward} puan kazandınız ✓
                  </Badge>
                </div>
              )}

              <Button
                onClick={handleSpin}
                disabled={!canSpin || isSpinning}
                className="w-full h-14 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isSpinning ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 animate-spin" />
                    Çark Dönüyor...
                  </span>
                ) : canSpin ? (
                  <span className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Çarkı Çevir!
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Yarın Tekrar Gel
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Ödül Tablosu */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Ödül Tablosu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {rewards.map((reward, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg text-center text-white font-semibold"
                    style={{ backgroundColor: reward.color }}
                  >
                    <div className="text-lg">{reward.label}</div>
                    <div className="text-xs opacity-80">%{(reward.probability * 100).toFixed(0)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Son 7 Gün */}
          {recentSpins.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-gray-500" />
                  Son 7 Gün
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {recentSpins.map((spin, index) => (
                    <Badge key={index} variant="outline" className="px-3 py-1">
                      {formatDate(spin.date)}: +{spin.reward} puan
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}
