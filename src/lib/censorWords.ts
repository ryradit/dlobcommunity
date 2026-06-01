// List of censored words
const CENSORED_WORDS = [
  'anjim', 'anjing', 'anjir', 'anjrit', 'anjrot', 'asu', 'babi', 'bacot', 'bajingan', 'banci',
  'bangke', 'bangor', 'bangsat', 'bego', 'bejad', 'bencong', 'bodat', 'bugil', 'bundir',
  'bunuh', 'burik', 'burit', 'cawek', 'cemen', 'cipok', 'cium', 'colai', 'coli', 'colmek',
  'cukimai', 'cukimay', 'culun', 'cumbu', 'dancuk', 'dewasa', 'dick', 'dildo', 'encuk',
  'gay', 'gei', 'gembel', 'gey', 'gigolo', 'gila', 'goblog', 'goblok', 'haram', 'hencet',
  'hentai', 'idiot', 'jablai', 'jablay', 'jancok', 'jancuk', 'jangkik', 'jembut', 'jilat',
  'jingan', 'kampang', 'keparat', 'kimak', 'kirik', 'klentit', 'klitoris', 'konthol', 'kontol',
  'koplok', 'kunyuk', 'kutang', 'kutis', 'kwontol', 'lonte', 'maho', 'masturbasi', 'matane',
  'mati', 'memek', 'mesum', 'modar', 'modyar', 'mokad', 'najis', 'nazi', 'ndhasmu', 'nenen',
  'ngentot', 'ngolom', 'ngulum', 'nigga', 'nigger', 'onani', 'orgasme', 'paksa', 'pantat',
  'pantek', 'pecun', 'peli', 'penis', 'pentil', 'pepek', 'perek', 'perkosa', 'piatu', 'porno',
  'pukimak', 'qontol', 'selangkang', 'sempak', 'senggama', 'setan', 'setubuh', 'silet', 'silit',
  'sinting', 'sodomi', 'stres', 'telanjang', 'telaso', 'tete', 'tewas', 'titit', 'togel',
  'toket', 'tolol', 'tusbol', 'urin', 'vagina', 'xxx', 'yateam', 'yatim',
];

/**
 * Censor words in text by replacing characters with asterisks
 * Keeps first letter, replaces rest with asterisks
 * @param text - The text to censor
 * @returns Censored text
 */
export function censorText(text: string): string {
  if (!text) return text;

  let result = text;

  // Create a regex pattern that matches any of the censored words (case-insensitive)
  CENSORED_WORDS.forEach((word) => {
    // Use word boundaries to match whole words only
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      // Keep first letter, replace rest with asterisks
      if (match.length <= 1) return match;
      return match[0] + '*'.repeat(match.length - 1);
    });
  });

  return result;
}
