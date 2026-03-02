import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Çark ödülleri ve olasılıkları
const SPIN_REWARDS = [
  { points: 5, probability: 0.25, label: '5 Puan', color: '#10b981' },
  { points: 10, probability: 0.25, label: '10 Puan', color: '#3b82f6' },
  { points: 15, probability: 0.20, label: '15 Puan', color: '#8b5cf6' },
  { points: 25, probability: 0.15, label: '25 Puan', color: '#f59e0b' },
  { points: 50, probability: 0.10, label: '50 Puan', color: '#ef4444' },
  { points: 100, probability: 0.05, label: '100 Puan', color: '#ec4899' },
];

function getRandomReward() {
  const random = Math.random();
  let cumulative = 0;
  for (const reward of SPIN_REWARDS) {
    cumulative += reward.probability;
    if (random <= cumulative) {
      return reward;
    }
  }
  return SPIN_REWARDS[0];
}

// GET - Bugün çevirip çevirmediğini kontrol et
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySpin = await prisma.dailySpin.findFirst({
      where: {
        userId: session.user.id,
        spinDate: { gte: today },
      },
    });

    // Son 7 günlük spin geçmişi
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const recentSpins = await prisma.dailySpin.findMany({
      where: {
        userId: session.user.id,
        spinDate: { gte: weekAgo },
      },
      orderBy: { spinDate: 'desc' },
      take: 7,
    });

    return NextResponse.json({
      canSpin: !todaySpin,
      todayReward: todaySpin?.reward || null,
      recentSpins: recentSpins.map((s: typeof recentSpins[0]) => ({
        reward: s.reward,
        date: s.spinDate.toISOString(),
      })),
      rewards: SPIN_REWARDS,
    });
  } catch (error) {
    console.error('Get spin status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Çarkı çevir
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Bugün zaten çevirmiş mi?
    const todaySpin = await prisma.dailySpin.findFirst({
      where: {
        userId: session.user.id,
        spinDate: { gte: today },
      },
    });

    if (todaySpin) {
      return NextResponse.json(
        { error: 'Bugün zaten çark çevirdiniz! Yarın tekrar deneyin.' },
        { status: 400 }
      );
    }

    // Rastgele ödül belirle
    const reward = getRandomReward();

    // Transaction ile spin ve puan güncelle
    const [spin] = await prisma.$transaction([
      prisma.dailySpin.create({
        data: {
          userId: session.user.id,
          reward: reward.points,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { points: { increment: reward.points } },
      }),
      prisma.pointsHistory.create({
        data: {
          userId: session.user.id,
          amount: reward.points,
          type: 'daily_spin',
          description: `CiciŞans çarkından ${reward.points} puan kazandınız!`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      reward: reward.points,
      label: reward.label,
      message: `Tebrikler! ${reward.points} CiciPuan kazandınız!`,
    });
  } catch (error) {
    console.error('Spin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
