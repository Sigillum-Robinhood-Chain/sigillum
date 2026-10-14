/** Link akun X (Twitter) resmi Wagehold. Isi NEXT_PUBLIC_X_URL di .env.local,
 *  mis. https://x.com/wagehold -- sampai diisi, tombol di header membuka x.com. */
export const X_URL = process.env.NEXT_PUBLIC_X_URL || 'https://x.com/wageholdX';

/** Repo GitHub untuk tombol/tautan di header & footer. Isi NEXT_PUBLIC_GITHUB_URL
 *  di .env.local bila repo final berbeda. */
export const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL ||
  'https://github.com/Wagehold-Robinhood-Chain/Wagehold';
