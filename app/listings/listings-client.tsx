'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, MapPin, Heart, AlertTriangle, PawPrint, Filter } from 'lucide-react';
import { SPECIES_OPTIONS, GENDER_OPTIONS, TURKEY_CITIES } from '@/lib/breed-data';
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
  likesCount?: number;
  commentsCount?: number;
  createdAt: string;
  user: { id: string; name?: string; image?: string };
}

export default function ListingsClient() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  // Filtreler
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');

  useEffect(() => {
    fetchListings();
  }, [activeTab, filterSpecies, filterGender, filterLocation]);

  async function fetchListings() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.append('type', activeTab);
      if (filterSpecies !== 'all') params.append('species', filterSpecies);
      if (filterGender !== 'all') params.append('gender', filterGender);
      if (filterLocation !== 'all') params.append('location', filterLocation);

      const res = await fetch(`/api/listings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } catch (error) {
      console.error('Fetch listings error:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (listing: Listing) => {
    if (listing.type === 'lost') {
      if (listing.status === 'found') return <Badge className="bg-green-500">Bulundu</Badge>;
      return <Badge className="bg-red-500">Kayıp</Badge>;
    } else {
      if (listing.status === 'adopted') return <Badge className="bg-green-500">Sahiplenildi</Badge>;
      return <Badge className="bg-blue-500">Sahiplendirme</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="h-7 w-7 text-orange-500" /> Kayıp & Sahiplendirme
            </h1>
            <p className="text-gray-600 mt-1">Kayıp veya sahiplendirme ilanı verin</p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/listings/new"><Plus className="h-4 w-4" /> İlan Ver</Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">Tümü</TabsTrigger>
            <TabsTrigger value="lost">Kayıp</TabsTrigger>
            <TabsTrigger value="adoption">Sahiplendirme</TabsTrigger>
          </TabsList>

          {/* Filtreler */}
          <div className="mb-6 flex flex-wrap gap-3 items-center bg-white p-4 rounded-lg shadow-sm">
            <Filter className="h-5 w-5 text-gray-500" />
            <Select value={filterSpecies} onValueChange={setFilterSpecies}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Tür" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Türler</SelectItem>
                {SPECIES_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterGender} onValueChange={setFilterGender}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Cinsiyet" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                {GENDER_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Konum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Şehirler</SelectItem>
                {TURKEY_CITIES.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="text-center py-12"><PawPrint className="h-8 w-8 animate-pulse mx-auto text-orange-500" /></div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">İlan bulunamadı</p>
                <Button asChild><Link href="/listings/new">İlan Ver</Link></Button>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {listings.map(listing => (
                  <Link key={listing.id} href={`/listings/${listing.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                      <div className="relative aspect-square bg-muted">
                        {listing.imageUrl ? (
                          <Image loading="eager" src={listing.imageUrl} alt={listing.petName} fill className="object-cover" unoptimized />
                        ) : (
                          <div className="flex items-center justify-center h-full"><PawPrint className="h-8 w-8 text-gray-400" /></div>
                        )}
                        <div className="absolute top-2 left-2">{getStatusBadge(listing)}</div>
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-semibold text-sm truncate">{listing.petName}</h3>
                        <p className="text-xs text-gray-500 truncate">{listing.species} {listing.breed && `- ${listing.breed}`}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{listing.location}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true, locale: tr })}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
