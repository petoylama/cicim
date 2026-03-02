'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MapPin, Calendar, User, PawPrint, Edit, Trash2, Heart, MessageCircle, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Listing {
  id: string;
  type: string;
  title: string;
  description: string;
  petName: string;
  species: string;
  breed?: string;
  gender?: string;
  age?: string;
  color?: string;
  location: string;
  imageUrl?: string;
  status: string;
  lastSeenDate?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  user: { id: string; name?: string; email?: string; image?: string };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name?: string; image?: string };
}

export default function ListingDetailClient() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchListing();
    fetchLikeStatus();
    fetchComments();
  }, [id]);

  async function fetchListing() {
    try {
      const res = await fetch(`/api/listings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setListing(data);
        setNewStatus(data.status);
        setLikesCount(data.likesCount || 0);
      } else {
        toast({ title: 'Hata', description: 'İlan bulunamadı.', variant: 'destructive' });
        router.push('/listings');
      }
    } catch (error) {
      console.error('Fetch listing error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLikeStatus() {
    try {
      const res = await fetch(`/api/listings/${id}/like`);
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
      }
    } catch (error) {
      console.error('Fetch like status error:', error);
    }
  }

  async function fetchComments() {
    try {
      const res = await fetch(`/api/listings/${id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Fetch comments error:', error);
    }
  }

  async function handleLike() {
    try {
      const res = await fetch(`/api/listings/${id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikesCount(data.likesCount);
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/listings/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        const comment = await res.json();
        setComments([comment, ...comments]);
        setNewComment('');
        if (listing) setListing({ ...listing, commentsCount: listing.commentsCount + 1 });
        toast({ title: 'Başarılı', description: 'Yorumunuz eklendi.' });
      } else {
        const data = await res.json();
        toast({ title: 'Hata', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'Yorum eklenemedi.', variant: 'destructive' });
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleSendMessage() {
    if (!messageContent.trim() || !listing) return;
    setSendingMessage(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: listing.user.id, content: messageContent }),
      });

      if (res.ok) {
        toast({ title: 'Başarılı', description: 'Mesajınız gönderildi.' });
        setMessageDialogOpen(false);
        setMessageContent('');
      } else {
        const data = await res.json();
        toast({ title: 'Hata', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'Mesaj gönderilemedi.', variant: 'destructive' });
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleStatusChange() {
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setListing(data);
        setStatusDialogOpen(false);
        toast({ title: 'Başarılı', description: 'İlan durumu güncellendi.' });
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'Bir hata oluştu.', variant: 'destructive' });
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Başarılı', description: 'İlan silindi.' });
        router.push('/listings');
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'Bir hata oluştu.', variant: 'destructive' });
    }
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  const getStatusBadge = () => {
    if (!listing) return null;
    if (listing.type === 'lost') {
      if (listing.status === 'found') return <Badge className="bg-green-500 text-lg px-4 py-1">Bulundu ✓</Badge>;
      return <Badge className="bg-red-500 text-lg px-4 py-1">Kayıp</Badge>;
    } else {
      if (listing.status === 'adopted') return <Badge className="bg-green-500 text-lg px-4 py-1">Sahiplenildi ✓</Badge>;
      return <Badge className="bg-blue-500 text-lg px-4 py-1">Sahiplendirme</Badge>;
    }
  };

  const isOwner = session?.user?.id === listing?.user.id || session?.user?.isAdmin;
  const canMessage = session?.user?.id && session?.user?.id !== listing?.user.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]"><PawPrint className="h-8 w-8 animate-bounce text-orange-500" /></div>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/listings" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> İlanlara Dön
        </Link>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="overflow-hidden">
            <div className="relative aspect-square bg-gray-100">
              {listing.imageUrl ? (
                <Image loading="eager" src={listing.imageUrl} alt={listing.petName} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><PawPrint className="h-24 w-24 text-gray-300" /></div>
              )}
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  {getStatusBadge()}
                  {isOwner && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setStatusDialogOpen(true)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>

                <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
                <p className="text-xl text-gray-700 mb-4">
                  <span className="font-semibold">{listing.petName}</span>
                  {listing.breed && ` - ${listing.breed}`}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Tür:</span><span className="ml-2 font-medium">{listing.species}</span></div>
                  <div><span className="text-gray-500">Cinsiyet:</span><span className="ml-2 font-medium">{listing.gender || '-'}</span></div>
                  <div><span className="text-gray-500">Yaş:</span><span className="ml-2 font-medium">{listing.age || '-'}</span></div>
                  <div><span className="text-gray-500">Renk:</span><span className="ml-2 font-medium">{listing.color || '-'}</span></div>
                </div>

                <div className="flex items-center gap-2 mt-4 text-gray-600">
                  <MapPin className="h-4 w-4" /><span>{listing.location}</span>
                </div>

                {listing.lastSeenDate && (
                  <div className="flex items-center gap-2 mt-2 text-gray-600">
                    <Calendar className="h-4 w-4" /><span>Son görülme: {formatDate(listing.lastSeenDate)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Açıklama</CardTitle></CardHeader>
              <CardContent><p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p></CardContent>
            </Card>

            {/* İlan Sahibi - Mesaj Gönder */}
            <Card>
              <CardHeader><CardTitle>İlan Sahibi</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={listing.user.image || ''} />
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{listing.user.name || 'Anonim'}</p>
                      <p className="text-xs text-gray-400">İlan tarihi: {formatDate(listing.createdAt)}</p>
                    </div>
                  </div>
                  {canMessage && (
                    <Button onClick={() => setMessageDialogOpen(true)} className="gap-2">
                      <MessageCircle className="h-4 w-4" /> Mesaj Gönder
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Like and Comment Section */}
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant={liked ? 'default' : 'outline'} onClick={handleLike} className={liked ? 'bg-pink-500 hover:bg-pink-600' : ''}>
              <Heart className={`h-5 w-5 mr-2 ${liked ? 'fill-current' : ''}`} />{liked ? 'Beğenildi' : 'Beğen'}
            </Button>
            <span className="text-gray-600"><Heart className="h-4 w-4 inline mr-1 text-pink-500" />{likesCount} beğeni</span>
            <span className="text-gray-600"><MessageCircle className="h-4 w-4 inline mr-1 text-blue-500" />{listing.commentsCount} yorum</span>
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-blue-500" />Yorumlar ({listing.commentsCount})</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAddComment} className="mb-6">
                <Textarea placeholder="Yorum yazın..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={3} className="mb-2" />
                <Button type="submit" disabled={!newComment.trim() || submittingComment}>
                  <Send className="h-4 w-4 mr-2" />{submittingComment ? 'Gönderiliyor...' : 'Yorum Yap'}
                </Button>
              </form>

              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Henüz yorum yok. İlk yorumu siz yapın!</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                      <Avatar><AvatarImage src={comment.user.image || ''} /><AvatarFallback><User className="h-4 w-4" /></AvatarFallback></Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{comment.user.name || 'Anonim'}</span>
                          <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: tr })}</span>
                        </div>
                        <p className="text-gray-700 mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mesaj Dialog */}
        <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>İlan Sahibine Mesaj Gönder</DialogTitle></DialogHeader>
            <Textarea placeholder="Mesajınızı yazın..." value={messageContent} onChange={(e) => setMessageContent(e.target.value)} rows={4} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>Vazgeç</Button>
              <Button onClick={handleSendMessage} disabled={!messageContent.trim() || sendingMessage}>
                {sendingMessage ? 'Gönderiliyor...' : 'Gönder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>İlan Durumunu Güncelle</DialogTitle></DialogHeader>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktif</SelectItem>
                {listing.type === 'lost' && <SelectItem value="found">Bulundu</SelectItem>}
                {listing.type === 'adoption' && <SelectItem value="adopted">Sahiplenildi</SelectItem>}
                <SelectItem value="closed">Kapatıldı</SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Vazgeç</Button>
              <Button onClick={handleStatusChange}>Güncelle</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>İlanı Sil</DialogTitle></DialogHeader>
            <p>İlanı silmek istediğinizden emin misiniz?</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Vazgeç</Button>
              <Button variant="destructive" onClick={handleDelete}>Sil</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
