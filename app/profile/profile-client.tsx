'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, PawPrint, BookOpen, MapPin, Edit, Trash2, Plus, Settings, Coins, Camera } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  imageUrl?: string;
  moderationStatus: string;
  likesCount: number;
}

interface Story {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  pet: { id: string; name: string };
}

interface Listing {
  id: string;
  type: string;
  title: string;
  petName: string;
  location: string;
  status: string;
  imageUrl?: string;
  createdAt: string;
}

export default function ProfileClient() {
  const { data: session, update } = useSession();
  const { toast } = useToast();

  const [pets, setPets] = useState<Pet[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', image: '' });
  const [saving, setSaving] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<{ type: string; id: string } | null>(null);

  useEffect(() => {
    if (session?.user) {
      setProfileData({ name: session.user.name || '', image: session.user.image || '' });
      fetchUserData();
    }
  }, [session?.user?.id]);

  async function fetchUserData() {
    setLoading(true);
    try {
      const [petsRes, storiesRes, listingsRes] = await Promise.all([
        fetch('/api/pets?myPets=true'),
        fetch('/api/stories?myStories=true'),
        fetch('/api/listings?myListings=true'),
      ]);

      if (petsRes.ok) setPets(await petsRes.json());
      if (storiesRes.ok) {
        const data = await storiesRes.json();
        setStories(data.stories || data);
      }
      if (listingsRes.ok) setListings(await listingsRes.json());
    } catch (error) {
      console.error('Fetch user data error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile() {
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (res.ok) {
        await update({ name: profileData.name });
        toast({ title: 'Başarılı', description: 'Profil güncellendi' });
        setEditDialogOpen(false);
      } else {
        const data = await res.json();
        toast({ title: 'Hata', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'Güncellenemedi', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(type: string, id: string) {
    try {
      const endpoint = type === 'pet' ? `/api/pets/${id}` : type === 'story' ? `/api/stories/${id}` : `/api/listings/${id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });

      if (res.ok) {
        toast({ title: 'Başarılı', description: 'Silindi' });
        fetchUserData();
      } else {
        toast({ title: 'Hata', description: 'Silinemedi', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'Bir hata oluştu', variant: 'destructive' });
    } finally {
      setDeleteDialog(null);
    }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      pending: { color: 'bg-yellow-500', text: 'Bekliyor' },
      approved: { color: 'bg-green-500', text: 'Onaylı' },
      rejected: { color: 'bg-red-500', text: 'Reddedildi' },
      active: { color: 'bg-blue-500', text: 'Aktif' },
      found: { color: 'bg-green-500', text: 'Bulundu' },
      adopted: { color: 'bg-green-500', text: 'Sahiplenildi' },
      closed: { color: 'bg-gray-500', text: 'Kapatıldı' },
    };
    const item = map[status] || { color: 'bg-gray-500', text: status };
    return <Badge className={item.color}>{item.text}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        {/* Profil Başlığı */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="text-2xl"><User /></AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold">{session?.user?.name || 'Kullanıcı'}</h1>
                <p className="text-gray-600">{session?.user?.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-2">
                  <span className="flex items-center gap-1 text-yellow-600">
                    <Coins className="h-5 w-5" /> {session?.user?.points || 0} CiciPuan
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <PawPrint className="h-5 w-5" /> {pets.length} Pet
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <BookOpen className="h-5 w-5" /> {stories.length} Hikaye
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" /> Düzenle
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/settings"><Settings className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="pets">
          <TabsList className="mb-6">
            <TabsTrigger value="pets">Petlerim</TabsTrigger>
            <TabsTrigger value="stories">Hikayelerim</TabsTrigger>
            <TabsTrigger value="listings">İlanlarım</TabsTrigger>
          </TabsList>

          {/* Petlerim */}
          <TabsContent value="pets">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Petlerim</h2>
              <Button asChild size="sm"><Link href="/pets/new"><Plus className="h-4 w-4 mr-1" /> Pet Ekle</Link></Button>
            </div>
            {loading ? (
              <div className="text-center py-8"><PawPrint className="h-8 w-8 animate-pulse mx-auto text-orange-500" /></div>
            ) : pets.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-gray-500 mb-4">Henüz pet eklemediniz</p>
                <Button asChild><Link href="/pets/new">Pet Ekle</Link></Button>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                {pets.map(pet => (
                  <Card key={pet.id} className="overflow-hidden">
                    <div className="relative aspect-square bg-muted">
                      {pet.imageUrl ? (
                        <Image loading="eager" src={pet.imageUrl} alt={pet.name} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex items-center justify-center h-full"><PawPrint className="h-8 w-8 text-gray-400" /></div>
                      )}
                      <div className="absolute top-2 left-2">{getStatusBadge(pet.moderationStatus)}</div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold truncate">{pet.name}</h3>
                      <p className="text-sm text-gray-500">{pet.species}</p>
                      <div className="flex justify-between mt-2">
                        <Button size="sm" variant="outline" asChild><Link href={`/pets/${pet.id}/edit`}><Edit className="h-3 w-3" /></Link></Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteDialog({ type: 'pet', id: pet.id })}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Hikayelerim */}
          <TabsContent value="stories">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Hikayelerim</h2>
              <Button asChild size="sm"><Link href="/stories/new"><Plus className="h-4 w-4 mr-1" /> Hikaye Ekle</Link></Button>
            </div>
            {loading ? (
              <div className="text-center py-8"><PawPrint className="h-8 w-8 animate-pulse mx-auto text-orange-500" /></div>
            ) : stories.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-gray-500 mb-4">Henüz hikaye paylaşmadınız</p>
                <Button asChild><Link href="/stories/new">Hikaye Paylaş</Link></Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {stories.map(story => (
                  <Card key={story.id} className="p-4">
                    <div className="flex gap-4">
                      {story.imageUrl && (
                        <div className="relative w-20 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
                          <Image loading="eager" src={story.imageUrl} alt={story.title} fill className="object-cover" unoptimized />
                        </div>
                      )}
                      <div className="flex-1">
                        <Link href={`/stories/${story.id}`} className="font-semibold hover:text-orange-600">{story.title}</Link>
                        <p className="text-sm text-gray-500 line-clamp-2">{story.content}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true, locale: tr })} • {story.likesCount} beğeni
                        </p>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteDialog({ type: 'story', id: story.id })}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* İlanlarım */}
          <TabsContent value="listings">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">İlanlarım</h2>
              <Button asChild size="sm"><Link href="/listings/new"><Plus className="h-4 w-4 mr-1" /> İlan Ver</Link></Button>
            </div>
            {loading ? (
              <div className="text-center py-8"><PawPrint className="h-8 w-8 animate-pulse mx-auto text-orange-500" /></div>
            ) : listings.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-gray-500 mb-4">Henüz ilan vermediniz</p>
                <Button asChild><Link href="/listings/new">İlan Ver</Link></Button>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                {listings.map(listing => (
                  <Card key={listing.id} className="overflow-hidden">
                    <div className="relative aspect-square bg-muted">
                      {listing.imageUrl ? (
                        <Image loading="eager" src={listing.imageUrl} alt={listing.petName} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex items-center justify-center h-full"><PawPrint className="h-8 w-8 text-gray-400" /></div>
                      )}
                      <div className="absolute top-2 left-2">{getStatusBadge(listing.status)}</div>
                      <Badge className="absolute top-2 right-2" variant="outline">{listing.type === 'lost' ? 'Kayıp' : 'Sahiplendirme'}</Badge>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold truncate">{listing.petName}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{listing.location}</p>
                      <div className="flex justify-between mt-2">
                        <Button size="sm" variant="outline" asChild><Link href={`/listings/${listing.id}`}><Edit className="h-3 w-3" /></Link></Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteDialog({ type: 'listing', id: listing.id })}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Profil Düzenleme Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Profili Düzenle</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>İsim</Label>
                <Input value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Vazgeç</Button>
              <Button onClick={handleUpdateProfile} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Silme Onay Dialog */}
        <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Silme Onayı</DialogTitle></DialogHeader>
            <p>Bu öğeyi silmek istediğinizden emin misiniz?</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(null)}>Vazgeç</Button>
              <Button variant="destructive" onClick={() => deleteDialog && handleDelete(deleteDialog.type, deleteDialog.id)}>Sil</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
