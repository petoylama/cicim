'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Trophy,
  Calendar,
  Users,
  Star,
  Clock,
  Heart,
  ArrowLeft,
  PawPrint,
  Coins,
  Check,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Pet {
  id: string;
  name: string;
  imageUrl: string | null;
  species: string;
}

interface Entry {
  id: string;
  petId: string;
  votesCount: number;
  hasVoted: boolean;
  pet: {
    id: string;
    name: string;
    imageUrl: string | null;
    species: string;
    breed: string | null;
    owner: {
      id: string;
      name: string | null;
      image: string | null;
    };
  };
}

interface Competition {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  entryPoints: number;
  winner: Pet | null;
  entries: Entry[];
}

export default function CompetitionDetailClient({
  competition: initialCompetition,
  userPets,
  userEntryPetIds,
  userPoints: initialUserPoints,
}: {
  competition: Competition;
  userPets: Pet[];
  userEntryPetIds: string[];
  userPoints: number;
}) {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const { toast } = useToast();
  const [competition, setCompetition] = useState(initialCompetition);
  const [userPoints, setUserPoints] = useState(initialUserPoints);
  const [enteredPetIds, setEnteredPetIds] = useState<string[]>(userEntryPetIds);
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [enterDialogOpen, setEnterDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const start = new Date(competition.startDate);
  const end = new Date(competition.endDate);
  const isActive = now >= start && now <= end;
  const isEnded = isPast(end);

  const availablePets = userPets.filter((pet) => !enteredPetIds.includes(pet.id));

  const handleEnter = async () => {
    if (!selectedPetId) {
      toast({
        title: 'Hata',
        description: 'Lütfen bir pet seçin',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/competitions/${competition.id}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId: selectedPetId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Tebrikler! 🎉',
          description: `Petin yarışmaya katıldı! ${data.pointsSpent} CiciPuan harcandı.`,
        });
        setEnteredPetIds((prev) => [...prev, selectedPetId]);
        setUserPoints((prev) => prev - data.pointsSpent);
        setEnterDialogOpen(false);
        setSelectedPetId('');
        router.refresh();
      } else {
        toast({
          title: 'Hata',
          description: data.error || 'Katılım başarısız',
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
      setLoading(false);
    }
  };

  const handleVote = async (petId: string, entryIndex: number) => {
    try {
      const response = await fetch(`/api/competitions/${competition.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId }),
      });

      const data = await response.json();

      if (response.ok) {
        setCompetition((prev) => ({
          ...prev,
          entries: prev.entries.map((entry, i) =>
            i === entryIndex
              ? { ...entry, hasVoted: data.voted, votesCount: data.votesCount }
              : entry
          ),
        }));
      } else {
        toast({
          title: 'Hata',
          description: data.error || 'Oy verme başarısız',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Bir hata oluştu',
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

      <main className="container mx-auto max-w-6xl px-4 py-8">
        <Link
          href="/competitions"
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Yarışmalara Dön
        </Link>

        {/* Competition Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Trophy className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{competition.title}</h1>
                    {isActive && (
                      <Badge className="bg-green-500">Aktif</Badge>
                    )}
                    {isEnded && (
                      <Badge variant="secondary">Sona Erdi</Badge>
                    )}
                    {isFuture(start) && (
                      <Badge variant="outline">Yakında</Badge>
                    )}
                  </div>
                </div>

                {competition.description && (
                  <p className="text-gray-600 mb-4">{competition.description}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(start, 'd MMMM yyyy', { locale: tr })} -{' '}
                    {format(end, 'd MMMM yyyy', { locale: tr })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {competition.entries.length} Katılımcı
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {competition.entryPoints} Puan Gerekli
                  </span>
                </div>

                {!isEnded && (
                  <p className="text-sm text-orange-600 mt-3 font-medium">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {isActive
                      ? `Bitmesine ${formatDistanceToNow(end, { locale: tr })}`
                      : `Başlamasına ${formatDistanceToNow(start, { locale: tr })}`}
                  </p>
                )}
              </div>

              {/* User Actions */}
              {isActive && (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-2">Puanın</p>
                  <p className="text-3xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                    <Coins className="w-6 h-6" />
                    {userPoints}
                  </p>

                  {availablePets.length > 0 && userPoints >= competition.entryPoints ? (
                    <Dialog open={enterDialogOpen} onOpenChange={setEnterDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="mt-4 w-full bg-gradient-to-r from-yellow-500 to-orange-500">
                          Yarışmaya Katıl
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Yarışmaya Katıl</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p className="text-sm text-gray-600">
                            Yarışmaya katılmak için{' '}
                            <span className="font-bold text-yellow-600">
                              {competition.entryPoints} CiciPuan
                            </span>{' '}
                            harcanacak.
                          </p>
                          <div>
                            <label className="text-sm font-medium">Pet Seç</label>
                            <Select
                              value={selectedPetId}
                              onValueChange={setSelectedPetId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Bir pet seçin..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availablePets.map((pet) => (
                                  <SelectItem key={pet.id} value={pet.id}>
                                    {getSpeciesEmoji(pet.species)} {pet.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            onClick={handleEnter}
                            disabled={loading || !selectedPetId}
                            className="w-full"
                          >
                            {loading ? 'Katılınıyor...' : 'Katıl'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : availablePets.length === 0 && userPets.length > 0 ? (
                    <p className="text-sm text-green-600 mt-4 flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" />
                      Tüm petlerin yarışmada!
                    </p>
                  ) : userPets.length === 0 ? (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Henüz petiniz yok</p>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/pets/new">Pet Ekle</Link>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-red-500 mt-4">
                      Yeterli puanınız yok
                    </p>
                  )}
                </div>
              )}

              {/* Winner Display */}
              {isEnded && competition.winner && (
                <div className="bg-yellow-50 rounded-lg p-6 text-center border-2 border-yellow-300">
                  <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
                  <p className="text-sm text-gray-500 mb-2">Kazanan</p>
                  {competition.winner.imageUrl ? (
                    <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-yellow-400">
                      <Image
                        src={competition.winner.imageUrl}
                        alt={competition.winner.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 mx-auto rounded-full bg-gray-200 flex items-center justify-center border-4 border-yellow-400">
                      <PawPrint className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  <p className="font-bold text-lg mt-2">
                    {getSpeciesEmoji(competition.winner.species)}{' '}
                    {competition.winner.name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Entries */}
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Katılımcılar ({competition.entries.length})
        </h2>

        {competition.entries.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <PawPrint className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Henüz katılımcı yok
              </h3>
              <p className="text-gray-500">Petinle ilk katılan sen ol!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competition.entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`overflow-hidden transition-all ${
                    index === 0 && isEnded
                      ? 'ring-2 ring-yellow-400 shadow-lg'
                      : ''
                  }`}
                >
                  {/* Ranking Badge */}
                  {index < 3 && (
                    <div
                      className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold z-10 ${
                        index === 0
                          ? 'bg-yellow-500'
                          : index === 1
                          ? 'bg-gray-400'
                          : 'bg-orange-400'
                      }`}
                    >
                      {index + 1}
                    </div>
                  )}

                  {/* Pet Image */}
                  <Link href={`/pets/${entry.pet.id}`}>
                    <div className="relative aspect-square w-full overflow-hidden bg-muted">
                      {entry.pet.imageUrl ? (
                        <Image
                          src={entry.pet.imageUrl}
                          alt={entry.pet.name}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <PawPrint className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                    </div>
                  </Link>

                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Link href={`/pets/${entry.pet.id}`}>
                        <h3 className="font-bold text-lg hover:text-purple-600 transition-colors">
                          {getSpeciesEmoji(entry.pet.species)} {entry.pet.name}
                        </h3>
                      </Link>
                      {entry.pet.breed && (
                        <Badge variant="outline" className="text-xs">
                          {entry.pet.breed}
                        </Badge>
                      )}
                    </div>

                    {/* Owner */}
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={entry.pet.owner.image || ''} />
                        <AvatarFallback>
                          {entry.pet.owner.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-500">
                        {entry.pet.owner.name}
                      </span>
                    </div>

                    {/* Vote Section */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-lg font-bold text-purple-600">
                        {entry.votesCount} Oy
                      </span>
                      {isActive && (
                        <Button
                          variant={entry.hasVoted ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleVote(entry.petId, index)}
                          className={entry.hasVoted ? 'bg-red-500 hover:bg-red-600' : ''}
                        >
                          <Heart
                            className={`w-4 h-4 mr-1 ${
                              entry.hasVoted ? 'fill-white' : ''
                            }`}
                          />
                          {entry.hasVoted ? 'Oy Verildi' : 'Oy Ver'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
