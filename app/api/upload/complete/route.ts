import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFileUrl } from '@/lib/s3';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cloud_storage_path, isPublic } = await request.json();

    if (!cloud_storage_path) {
      return NextResponse.json({ error: 'cloud_storage_path required' }, { status: 400 });
    }

    const url = await getFileUrl(cloud_storage_path, isPublic ?? true);

    return NextResponse.json({ url, cloud_storage_path, isPublic });
  } catch (error: any) {
    console.error('Upload complete error:', error);
    return NextResponse.json({ error: 'Failed to complete upload' }, { status: 500 });
  }
}
