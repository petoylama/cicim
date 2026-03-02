'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, PawPrint, BookOpen, Trophy, AlertTriangle, Check, X, Trash2, Plus, Home as HomeIcon, Calendar, FileText, Gift, Eye, Bot, ShieldAlert, ShoppingBag, Newspaper, Layout, Edit } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { TURKEY_CITIES, getDistrictOptions } from '@/lib/turkey-locations';

interface Stats {
  totalUsers: number;
  totalPets: number;
  pendingPets: number;
  totalStories: number;
  activeCompetitions: number;
  totalReports: number;
  pendingReports: number;
  totalShelters: number;
  totalDonations: number;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  imageUrl: string | null;
  moderationStatus: string;
  createdAt: string;
  owner: { id: string; name: string | null; email: string | null };
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isAdmin: boolean;
  points: number;
  createdAt: string;
  _count: { pets: number; stories: number };
}

interface Competition {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  status: string;
  entryPoints: number;
  topic: string | null;
  category: string;
  maxParticipants: number | null;
  _count: { entries: number };
}

interface Shelter {
  id: string;
  name: string;
  location: string;
  description: string | null;
  imageUrl: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  totalDonations: number;
  isActive: boolean;
}

interface Report {
  id: string;
  type: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { name: string | null; email: string | null };
}

interface AffiliateProduct {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  affiliateUrl: string;
  platform: string;
  price: string | null;
  sortOrder: number;
  isActive: boolean;
}

