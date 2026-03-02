import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// POST - 15 günden eski hikayeleri sil (Scheduled task tarafından çağrılır)
export async function POST(request: Request) {
  try {
    // API key ile basit auth (scheduled task için)
    const authHeader = request.headers.get('authorization');
    const expectedKey = process.env.CLEANUP_API_KEY || 'cicipet-cleanup-secret';

    if (authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 15 gün önceki tarih
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    // Silinecek hikayeleri bul
    const oldStories = await prisma.story.findMany({
      where: {
        createdAt: { lt: fifteenDaysAgo },
      },
      select: {
        id: true,
        cloudStoragePath: true,
        title: true,
      },
    });

    let deletedCount = 0;
    const errors: string[] = [];

    for (const story of oldStories) {
      try {
        // S3'ten resmi sil (varsa)
        if (story.cloudStoragePath) {
          try {
            await deleteFile(story.cloudStoragePath);
          } catch (s3Error) {
            console.error(`S3 delete error for story ${story.id}:`, s3Error);
            // S3 hatası olsa bile hikayeyi sil
          }
        }

        // İlişkili yorumları sil
        await prisma.comment.deleteMany({
          where: { storyId: story.id },
        });

        // İlişkili beğenileri sil
        await prisma.like.deleteMany({
          where: { storyId: story.id },
        });

        // Hikayeyi sil
        await prisma.story.delete({
          where: { id: story.id },
        });

        deletedCount++;
      } catch (storyError) {
        console.error(`Error deleting story ${story.id}:`, storyError);
        errors.push(`Story ${story.id}: ${storyError}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${deletedCount} hikaye silindi.`,
      totalFound: oldStories.length,
      deleted: deletedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Cleanup stories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Silinecek hikaye sayısını kontrol et
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedKey = process.env.CLEANUP_API_KEY || 'cicipet-cleanup-secret';

    if (authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const count = await prisma.story.count({
      where: {
        createdAt: { lt: fifteenDaysAgo },
      },
    });

    return NextResponse.json({
      pendingDeletion: count,
      cutoffDate: fifteenDaysAgo.toISOString(),
    });
  } catch (error) {
    console.error('Check cleanup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
