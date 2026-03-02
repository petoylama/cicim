'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Share2, Plus, BookOpen, PawPrint } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Story {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  likesCount: number;
  sharesCount: number;
  createdAt: string;
  isLiked: boolean;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  pet: {
    id: string;
    name: string;
    species: string;
    imageUrl: string | null;
  } | null;
  _count: {
    comments: number;
  };
}

export default function StoriesClient() {
  const { data: session } = useSession() || {};
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStories();
  }, [page]);

  const fetchStories = async () => {
    try {
      const response = await fetch(`/api/stories?page=${page}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setStories(data.stories || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch stories error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (storyId: string) => {
    try {
      const response = await fetch(`/api/stories/${storyId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setStories((prev) =>
          prev.map((s) =>
            s.id === storyId
              ? { ...s, isLiked: data.liked, likesCount: data.likesCount }
              : s
          )
        );
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleShare = async (story: Story) => {
    const url = `${window.location.origin}/stories/${story.id}`;
    if (navigator?.share) {
      try {
        await navigator.share({
          title: story.title,
          text: story.content.substring(0, 100) + '...',
          url,
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    } else {
      navigator?.clipboard?.writeText?.(url);
      toast({
        title: 'Başarılı',
        description: 'Link kopyalandı!',
      });
    }
  };

  const getSpeciesEmoji = (species: string) => {
    const emojis: { [key: string]: string } = {
      dog: '🐶',
      cat: '🐱',
      bird: '🐦',
      fish: '🐟',
      rabbit: '🐰',
      hamster: '🐹',
      other: '🐾',
    };
    return emojis[species?.toLowerCase()] || '🐾';
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

      <main className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-purple-500" />
              Hikayeler
            </h1>
            <p className="text-gray-600 mt-1">
              Pet sahiplerinin paylaştığı eğlenceli anılar
            </p>
          </div>
          <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500">
            <Link href="/stories/new">
              <Plus className="w-4 h-4 mr-2" />
              Hikaye Paylaş
            </Link>
          </Button>
        </div>

        {/* Stories List */}
        {stories.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Henüz hikaye yok
              </h3>
              <p className="text-gray-500 mb-4">
                İlk hikayeni paylaşarak +20 CiciPuan kazan!
              </p>
              <Button asChild>
                <Link href="/stories/new">Hikaye Paylaş</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {stories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Story Image */}
                  {story.imageUrl && (
                    <Link href={`/stories/${story.id}`}>
                      <div className="relative aspect-video w-full overflow-hidden bg-muted">
                        <Image
                          src={story.imageUrl}
                          alt={story.title}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </Link>
                  )}

                  <CardHeader className="pb-2">
                    {/* Author Info */}
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar>
                        <AvatarImage src={story.author.image || ''} />
                        <AvatarFallback>
                          {story.author.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{story.author.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(story.createdAt), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </p>
                      </div>
                      {story.pet && (
                        <Badge variant="secondary" className="gap-1">
                          {getSpeciesEmoji(story.pet.species)}
                          {story.pet.name}
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <Link href={`/stories/${story.id}`}>
                      <CardTitle className="text-xl hover:text-purple-600 transition-colors cursor-pointer">
                        {story.title}
                      </CardTitle>
                    </Link>
                  </CardHeader>

                  <CardContent>
                    {/* Content Preview */}
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {story.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-4 border-t">
                      <button
                        onClick={() => handleLike(story.id)}
                        className={`flex items-center gap-1 transition-colors ${
                          story.isLiked
                            ? 'text-red-500'
                            : 'text-gray-500 hover:text-red-500'
                        }`}
                      >
                        <Heart
                          className={`w-5 h-5 ${story.isLiked ? 'fill-current' : ''}`}
                        />
                        <span className="text-sm">{story.likesCount}</span>
                      </button>

                      <Link
                        href={`/stories/${story.id}`}
                        className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">{story._count?.comments || 0}</span>
                      </Link>

                      <button
                        onClick={() => handleShare(story)}
                        className="flex items-center gap-1 text-gray-500 hover:text-green-500 transition-colors"
                      >
                        <Share2 className="w-5 h-5" />
                        <span className="text-sm">Paylaş</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

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
          </div>
        )}
      </main>
    </div>
  );
}
