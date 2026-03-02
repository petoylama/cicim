'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, Plus, PawPrint, Filter } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { SPECIES_OPTIONS, GENDER_OPTIONS, TURKEY_CITIES } from '@/lib/breed-data';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  gender?: string;
  age?: number;
  location?: string;
  description?: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  owner: {
    id: string;
    name: string;
    image?: string;
  };
}

export default function PetsClient() {
  const { data: session } = useSession() || {};
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'my'>('all');
  
  // Filtreler
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');

  useEffect(() => {
    fetchPets();
  }, [filter, filterSpecies, filterGender, filterLocation, session?.user?.id]);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filter === 'my' && session?.user?.id) {
        params.append('myPets', 'true');
      }
      if (filterSpecies !== 'all') params.append('species', filterSpecies);
      if (filterGender !== 'all') params.append('gender', filterGender);
      if (filterLocation !== 'all') params.append('location', filterLocation);

      const response = await fetch(`/api/pets?${params.toString()}`);
      const data = await response.json();
      setPets(data ?? []);
    } catch (error) {
      console.error('Failed to fetch pets:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Navbar />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <PawPrint className="h-7 w-7 text-orange-500" /> Petler
            </h1>
            <p className="mt-1 text-gray-600">Topluluktağun tüm sevimli petleri keşfedin</p>
          </div>
          <Link href="/pets/new">
            <Button className="gap-2"><Plus className="h-4 w-4" /> Pet Ekle</Button>
          </Link>
        </div>

        {/* Filtreler */}
        <div className="mb-6 flex flex-wrap gap-3 items-center bg-white p-4 rounded-lg shadow-sm">
          <div className="flex gap-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>Tüm Petler</Button>
            <Button variant={filter === 'my' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('my')}>Petlerim</Button>
          </div>
          <div className="h-6 w-px bg-gray-300 hidden sm:block" />
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

        {/* Pets Grid */}
        {loading ? (
          <div className="text-center py-12"><PawPrint className="h-8 w-8 animate-pulse mx-auto text-orange-500" /></div>
        ) : pets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Henüz pet yok</p>
            <Link href="/pets/new"><Button>Pet Ekle</Button></Link>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {pets.map((pet) => (
              <Link key={pet.id} href={`/pets/${pet.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  <div className="relative aspect-square bg-muted">
                    {pet.imageUrl ? (
                      <Image loading="eager" src={pet.imageUrl} alt={pet.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex items-center justify-center h-full"><PawPrint className="h-8 w-8 text-gray-400" /></div>
                    )}
                    <Badge className="absolute top-2 left-2 text-xs">{pet.species}</Badge>
                    {pet.gender && (
                      <Badge variant="outline" className="absolute top-2 right-2 text-xs bg-white">
                        {pet.gender === 'erkek' ? '♂' : pet.gender === 'dişi' ? '♀' : '?'}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm truncate">{pet.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{pet.breed || pet.species}</p>
                    {pet.location && <p className="text-xs text-gray-400 truncate">{pet.location}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {pet.likesCount}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {pet.commentsCount}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
