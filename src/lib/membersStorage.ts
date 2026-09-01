/**
 * Helper for loading member photos and model images from Supabase Storage CDN.
 */
export const SUPABASE_MEMBERS_STORAGE_URL =
  `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qtdayzlrwmzdezkavjpd.supabase.co'}/storage/v1/object/public/members`;

export function getMemberImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.replace(/^\/?images\/members\//, '').replace(/^\//, '');
  return `${SUPABASE_MEMBERS_STORAGE_URL}/${cleanPath}`;
}
