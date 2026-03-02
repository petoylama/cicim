// Türlere göre cins verileri
export const BREED_DATA: Record<string, string[]> = {
  kedi: [
    'Tekir',
    'Van Kedisi',
    'Ankara Kedisi',
    'British Shorthair',
    'Scottish Fold',
    'Persian',
    'Siamese',
    'Maine Coon',
    'Ragdoll',
    'Diğer',
  ],
  köpek: [
    'Golden Retriever',
    'Labrador',
    'German Shepherd',
    'Kangal',
    'Akbaş',
    'Poodle',
    'Beagle',
    'Bulldog',
    'Husky',
    'Diğer',
  ],
  kuş: [
    'Muhabbet Kuşu',
    'Sultan Papağanı',
    'Kanarya',
    'Cennet Papağanı',
    'Jako',
    'Forpus',
    'Bülbül',
    'Saka',
    'Güvercin',
    'Diğer',
  ],
  diğer: [
    'Tavşan',
    'Hamster',
    'Kobay',
    'Kaplumbağa',
    'Balık',
    'Yılan',
    'Kertenkele',
    'Fare',
    'Feribot',
    'Diğer',
  ],
};

export const SPECIES_OPTIONS = [
  { value: 'kedi', label: 'Kedi' },
  { value: 'köpek', label: 'Köpek' },
  { value: 'kuş', label: 'Kuş' },
  { value: 'diğer', label: 'Diğer' },
];

export const GENDER_OPTIONS = [
  { value: 'erkek', label: 'Erkek' },
  { value: 'dişi', label: 'Dişi' },
  { value: 'bilinmiyor', label: 'Bilinmiyor' },
];

export const TURKEY_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
  'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
  'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta',
  'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
  'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla',
  'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop',
  'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van',
  'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak',
  'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
];
