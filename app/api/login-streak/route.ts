import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Günlük giriş ödülleri (1-5+ gün)
const STREAK_REWARDS = [10, 15, 20, 30, 50]; // 1, 2, 3, 4, 5+ gün için

function getStreakReward(streak: number): number {
  if (streak <= 0) return 0;
  const index = Math.min(streak - 1, STREAK_REWARDS.length - 1);
  return STREAK_REWARDS[index];
}

// GET - Mevcut streak durumunu getir
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const streak = await prisma.dailyLoginStreak.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      lastLoginDate: streak?.lastLoginDate?.toISOString() || null,
      rewards: STREAK_REWARDS,
    });
  } catch (error) {
    console.error('Get login streak error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Günlük girişi kaydet ve ödül ver
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Mevcut streak'i bul
    let streak = await prisma.dailyLoginStreak.findUnique({
      where: { userId: session.user.id },
    });

    let pointsEarned = 0;
    let newStreak = 1;
    let alreadyClaimedToday = false;

    if (streak) {
      const lastLogin = new Date(streak.lastLoginDate);
      lastLogin.setHours(0, 0, 0, 0);

      // Bugün zaten giriş yapmış mı?
      if (lastLogin.getTime() === today.getTime()) {
        alreadyClaimedToday = true;
        return NextResponse.json({
          alreadyClaimedToday: true,
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          pointsEarned: 0,
          message: 'Bugün zaten giriş ödülünüzü aldınız!',
        });
      }

      // Dün giriş yapmış mı? (seri devam ediyor mu?)
      if (lastLogin.getTime() === yesterday.getTime()) {
        newStreak = streak.currentStreak + 1;
      } else {
        // Seri kırıldı, yeniden başla
        newStreak = 1;
      }
    }

    // Ödül hesapla
    pointsEarned = getStreakReward(newStreak);

    // Transaction ile güncelle
    const updatedStreak = await prisma.$transaction(async (tx) => {
      // Streak'i güncelle veya oluştur
      const upsertedStreak = await tx.dailyLoginStreak.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          currentStreak: newStreak,
          longestStreak: newStreak,
          lastLoginDate: today,
        },
        update: {
          currentStreak: newStreak,
          longestStreak: streak ? Math.max(streak.longestStreak, newStreak) : newStreak,
          lastLoginDate: today,
        },
      });

      // Puan ver
      if (pointsEarned > 0) {
        await tx.user.update({
          where: { id: session.user.id },
          data: { points: { increment: pointsEarned } },
        });

        await tx.pointsHistory.create({
          data: {
            userId: session.user.id,
            amount: pointsEarned,
            type: 'daily_streak',
            description: `${newStreak}. gün giriş ödülü: +${pointsEarned} CiciPuan`,
          },
        });

        // Bildirim oluştur
        await tx.notification.create({
          data: {
            userId: session.user.id,
            type: 'daily_streak',
            title: '🔥 Günlük Giriş Ödülü!',
            message: `${newStreak} gün üst üste giriş yaptınız! +${pointsEarned} CiciPuan kazandınız.`,
          },
        });
      }

      return upsertedStreak;
    });

    return NextResponse.json({
      alreadyClaimedToday: false,
      currentStreak: updatedStreak.currentStreak,
      longestStreak: updatedStreak.longestStreak,
      pointsEarned,
      message: `Tebrikler! ${newStreak}. günü tamamladınız! +${pointsEarned} CiciPuan`,
    });
  } catch (error) {
    console.error('Login streak error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
