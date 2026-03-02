'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { ShoppingBag, Star, ExternalLink, Search, Filter, Heart, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  petType: string;
  rating: number;
  reviewCount: number;
  affiliateUrl: string;
  isNew?: boolean;
  discount?: number;
}

// Örnek ürün verileri
const products: Product[] = [
  {
    id: '1',
    name: 'Premium Kedi Maması 10kg',
    description: 'Yetişkin kediler için tam ve dengeli beslenme. Tavuk ve balık içerikli.',
    price: 899,
    originalPrice: 1099,
    imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&q=80',
    category: 'Mama',
    petType: 'Kedi',
    rating: 4.8,
    reviewCount: 234,
    affiliateUrl: '#',
    discount: 18
  },
  {
    id: '2',
    name: 'Köpek Oyuncak Seti',
    description: '5 parça dayanıklı oyuncak seti. Çiğneme ve fetch oyunları için ideal.',
    price: 249,
    imageUrl: 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=400&q=80',
    category: 'Oyuncak',
    petType: 'Köpek',
    rating: 4.5,
    reviewCount: 89,
    affiliateUrl: '#',
    isNew: true
  },
  {
    id: '3',
    name: 'Kedi Tırmalama Kulesi',
    description: '120cm yüksekliğinde, çok katlı tırmalama kulesi. Yumuşak peluş kaplama.',
    price: 1299,
    originalPrice: 1599,
    imageUrl: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=400&q=80',
    category: 'Aksesuar',
    petType: 'Kedi',
    rating: 4.9,
    reviewCount: 156,
    affiliateUrl: '#',
    discount: 19
  },
  {
    id: '4',
    name: 'Köpek Tasması ve Kayışı',
    description: 'Reflektörlü, ayarlanabilir tasma seti. Gece yürüyüşleri için güvenli.',
    price: 189,
    imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
    category: 'Aksesuar',
    petType: 'Köpek',
    rating: 4.6,
    reviewCount: 78,
    affiliateUrl: '#'
  },
  {
    id: '5',
    name: 'Kuş Kafesi Deluxe',
    description: 'Geniş iç mekan, salıncak ve tünekler dahil. Muhabbet kuşları için ideal.',
    price: 599,
    originalPrice: 749,
    imageUrl: 'https://images.unsplash.com/photo-1520808663317-647b476a81b9?w=400&q=80',
    category: 'Aksesuar',
    petType: 'Kuş',
    rating: 4.7,
    reviewCount: 45,
    affiliateUrl: '#',
    discount: 20
  },
  {
    id: '6',
    name: 'Akvaryum Başlangıç Seti',
    description: '50 litre akvaryum, filtre, ısıtıcı ve LED aydınlatma dahil.',
    price: 1899,
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80',
    category: 'Aksesuar',
    petType: 'Balık',
    rating: 4.4,
    reviewCount: 67,
    affiliateUrl: '#',
    isNew: true
  },
  {
    id: '7',
    name: 'Organik Köpek Maması 15kg',
    description: 'Tahılsız, doğal içerikli premium mama. Hassas sindirim için.',
    price: 1499,
    originalPrice: 1799,
    imageUrl: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400&q=80',
    category: 'Mama',
    petType: 'Köpek',
    rating: 4.9,
    reviewCount: 312,
    affiliateUrl: '#',
    discount: 17
  },
  {
    id: '8',
    name: 'Kedi Kumu 20L',
    description: 'Topaklaşan, kokusuz formül. Uzun süreli kullanım.',
    price: 349,
    imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80',
    category: 'Hijyen',
    petType: 'Kedi',
    rating: 4.3,
    reviewCount: 198,
    affiliateUrl: '#'
  }
];

const categories = ['Tümü', 'Mama', 'Oyuncak', 'Aksesuar', 'Hijyen'];
const petTypes = ['Tümü', 'Kedi', 'Köpek', 'Kuş', 'Balık', 'Diğer'];

export function PazarClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedPetType, setSelectedPetType] = useState('Tümü');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Favorileri localStorage'dan yükle
    const savedFavorites = localStorage.getItem('cicipazar-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const toggleFavorite = (productId: string) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId];
    setFavorites(newFavorites);
    localStorage.setItem('cicipazar-favorites', JSON.stringify(newFavorites));
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tümü' || product.category === selectedCategory;
    const matchesPetType = selectedPetType === 'Tümü' || product.petType === selectedPetType;
    return matchesSearch && matchesCategory && matchesPetType;
  });

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ShoppingBag className="h-10 w-10 text-orange-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              CiciPazar
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Evcil dostlarınız için en kaliteli ürünleri keşfedin! Mama, oyuncak, aksesuar ve daha fazlası.
          </p>
        </div>

        {/* Filtreler */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Ürün ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedPetType} onValueChange={setSelectedPetType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Pet Türü" />
                  </SelectTrigger>
                  <SelectContent>
                    {petTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ürün Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="group h-full flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader className="p-0 relative">
                  <div className="relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.isNew && (
                        <Badge className="bg-blue-500 hover:bg-blue-600">
                          <Sparkles className="h-3 w-3 mr-1" /> Yeni
                        </Badge>
                      )}
                      {product.discount && (
                        <Badge className="bg-red-500 hover:bg-red-600">
                          %{product.discount} İndirim
                        </Badge>
                      )}
                    </div>
                    {/* Favori butonu */}
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
                    >
                      <Heart
                        className={`h-4 w-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                      />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-4">
                  <Badge variant="outline" className="mb-2">
                    {product.petType} • {product.category}
                  </Badge>
                  <CardTitle className="text-lg mb-2 line-clamp-2">{product.name}</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {product.description}
                  </p>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{product.rating}</span>
                    <span className="text-gray-400">({product.reviewCount} değerlendirme)</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-orange-600">₺{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through ml-2">
                        ₺{product.originalPrice}
                      </span>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => window.open(product.affiliateUrl !== '#' ? product.affiliateUrl : `https://www.google.com/search?q=${encodeURIComponent(product.name + ' satın al')}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    İncele
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Ürün bulunamadı</h3>
            <p className="text-gray-500">Farklı filtreler deneyebilirsiniz.</p>
          </div>
        )}

        {/* Bilgilendirme */}
        <Card className="mt-8 bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20 border-orange-200">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              <strong>Not:</strong> CiciPazar, affiliate (ortaklık) programı ile çalışmaktadır. 
              Ürün linklerine tıkladığınızda partner sitelerimize yönlendirilirsiniz. 
              Satışlardan elde edilen komisyonlar, CiciPet platformunun geliştirilmesi için kullanılır.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
