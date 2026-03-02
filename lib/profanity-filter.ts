// Genişletilmiş Türkçe & İngilizce küfür/uygunsuz kelime filtresi

const profanityWords: string[] = [
  // Türkçe - yaygın küfürler
  'amk', 'aq', 'orospu', 'oç', 'göt', 'sik', 'sikik', 'sikerim', 'sikiş',
  'yarrak', 'yarak', 'piç', 'piçlik', 'am ', 'amına', 'amını', 'amcık',
  'sıç', 'sıçtım', 'sıçayım', 'bok', 'boktan', 'bok gibi',
  'ibne', 'gavat', 'kahpe', 'oğlan', 'orospu çocuğu', 'orospunun',
  'pezevenk', 'döl', 'götveren', 'bok ye', 'seni sikim',
  'amına koyayım', 'amına koyim', 'oç', 'puşt', 'puşt',
  'sürtük', 'kaltak', 'yavşak', 'haysiyetsiz', 'namussuz',
  'fahişe', 'şerefsiz', 'alçak', 'it', 'köpek', 'mal', 'gerizekalı',
  'aptal', 'salak', 'geri zekalı', 'bok kafalı', 'serserı',
  // Türkçe - argo/hakaret
  'zıbık', 'taşak', 'top', 'çük', 'göbeğine', 'götünü', 'sikeyim',
  // İngilizce
  'fuck', 'fucking', 'fucked', 'fucker', 'motherfucker',
  'shit', 'shitty', 'bullshit',
  'bitch', 'bitches', 'son of a bitch',
  'ass', 'asshole', 'ass hole',
  'dick', 'dickhead',
  'pussy', 'cunt', 'cock', 'cocks',
  'bastard', 'whore', 'slut', 'nigger', 'nigga',
  'faggot', 'fag', 'retard',
];

// Word boundary aware kontrol - kısmi eşleşmeleri önler
const WORD_BOUNDARY_EXCEPTIONS = ['am ', 'it ', 'mal ']; // boşlukla biten kelimeler

export function containsProfanity(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();

  return profanityWords.some((word) => {
    if (WORD_BOUNDARY_EXCEPTIONS.includes(word)) {
      // Boşlukla biten kelimelerde prefix kontrolü
      return lowerText.includes(word);
    }
    // Kelime sınırı regex kontrolü (daha doğru eşleşme)
    const pattern = new RegExp(`(^|[\\s,.:;!?'"-])${escapeRegex(word)}($|[\\s,.:;!?'"-])`, 'i');
    return pattern.test(` ${lowerText} `);
  });
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getProfanityWarning(): string {
  return 'Lütfen uygun olmayan kelimeler kullanmayın. İçeriğiniz topluluk kurallarına aykırı ifadeler içeriyor.';
}

/**
 * Metindeki küfür/hakaret içeren kısımları yıldızla maskeler.
 * Sadece moderasyon loglama amacıyla kullanılmalı, asla kullanıcıya gösterilmemeli.
 */
export function censorText(text: string): string {
  if (!text) return text;
  let result = text;
  profanityWords.forEach((word) => {
    const masked = word[0] + '*'.repeat(Math.max(word.length - 2, 1)) + (word.length > 1 ? word[word.length - 1] : '');
    const pattern = new RegExp(escapeRegex(word), 'gi');
    result = result.replace(pattern, masked);
  });
  return result;
}
