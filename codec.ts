import { md5 } from '@takker/md5';

export { md5 };
export function encodeToHex(str: string): string {
  return Array.from(str).map((char) => char.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}
export function decodeUrl(url: string): string {
  return decodeURIComponent(url);
}