export default function AdminClient() {
  const { data: session } = useSession() || {};
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingPets, setPendingPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Bot/Suspicious users
  const [suspiciousUsers, setSuspiciousUsers] = useState<{ id: string; name: string | null; email: string | null; isAdmin: boolean }[]>([]);
  const [cleaningBots, setCleaningBots] = useState(false);

  // New content management
  const [affiliateProducts, setAffiliateProducts] = useState<AffiliateProduct[]>([]);

  // Dialogs
  const [competitionDialog, setCompetitionDialog] = useState(false);
  const [shelterDialog, setShelterDialog] = useState(false);
  const [affiliateDialog, setAffiliateDialog] = useState(false);
  const [editingShelter, setEditingShelter] = useState<Shelter | null>(null);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [editingAffiliate, setEditingAffiliate] = useState<AffiliateProduct | null>(null);

  // Form states
  const [competitionForm, setCompetitionForm] = useState({
    title: '', description: '', startDate: '', endDate: '', entryPoints: 50, imageUrl: '',
    topic: '', category: 'appearance', maxParticipants: ''
  });
  const [shelterForm, setShelterForm] = useState({
    name: '', city: '', district: '', description: '', imageUrl: '', contactPhone: '', contactEmail: '', isActive: true
  });
  const [affiliateForm, setAffiliateForm] = useState({
    name: '', description: '', imageUrl: '', affiliateUrl: '', platform: 'trendyol', price: '', sortOrder: 0
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchPendingPets();
    fetchReports();
    fetchSuspiciousUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'competitions') fetchCompetitions();
    if (activeTab === 'shelters') fetchShelters();
    if (activeTab === 'affiliates') fetchAffiliateProducts();
  }, [activeTab]);

  async function fetchSuspiciousUsers() {
    try {
      const res = await fetch('/api/admin/cleanup-bots');
      if (res.ok) {
        const data = await res.json();
        setSuspiciousUsers(data.users || []);
      }
    } catch (error) { console.error(error); }
  }

  async function handleCleanupBots() {
    if (!confirm(`${suspiciousUsers.length} şüpheli kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) return;
    setCleaningBots(true);
    try {
      const res = await fetch('/api/admin/cleanup-bots', { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        toast({ title: 'Başarılı', description: data.message });
        fetchSuspiciousUsers();
        fetchUsers();
        fetchStats();
      } else {
        toast({ title: 'Hata', description: 'Temizleme başarısız', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'Bir hata oluştu', variant: 'destructive' });
    } finally {
      setCleaningBots(false);
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) setStats(await res.json());
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  }

  async function fetchPendingPets() {
    try {
      const res = await fetch('/api/admin/pets/pending');
      if (res.ok) {
        const data = await res.json();
        setPendingPets(data.pets || []);
      }
    } catch (error) { console.error(error); }
  }

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) setUsers(await res.json());
    } catch (error) { console.error(error); }
  }

  async function fetchCompetitions() {
    try {
      const res = await fetch('/api/admin/competitions');
      if (res.ok) {
        const data = await res.json();
        setCompetitions(data.competitions || []);
      }
    } catch (error) { console.error(error); }
  }

  async function fetchShelters() {
    try {
      const res = await fetch('/api/shelters');
      if (res.ok) {
        const data = await res.json();
        setShelters(data.shelters || []);
      }
    } catch (error) { console.error(error); }
  }

  async function fetchReports() {
    try {
      const res = await fetch('/api/admin/reports?status=pending');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (error) { console.error(error); }
  }

  async function fetchAffiliateProducts() {
    try {
      const res = await fetch('/api/admin/affiliate-products');
      if (res.ok) {
        const data = await res.json();
        setAffiliateProducts(data.products || []);
      }
    } catch (error) { console.error(error); }
  }

  async function handleModeratePet(petId: string, action: 'approve' | 'reject') {
    try {
      const res = await fetch(`/api/admin/pets/${petId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast({ title: 'Başarılı', description: action === 'approve' ? 'Pet onaylandı' : 'Pet reddedildi' });
        fetchPendingPets();
        fetchStats();
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'İşlem başarısız', variant: 'destructive' });
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'competition' | 'shelter' | 'affiliate') {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, isPublic: true }),
      });
      const { uploadUrl, cloud_storage_path } = await presignedRes.json();
      
      const uploadRes = await fetch(uploadUrl, { 
        method: 'PUT', 
        headers: { 'Content-Type': file.type }, 
        body: file 
      });
      
      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.status}`);
      }
      
      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloud_storage_path, isPublic: true }),
      });
      const { url } = await completeRes.json();
      
      if (type === 'competition') setCompetitionForm(prev => ({ ...prev, imageUrl: url }));
      else if (type === 'shelter') setShelterForm(prev => ({ ...prev, imageUrl: url }));
      else if (type === 'affiliate') setAffiliateForm(prev => ({ ...prev, imageUrl: url }));
      toast({ title: 'Başarılı', description: 'Görsel yüklendi' });
    } catch (error) {
      console.error('Image upload error:', error);
      toast({ title: 'Hata', description: 'Yüklenemedi', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveCompetition() {
    try {
      const url = editingCompetition ? `/api/admin/competitions/${editingCompetition.id}` : '/api/competitions';
      const method = editingCompetition ? 'PATCH' : 'POST';
      const formData = {
        ...competitionForm,
        maxParticipants: competitionForm.maxParticipants ? parseInt(competitionForm.maxParticipants) : null,
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast({ title: 'Başarılı', description: editingCompetition ? 'Yarışma güncellendi' : 'Yarışma oluşturuldu' });
        setCompetitionDialog(false);
        setEditingCompetition(null);
        setCompetitionForm({ title: '', description: '', startDate: '', endDate: '', entryPoints: 50, imageUrl: '', topic: '', category: 'appearance', maxParticipants: '' });
        fetchCompetitions();
        fetchStats();
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'İşlem başarısız', variant: 'destructive' });
    }
  }

  async function handleSaveShelter() {
    try {
      const url = editingShelter ? `/api/admin/shelters/${editingShelter.id}` : '/api/admin/shelters';
      const method = editingShelter ? 'PATCH' : 'POST';
      // Combine city and district into location
      const location = shelterForm.district ? `${shelterForm.city}, ${shelterForm.district}` : shelterForm.city;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: shelterForm.name,
          location,
          description: shelterForm.description,
          imageUrl: shelterForm.imageUrl,
          contactPhone: shelterForm.contactPhone,
          contactEmail: shelterForm.contactEmail,
          isActive: shelterForm.isActive,
        }),
      });
      if (res.ok) {
        toast({ title: 'Başarılı', description: editingShelter ? 'Barınak güncellendi' : 'Barınak eklendi' });
        setShelterDialog(false);
        setEditingShelter(null);
        setShelterForm({ name: '', city: '', district: '', description: '', imageUrl: '', contactPhone: '', contactEmail: '', isActive: true });
        fetchShelters();
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'İşlem başarısız', variant: 'destructive' });
    }
  }

  async function handleDeleteShelter(id: string) {
    if (!confirm('Bu barınağı silmek istediğinizden emin misiniz?')) return;
    try {
      const res = await fetch(`/api/admin/shelters/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Başarılı', description: 'Barınak silindi' });
        fetchShelters();
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'Silinemedi', variant: 'destructive' });
    }
  }

  async function handleDeleteCompetition(id: string) {
    if (!confirm('Bu yarışmayı silmek istediğinizden emin misiniz?')) return;
    try {
      const res = await fetch(`/api/admin/competitions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Başarılı', description: 'Yarışma silindi' });
        fetchCompetitions();
        fetchStats();
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'Silinemedi', variant: 'destructive' });
    }
  }

  async function handleResolveReport(id: string) {
    try {
      const res = await fetch(`/api/admin/reports/${id}/resolve`, { method: 'POST' });
      if (res.ok) {
        toast({ title: 'Başarılı', description: 'Şikayet çözümlendi' });
        fetchReports();
        fetchStats();
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'İşlem başarısız', variant: 'destructive' });
    }
  }

  const openEditCompetition = (comp: Competition) => {
    setEditingCompetition(comp);
    setCompetitionForm({
      title: comp.title,
      description: comp.description || '',
      startDate: comp.startDate.split('T')[0],
      endDate: comp.endDate.split('T')[0],
      entryPoints: comp.entryPoints,
      imageUrl: comp.imageUrl || '',
      topic: comp.topic || '',
      category: comp.category || 'appearance',
      maxParticipants: comp.maxParticipants ? comp.maxParticipants.toString() : '',
    });
    setCompetitionDialog(true);
  };

  const openEditShelter = (shelter: Shelter) => {
    setEditingShelter(shelter);
    // Parse location into city and district
    const locationParts = shelter.location.split(',').map(s => s.trim());
    const city = locationParts[0] || '';
    const district = locationParts[1] || '';
    setShelterForm({
      name: shelter.name,
      city,
      district,
      description: shelter.description || '',
      imageUrl: shelter.imageUrl || '',
      contactPhone: shelter.contactPhone || '',
      contactEmail: shelter.contactEmail || '',
      isActive: shelter.isActive,
    });
    setShelterDialog(true);
  };

  // Affiliate Product handlers
  async function handleSaveAffiliate() {
    try {
      const url = editingAffiliate ? `/api/admin/affiliate-products/${editingAffiliate.id}` : '/api/admin/affiliate-products';
      const method = editingAffiliate ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(affiliateForm),
      });
      if (res.ok) {
        toast({ title: 'Başarılı', description: editingAffiliate ? 'Ürün güncellendi' : 'Ürün eklendi' });
        setAffiliateDialog(false);
        setEditingAffiliate(null);
        setAffiliateForm({ name: '', description: '', imageUrl: '', affiliateUrl: '', platform: 'trendyol', price: '', sortOrder: 0 });
        fetchAffiliateProducts();
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'İşlem başarısız', variant: 'destructive' });
    }
  }

  async function handleDeleteAffiliate(id: string) {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    try {
      const res = await fetch(`/api/admin/affiliate-products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Başarılı', description: 'Ürün silindi' });
        fetchAffiliateProducts();
      }
    } catch (error) {
      toast({ title: 'Hata', description: 'Silinemedi', variant: 'destructive' });
    }
  }

  const openEditAffiliate = (product: AffiliateProduct) => {
    setEditingAffiliate(product);
    setAffiliateForm({
      name: product.name,
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      affiliateUrl: product.affiliateUrl,
      platform: product.platform,
      price: product.price || '',
      sortOrder: product.sortOrder,
    });
    setAffiliateDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]"><PawPrint className="h-8 w-8 animate-pulse text-orange-500" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Shield className="h-8 w-8 text-orange-600" />
          <h1 className="text-2xl font-bold">Admin Paneli</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="pets">Pet Onayı</TabsTrigger>
            <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
            <TabsTrigger value="competitions">Yarışmalar</TabsTrigger>
            <TabsTrigger value="shelters">Barınaklar</TabsTrigger>
            <TabsTrigger value="reports">Şikayetler</TabsTrigger>
            <TabsTrigger value="affiliates">Ürünler</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            {/* Şüpheli Kullanıcı Uyarısı */}
            {suspiciousUsers.length > 0 && (
              <Card className="mb-6 border-red-300 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="h-8 w-8 text-red-500" />
                      <div>
                        <h3 className="font-bold text-red-700">Güvenlik Uyarısı!</h3>
                        <p className="text-sm text-red-600">
                          {suspiciousUsers.length} şüpheli/bot kullanıcı tespit edildi. 
                          {suspiciousUsers.some(u => u.isAdmin) && ' ⚠️ Bazıları admin yetkisine sahip!'}
                        </p>
                        <p className="text-xs text-red-500 mt-1">
                          Tespit edilenler: {suspiciousUsers.slice(0, 3).map(u => u.email).join(', ')}{suspiciousUsers.length > 3 && '...'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={handleCleanupBots} 
                      disabled={cleaningBots}
                      className="gap-2"
                    >
                      <Bot className="h-4 w-4" />
                      {cleaningBots ? 'Temizleniyor...' : 'Botları Temizle'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <Card><CardContent className="pt-6 text-center"><Users className="h-8 w-8 mx-auto text-blue-500 mb-2" /><p className="text-2xl font-bold">{stats?.totalUsers || 0}</p><p className="text-sm text-gray-500">Kullanıcı</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><PawPrint className="h-8 w-8 mx-auto text-orange-500 mb-2" /><p className="text-2xl font-bold">{stats?.totalPets || 0}</p><p className="text-sm text-gray-500">Pet</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><Trophy className="h-8 w-8 mx-auto text-yellow-500 mb-2" /><p className="text-2xl font-bold">{stats?.activeCompetitions || 0}</p><p className="text-sm text-gray-500">Aktif Yarışma</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" /><p className="text-2xl font-bold">{stats?.pendingReports || 0}</p><p className="text-sm text-gray-500">Bekleyen Şikayet</p></CardContent></Card>
            </div>
          </TabsContent>

          {/* Pets */}
          <TabsContent value="pets">
            <Card>
              <CardHeader><CardTitle>Bekleyen Pet Onayları ({pendingPets.length})</CardTitle></CardHeader>
              <CardContent>
                {pendingPets.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Bekleyen pet yok</p>
                ) : (
                  <div className="space-y-4">
                    {pendingPets.map(pet => (
                      <div key={pet.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Avatar className="h-16 w-16"><AvatarImage src={pet.imageUrl || ''} /><AvatarFallback><PawPrint /></AvatarFallback></Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{pet.name}</p>
                          <p className="text-sm text-gray-500">{pet.species} {pet.breed && `- ${pet.breed}`}</p>
                          <p className="text-xs text-gray-400">Sahip: {pet.owner.name || pet.owner.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleModeratePet(pet.id, 'approve')}><Check className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => handleModeratePet(pet.id, 'reject')}><X className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            <Card>
              <CardHeader><CardTitle>Kullanıcılar ({users.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <Avatar><AvatarImage src={user.image || ''} /><AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback></Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{user.name || 'Anonim'} {user.isAdmin && <Badge className="ml-2">Admin</Badge>}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p>{user.points} puan</p>
                        <p className="text-gray-500">{user._count.pets} pet, {user._count.stories} hikaye</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competitions */}
          <TabsContent value="competitions">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Yarışmalar</h2>
              <Button onClick={() => { setEditingCompetition(null); setCompetitionForm({ title: '', description: '', startDate: '', endDate: '', entryPoints: 50, imageUrl: '', topic: '', category: 'appearance', maxParticipants: '' }); setCompetitionDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Yeni Yarışma
              </Button>
            </div>
            <div className="space-y-4">
              {competitions.map(comp => (
                <Card key={comp.id} className="p-4">
                  <div className="flex items-center gap-4">
                    {comp.imageUrl && <div className="relative w-20 h-20 rounded overflow-hidden bg-muted"><Image loading="eager" src={comp.imageUrl} alt={comp.title} fill className="object-cover" unoptimized /></div>}
                    <div className="flex-1">
                      <p className="font-semibold">{comp.title}</p>
                      <p className="text-sm text-gray-500">{format(new Date(comp.startDate), 'dd MMM', { locale: tr })} - {format(new Date(comp.endDate), 'dd MMM yyyy', { locale: tr })}</p>
                      <p className="text-xs text-gray-400">{comp._count.entries} katılımcı</p>
                    </div>
                    <Badge variant={comp.status === 'active' ? 'default' : 'secondary'}>{comp.status === 'active' ? 'Aktif' : 'Bitti'}</Badge>
                    <Button size="sm" variant="outline" onClick={() => openEditCompetition(comp)}><Eye className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteCompetition(comp.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Shelters */}
          <TabsContent value="shelters">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Barınaklar</h2>
              <Button onClick={() => { setEditingShelter(null); setShelterForm({ name: '', city: '', district: '', description: '', imageUrl: '', contactPhone: '', contactEmail: '', isActive: true }); setShelterDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Yeni Barınak
              </Button>
            </div>
            <div className="space-y-4">
              {shelters.map(shelter => (
                <Card key={shelter.id} className="p-4">
                  <div className="flex items-center gap-4">
                    {shelter.imageUrl && <div className="relative w-16 h-16 rounded overflow-hidden bg-muted"><Image loading="eager" src={shelter.imageUrl} alt={shelter.name} fill className="object-cover" unoptimized /></div>}
                    <div className="flex-1">
                      <p className="font-semibold">{shelter.name}</p>
                      <p className="text-sm text-gray-500">{shelter.location}</p>
                      <p className="text-xs text-gray-400">{shelter.totalDonations} mama kabı bağış alındı</p>
                    </div>
                    <Badge variant={shelter.isActive ? 'default' : 'secondary'}>{shelter.isActive ? 'Aktif' : 'Pasif'}</Badge>
                    <Button size="sm" variant="outline" onClick={() => openEditShelter(shelter)}><Eye className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteShelter(shelter.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports">
            <Card>
              <CardHeader><CardTitle>Bekleyen Şikayetler ({reports.length})</CardTitle></CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Bekleyen şikayet yok</p>
                ) : (
                  <div className="space-y-4">
                    {reports.map(report => (
                      <div key={report.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge>{report.type}</Badge>
                            <p className="mt-2 text-sm">{report.reason}</p>
                            <p className="text-xs text-gray-400 mt-1">Bildiren: {report.reporter.name || report.reporter.email}</p>
                          </div>
                          <Button size="sm" onClick={() => handleResolveReport(report.id)}><Check className="h-4 w-4 mr-1" /> Çözümle</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Affiliate Products */}
          <TabsContent value="affiliates">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Affiliate Ürünler</h2>
              <Button onClick={() => { setEditingAffiliate(null); setAffiliateForm({ name: '', description: '', imageUrl: '', affiliateUrl: '', platform: 'trendyol', price: '', sortOrder: 0 }); setAffiliateDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Yeni Ürün
              </Button>
            </div>
            <div className="space-y-4">
              {affiliateProducts.map(product => (
                <Card key={product.id} className="p-4">
                  <div className="flex items-center gap-4">
                    {product.imageUrl && <div className="relative w-16 h-16 rounded overflow-hidden bg-muted"><Image loading="eager" src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized /></div>}
                    <div className="flex-1">
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.platform} {product.price && `- ${product.price}`}</p>
                      <p className="text-xs text-blue-500 truncate max-w-xs">{product.affiliateUrl}</p>
                    </div>
                    <Badge variant={product.isActive ? 'default' : 'secondary'}>{product.isActive ? 'Aktif' : 'Pasif'}</Badge>
                    <Button size="sm" variant="outline" onClick={() => openEditAffiliate(product)}><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteAffiliate(product.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </Card>
              ))}
              {affiliateProducts.length === 0 && <p className="text-center text-gray-500 py-8">Henüz ürün eklenmemiş</p>}
            </div>
          </TabsContent>

        </Tabs>

        {/* Competition Dialog */}
        <Dialog open={competitionDialog} onOpenChange={setCompetitionDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingCompetition ? 'Yarışma Düzenle' : 'Yeni Yarışma'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Başlık</Label><Input value={competitionForm.title} onChange={(e) => setCompetitionForm({ ...competitionForm, title: e.target.value })} /></div>
              <div><Label>Konu</Label><Input placeholder="Örn: En tatlı kedi, En yaramaz köpek" value={competitionForm.topic} onChange={(e) => setCompetitionForm({ ...competitionForm, topic: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Kategori</Label>
                  <Select value={competitionForm.category} onValueChange={(value) => setCompetitionForm({ ...competitionForm, category: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appearance">Dış Görünüş</SelectItem>
                      <SelectItem value="behavior">Davranış</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Max Katılımcı</Label><Input type="number" placeholder="Sınırsız için boş bırakın" value={competitionForm.maxParticipants} onChange={(e) => setCompetitionForm({ ...competitionForm, maxParticipants: e.target.value })} /></div>
              </div>
              <div><Label>Açıklama</Label><Textarea value={competitionForm.description} onChange={(e) => setCompetitionForm({ ...competitionForm, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Başlangıç</Label><Input type="date" value={competitionForm.startDate} onChange={(e) => setCompetitionForm({ ...competitionForm, startDate: e.target.value })} /></div>
                <div><Label>Bitiş</Label><Input type="date" value={competitionForm.endDate} onChange={(e) => setCompetitionForm({ ...competitionForm, endDate: e.target.value })} /></div>
              </div>
              <div><Label>Katılım Puanı</Label><Input type="number" value={competitionForm.entryPoints} onChange={(e) => setCompetitionForm({ ...competitionForm, entryPoints: parseInt(e.target.value) || 50 })} /></div>
              <div>
                <Label>Görsel</Label>
                {competitionForm.imageUrl && <div className="relative w-full h-32 rounded overflow-hidden bg-muted mb-2"><Image loading="eager" src={competitionForm.imageUrl} alt="Preview" fill className="object-cover" priority unoptimized /></div>}
                <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'competition')} disabled={uploading} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCompetitionDialog(false)}>Vazgeç</Button>
              <Button onClick={handleSaveCompetition} disabled={!competitionForm.title || !competitionForm.startDate || !competitionForm.endDate}>Kaydet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Shelter Dialog */}
        <Dialog open={shelterDialog} onOpenChange={setShelterDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingShelter ? 'Barınak Düzenle' : 'Yeni Barınak'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Ad</Label><Input value={shelterForm.name} onChange={(e) => setShelterForm({ ...shelterForm, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Şehir</Label>
                  <Select value={shelterForm.city} onValueChange={(value) => setShelterForm({ ...shelterForm, city: value, district: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Şehir seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {TURKEY_CITIES.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>İlçe</Label>
                  <Select 
                    value={shelterForm.district} 
                    onValueChange={(value) => setShelterForm({ ...shelterForm, district: value })}
                    disabled={!shelterForm.city}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={shelterForm.city ? "İlçe seçin" : "Önce şehir seçin"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getDistrictOptions(shelterForm.city).map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Açıklama</Label><Textarea value={shelterForm.description} onChange={(e) => setShelterForm({ ...shelterForm, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Telefon</Label><Input value={shelterForm.contactPhone} onChange={(e) => setShelterForm({ ...shelterForm, contactPhone: e.target.value })} /></div>
                <div><Label>E-posta</Label><Input value={shelterForm.contactEmail} onChange={(e) => setShelterForm({ ...shelterForm, contactEmail: e.target.value })} /></div>
              </div>
              <div>
                <Label>Görsel</Label>
                {shelterForm.imageUrl && <div className="relative w-full h-32 rounded overflow-hidden bg-muted mb-2"><Image loading="eager" src={shelterForm.imageUrl} alt="Preview" fill className="object-cover" priority unoptimized /></div>}
                <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'shelter')} disabled={uploading} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShelterDialog(false)}>Vazgeç</Button>
              <Button onClick={handleSaveShelter} disabled={!shelterForm.name || !shelterForm.city}>Kaydet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Affiliate Dialog */}
        <Dialog open={affiliateDialog} onOpenChange={setAffiliateDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingAffiliate ? 'Ürün Düzenle' : 'Yeni Ürün'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Ürün Adı</Label><Input value={affiliateForm.name} onChange={(e) => setAffiliateForm({ ...affiliateForm, name: e.target.value })} /></div>
              <div><Label>Açıklama</Label><Textarea value={affiliateForm.description} onChange={(e) => setAffiliateForm({ ...affiliateForm, description: e.target.value })} /></div>
              <div><Label>Affiliate Link</Label><Input value={affiliateForm.affiliateUrl} onChange={(e) => setAffiliateForm({ ...affiliateForm, affiliateUrl: e.target.value })} placeholder="https://..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Platform</Label>
                  <Select value={affiliateForm.platform} onValueChange={(value) => setAffiliateForm({ ...affiliateForm, platform: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trendyol">Trendyol</SelectItem>
                      <SelectItem value="amazon">Amazon</SelectItem>
                      <SelectItem value="hepsiburada">Hepsiburada</SelectItem>
                      <SelectItem value="n11">N11</SelectItem>
                      <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Fiyat</Label><Input value={affiliateForm.price} onChange={(e) => setAffiliateForm({ ...affiliateForm, price: e.target.value })} placeholder="₺99.90" /></div>
              </div>
              <div><Label>Sıralama</Label><Input type="number" value={affiliateForm.sortOrder} onChange={(e) => setAffiliateForm({ ...affiliateForm, sortOrder: parseInt(e.target.value) || 0 })} /></div>
              <div>
                <Label>Görsel</Label>
                {affiliateForm.imageUrl && <div className="relative w-full h-32 rounded overflow-hidden bg-muted mb-2"><Image loading="eager" src={affiliateForm.imageUrl} alt="Preview" fill className="object-cover" priority unoptimized /></div>}
                <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'affiliate')} disabled={uploading} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAffiliateDialog(false)}>Vazgeç</Button>
              <Button onClick={handleSaveAffiliate} disabled={!affiliateForm.name || !affiliateForm.affiliateUrl}>Kaydet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
