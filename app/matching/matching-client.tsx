'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Heart, HeartHandshake, Send, Check, X, PawPrint, MessageCircle, Plus, Filter } from 'lucide-react';
import { SPECIES_OPTIONS, GENDER_OPTIONS } from '@/lib/breed-data';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  gender?: string;
  age?: number;
  location?: string;
  imageUrl?: string;
  lookingForMatch?: boolean;
  owner: { id: string; name?: string; email?: string; image?: string };
}

interface MatchRequest {
  id: string;
  petId: string;
  targetPetId: string;
  status: string;
  message?: string;
  createdAt: string;
  pet: Pet;
  targetPet: Pet;
}

export default function MatchingClient() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('browse');
  const [suggestions, setSuggestions] = useState<Pet[]>([]);
  const [myPets, setMyPets] = useState<Pet[]>([]);
  const [sentRequests, setSentRequests] = useState<MatchRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtreler
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterGender, setFilterGender] = useState('all');

  // Match dialog
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [selectedTargetPet, setSelectedTargetPet] = useState<Pet | null>(null);
  const [selectedMyPet, setSelectedMyPet] = useState<string>('');
  const [matchMessage, setMatchMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  // Eş ilanı ekle dialog
  const [addMatchDialogOpen, setAddMatchDialogOpen] = useState(false);
  const [selectedPetForMatch, setSelectedPetForMatch] = useState<string>('');

  useEffect(() => {
    fetchMyPets();
  }, []);

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchSuggestions();
    } else if (activeTab === 'sent') {
      fetchRequests('sent');
    } else if (activeTab === 'received') {
      fetchRequests('received');
    }
  }, [activeTab, filterSpecies, filterGender]);

  async function fetchMyPets() {
    try {
      const res = await fetch('/api/pets?myPets=true');
      if (res.ok) {
        const data = await res.json();
        setMyPets(data.filter((p: Pet & { moderationStatus: string }) => p.moderationStatus === 'approved'));
      }
    } catch (error) {
      console.error('Fetch my pets error:', error);
    }
  }

  async function fetchSuggestions() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('lookingForMatch', 'true');
      if (filterSpecies !== 'all') params.append('species', filterSpecies);
      if (filterGender !== 'all') params.append('gender', filterGender);
      
      const res = await fetch(`/api/pets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // Kendi petlerini çıkar
        setSuggestions(data.filter((p: Pet) => p.owner.id !== session?.user?.id));
      }
    } catch (error) {
      console.error('Fetch suggestions error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRequests(type: 'sent' | 'received') {
    setLoading(true);
    try {
      const res = await fetch(`/api/pets/match/requests?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        if (type === 'sent') setSentRequests(data);
        else setReceivedRequests(data);
      }
    } catch (error) {
      console.error('Fetch requests error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendRequest() {
    if (!selectedMyPet || !selectedTargetPet) return;
    setSendingRequest(true);
    try {
      const res = await fetch(`/api/pets/${selectedTargetPet.id}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId: selectedMyPet, message: matchMessage }),
      });
      
      if (res.ok) {
        toast({ title: 'Başarılı!', description: 'Eşleşme isteği gönderildi' });
        setMatchDialogOpen(false);
        setSelectedMyPet('');
        setMatchMessage('');
        fetchSuggestions();
      } else {
        const error = await res.json();
        toast({ title: 'Hata', description: error.error || 'İstek gönderilemedi', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'İstek gönderilemedi', variant: 'destructive' });
    } finally {
      setSendingRequest(false);
    }
  }

  async function handleToggleMatchStatus(petId: string, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/pets/${petId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookingForMatch: !currentStatus }),
      });
      
      if (res.ok) {
        toast({ title: 'Başarılı!', description: !currentStatus ? 'Petiniz eş arıyor olarak işaretlendi' : 'Eş arama kapatıldı' });
        fetchMyPets();
        setAddMatchDialogOpen(false);
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'Güncellenemedi', variant: 'destructive' });
    }
  }

  async function handleRequestAction(requestId: string, action: 'accept' | 'reject') {
    try {
      const res = await fetch(`/api/pets/match/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'accept' ? 'accepted' : 'rejected' }),
      });
      
      if (res.ok) {
        toast({ title: 'Başarılı!', description: action === 'accept' ? 'Eşleşme kabul edildi' : 'Eşleşme reddedildi' });
        fetchRequests('received');
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'İşlem başarısız', variant: 'destructive' });
    }
  }

  const openMatchDialog = (pet: Pet) => {
    setSelectedTargetPet(pet);
    setMatchDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <HeartHandshake className="h-7 w-7 text-pink-500" /> Eş Bul
            </h1>
            <p className="text-gray-600 mt-1">Petinize uygun eş adayı bulun</p>
          </div>
          <Button onClick={() => setAddMatchDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Eş İlanı Ver
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="browse">Eş Arayanlar</TabsTrigger>
            <TabsTrigger value="sent">Gönderilen İstekler</TabsTrigger>
            <TabsTrigger value="received">Gelen İstekler</TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            {/* Filtreler */}
            <div className="mb-6 flex flex-wrap gap-3 items-center bg-white p-4 rounded-lg shadow-sm">
              <Filter className="h-5 w-5 text-gray-500" />
              <Select value={filterSpecies} onValueChange={setFilterSpecies}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tür" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Türler</SelectItem>
                  {SPECIES_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Cinsiyet" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {GENDER_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-12"><PawPrint className="h-8 w-8 animate-pulse mx-auto text-orange-500" /></div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Eş arayan pet bulunamadı</div>
            ) : (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {suggestions.map(pet => (
                  <Card key={pet.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openMatchDialog(pet)}>
                    <div className="relative aspect-square bg-muted">
                      {pet.imageUrl ? (
                        <Image loading="eager" src={pet.imageUrl} alt={pet.name} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex items-center justify-center h-full"><PawPrint className="h-8 w-8 text-gray-400" /></div>
                      )}
                      <Badge className="absolute top-2 left-2 text-xs">{pet.species}</Badge>
                      {pet.gender && <Badge variant="outline" className="absolute top-2 right-2 text-xs bg-white">{pet.gender === 'erkek' ? '♂' : '♀'}</Badge>}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm truncate">{pet.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{pet.breed || pet.species}</p>
                      {pet.location && <p className="text-xs text-gray-400 truncate">{pet.location}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent">
            {loading ? (
              <div className="text-center py-12"><PawPrint className="h-8 w-8 animate-pulse mx-auto text-orange-500" /></div>
            ) : sentRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Gönderilen istek yok</div>
            ) : (
              <div className="space-y-4">
                {sentRequests.map(req => (
                  <Card key={req.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12"><AvatarImage src={req.targetPet.imageUrl || ''} /><AvatarFallback><PawPrint /></AvatarFallback></Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{req.pet.name} → {req.targetPet.name}</p>
                        <p className="text-sm text-gray-500">{req.message || 'Mesaj yok'}</p>
                      </div>
                      <Badge variant={req.status === 'pending' ? 'outline' : req.status === 'accepted' ? 'default' : 'destructive'}>
                        {req.status === 'pending' ? 'Bekliyor' : req.status === 'accepted' ? 'Kabul Edildi' : 'Reddedildi'}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="received">
            {loading ? (
              <div className="text-center py-12"><PawPrint className="h-8 w-8 animate-pulse mx-auto text-orange-500" /></div>
            ) : receivedRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Gelen istek yok</div>
            ) : (
              <div className="space-y-4">
                {receivedRequests.map(req => (
                  <Card key={req.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12"><AvatarImage src={req.pet.imageUrl || ''} /><AvatarFallback><PawPrint /></AvatarFallback></Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{req.pet.name} → {req.targetPet.name}</p>
                        <p className="text-sm text-gray-500">{req.message || 'Mesaj yok'}</p>
                        <p className="text-xs text-gray-400">Sahip: {req.pet.owner.name}</p>
                      </div>
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleRequestAction(req.id, 'accept')}><Check className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRequestAction(req.id, 'reject')}><X className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Eşleşme İsteği Dialog */}
        <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eşleşme İsteği Gönder</DialogTitle>
              <DialogDescription>{selectedTargetPet?.name} için eşleşme isteği gönder</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Petinizi Seçin</Label>
                <Select value={selectedMyPet} onValueChange={setSelectedMyPet}>
                  <SelectTrigger><SelectValue placeholder="Petinizi seçin" /></SelectTrigger>
                  <SelectContent>
                    {myPets.map(pet => (
                      <SelectItem key={pet.id} value={pet.id}>{pet.name} ({pet.species})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {myPets.length === 0 && <p className="text-sm text-red-500 mt-1">Onaylı petiniz yok</p>}
              </div>
              <div>
                <Label>Mesaj (Opsiyonel)</Label>
                <Textarea value={matchMessage} onChange={(e) => setMatchMessage(e.target.value)} placeholder="Eşleşme hakkında bir şey yazın..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMatchDialogOpen(false)}>Vazgeç</Button>
              <Button onClick={handleSendRequest} disabled={!selectedMyPet || sendingRequest}>
                {sendingRequest ? 'Gönderiliyor...' : 'İstek Gönder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Eş İlanı Ekle Dialog */}
        <Dialog open={addMatchDialogOpen} onOpenChange={setAddMatchDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eş İlanı Ver</DialogTitle>
              <DialogDescription>Petinizi eş arayanlar listesine ekleyin</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {myPets.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">Henüz onaylı petiniz yok</p>
                  <Button asChild><Link href="/pets/new">Pet Ekle</Link></Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myPets.map(pet => (
                    <div key={pet.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar><AvatarImage src={pet.imageUrl || ''} /><AvatarFallback><PawPrint /></AvatarFallback></Avatar>
                        <div>
                          <p className="font-medium">{pet.name}</p>
                          <p className="text-sm text-gray-500">{pet.species}</p>
                        </div>
                      </div>
                      <Button
                        variant={pet.lookingForMatch ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleToggleMatchStatus(pet.id, pet.lookingForMatch || false)}
                      >
                        {pet.lookingForMatch ? 'Kaldır' : 'Eş Ara'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
