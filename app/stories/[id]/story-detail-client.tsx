'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Heart,
  MessageCircle,
  Share2,
  Edit,
  Trash2,
  ArrowLeft,
  Send,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Story {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  likesCount: number;
  commentsCount: number;
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
    breed: string | null;
    imageUrl: string | null;
  } | null;
  comments: Comment[];
}

export default function StoryDetailClient({ story: initialStory }: { story: Story }) {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const { toast } = useToast();
  const [story, setStory] = useState(initialStory);
  const [comments, setComments] = useState<Comment[]>(initialStory.comments || []);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const isOwner = session?.user?.id === story.author.id;

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/stories/${story.id}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setStory((prev) => ({
          ...prev,
          isLiked: data.liked,
          likesCount: data.likesCount,
        }));
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
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

  const handleDelete = async () => {
    if (!confirm('Bu hikayeyi silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/stories/${story.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Başarılı',
          description: 'Hikaye silindi',
        });
        router.push('/stories');
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Hikaye silinemedi',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    setSubmittingComment(true);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          storyId: story.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setComments((prev) => [data.comment, ...prev]);
        setNewComment('');
        setStory((prev) => ({
          ...prev,
          commentsCount: prev.commentsCount + 1,
        }));
        toast({
          title: 'Tebrikler! 🎉',
          description: `Yorumun eklendi! +${data.pointsEarned} CiciPuan kazandın!`,
        });
      } else {
        toast({
          title: 'Hata',
          description: data.error || 'Yorum eklenemedi',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Yorumu silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setStory((prev) => ({
          ...prev,
          commentsCount: Math.max(0, prev.commentsCount - 1),
        }));
        toast({
          title: 'Başarılı',
          description: 'Yorum silindi',
        });
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Yorum silinemedi',
        variant: 'destructive',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Navbar />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/stories"
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Hikayelere Dön
        </Link>

        <Card className="overflow-hidden">
          {/* Image */}
          {story.imageUrl && (
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
              <Image
                src={story.imageUrl}
                alt={story.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <CardHeader>
            {/* Author Info */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={story.author.image || ''} />
                <AvatarFallback>
                  {story.author.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{story.author.name}</p>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(story.createdAt), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </p>
              </div>
              {story.pet && (
                <Link href={`/pets/${story.pet.id}`}>
                  <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-gray-200">
                    {getSpeciesEmoji(story.pet.species)}
                    {story.pet.name}
                  </Badge>
                </Link>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold">{story.title}</h1>
          </CardHeader>

          <CardContent>
            {/* Content */}
            <p className="text-gray-700 whitespace-pre-wrap mb-6">{story.content}</p>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1 transition-colors ${
                    story.isLiked
                      ? 'text-red-500'
                      : 'text-gray-500 hover:text-red-500'
                  }`}
                >
                  <Heart
                    className={`w-6 h-6 ${story.isLiked ? 'fill-current' : ''}`}
                  />
                  <span>{story.likesCount}</span>
                </button>

                <span className="flex items-center gap-1 text-gray-500">
                  <MessageCircle className="w-6 h-6" />
                  <span>{story.commentsCount}</span>
                </span>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 text-gray-500 hover:text-green-500 transition-colors"
                >
                  <Share2 className="w-6 h-6" />
                  <span>Paylaş</span>
                </button>
              </div>

              {isOwner && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/stories/${story.id}/edit`}>
                      <Edit className="w-4 h-4 mr-1" />
                      Düzenle
                    </Link>
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Sil
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Yorumlar ({comments.length})
            </h2>
          </CardHeader>

          <CardContent>
            {/* New Comment Form */}
            <form onSubmit={handleSubmitComment} className="mb-6">
              <div className="flex gap-3">
                <Avatar>
                  <AvatarImage src={session?.user?.image || ''} />
                  <AvatarFallback>
                    {session?.user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Bir yorum yaz... (+5 CiciPuan kazan!)"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-yellow-500" />
                      Yorum yap +5 CiciPuan kazan!
                    </p>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={submittingComment || !newComment.trim()}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Gönder
                    </Button>
                  </div>
                </div>
              </div>
            </form>

            {/* Comments List */}
            {comments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Henüz yorum yok. İlk yorumu sen yap!
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                    <Avatar>
                      <AvatarImage src={comment.author.image || ''} />
                      <AvatarFallback>
                        {comment.author.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{comment.author.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                              locale: tr,
                            })}
                          </span>
                        </div>
                        {(comment.author.id === session?.user?.id ||
                          session?.user?.isAdmin) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
