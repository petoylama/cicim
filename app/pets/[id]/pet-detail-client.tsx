'use client';

import { useState, useEffect } from 'react';
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

export default function PetDetailClient({ pet, initialComments = [], initialIsLiked = false }: {
  pet: any;
  initialComments?: Comment[];
  initialIsLiked?: boolean;
}) {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const { toast } = useToast();
  const [liked, setLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(pet?.likesCount ?? 0);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentsCount, setCommentsCount] = useState(pet?.commentsCount ?? 0);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const isOwner = session?.user?.id === pet?.owner?.id;

  // Yorumları yükle (eğer initial comments yoksa)
  useEffect(() => {
    if (initialComments.length === 0 && pet?.id) {
      fetchComments();
    }
  }, [pet?.id]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/pets/${pet?.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Fetch comments error:', error);
    }
  };

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/pets/${pet?.id}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data?.liked ?? false);
        setLikesCount(data?.likesCount ?? 0);
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleShare = async () => {
    if (navigator?.share) {
      try {
        await navigator.share({
          title: pet?.name ?? 'Pet',
          text: pet?.description ?? '',
          url: window.location.href,
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    } else {
      navigator?.clipboard?.writeText?.(window.location.href);
      toast({
        title: 'Başarılı',
        description: 'Link kopyalandı',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu peti silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/pets/${pet?.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Başarılı',
          description: 'Pet silindi',
        });
        router.push('/pets');
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Pet silinemedi',
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
          petId: pet?.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setComments((prev) => [data.comment, ...prev]);
        setNewComment('');
        setCommentsCount((prev: number) => prev + 1);
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
        setCommentsCount((prev: number) => Math.max(0, prev - 1));
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
          href="/pets"
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Petlere Dön
        </Link>

        <Card className="overflow-hidden">
          {/* Image */}
          {pet?.imageUrl && (
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
              <Image
                src={pet.imageUrl}
                alt={pet?.name ?? 'Pet'}
                fill
                className="object-cover"
              />
            </div>
          )}

          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  {getSpeciesEmoji(pet?.species)} {pet?.name}
                </h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>{pet?.species}</Badge>
                  {pet?.breed && <Badge variant="outline">{pet.breed}</Badge>}
                  {pet?.age && <Badge variant="outline">{pet.age} yaş</Badge>}
                  {pet?.gender && <Badge variant="outline">{pet.gender}</Badge>}
                  {pet?.moderationStatus === 'pending' && (
                    <Badge variant="secondary">Onay Bekliyor</Badge>
                  )}
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" asChild>
                    <Link href={`/pets/${pet?.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Owner */}
            <div className="mt-4 flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={pet?.owner?.image ?? undefined} />
                <AvatarFallback>{pet?.owner?.name?.charAt(0) ?? 'U'}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{pet?.owner?.name}</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Description */}
            {pet?.description && (
              <div>
                <h3 className="mb-2 font-semibold">Hakkında</h3>
                <p className="text-gray-600">{pet.description}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  liked
                    ? 'bg-red-50 text-red-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                }`}
              >
                <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
                <span>{likesCount} Beğeni</span>
              </button>

              <span className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600">
                <MessageCircle className="h-5 w-5" />
                <span>{commentsCount} Yorum</span>
              </span>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-500 transition-colors"
              >
                <Share2 className="h-5 w-5" />
                <span>Paylaş</span>
              </button>
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
