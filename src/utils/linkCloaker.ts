/**
 * Link Cloaker & Smart Redirect Helper
 * Membantu membuat link mantulan (direct 302/301 redirect) gratis menggunakan
 * Cloudflare Workers / Pages atau encoding anti-bot Facebook.
 */

export interface ProductLinkItem {
  id: string;
  label: string;
  originalUrl: string;
  cloakedUrl?: string;
  clicks?: number;
}

/**
 * Script Cloudflare Workers universal (100% Gratis):
 * Cukup dibuat 1x di Cloudflare, dapat menangani ribuan link secara dinamis
 * tanpa perlu diubah-ubah lagi.
 */
export const CLOUDFLARE_WORKER_SCRIPT = `export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // 1. Ambil link tujuan dari parameter ?go= atau ?to= (base64)
    let target = url.searchParams.get("go") || url.searchParams.get("to");
    
    // 2. Dekode jika berformat Base64
    if (target && !target.startsWith("http")) {
      try {
        target = atob(target);
      } catch (e) {
        // Biarkan jika bukan base64 valid
      }
    }
    
    // 3. Jika URL valid, lakukan 302 Instant Direct Redirect (langsung lompat ke Shopee/Tujuan)
    if (target && (target.startsWith("http://") || target.startsWith("https://"))) {
      return Response.redirect(target, 302);
    }
    
    // 4. Fallback jika dibuka langsung tanpa link
    return new Response(
      "<html><body style='font-family:sans-serif;text-align:center;padding:50px;'><h2>⚡ CheapAds Smart Link Redirector</h2><p>Layanan pemantul link instan aktif & siap digunakan.</p></body></html>",
      { headers: { "content-type": "text/html;charset=UTF-8" }, status: 200 }
    );
  }
};`;

/**
 * Encode string ke Base64 yang aman untuk URL
 */
export function encodeUrlSafeBase64(str: string): string {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    return btoa(str);
  }
}

/**
 * Decode string dari Base64
 */
export function decodeUrlSafeBase64(str: string): string {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(Array.prototype.map.call(atob(base64), (c: string) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    return atob(str);
  }
}

/**
 * Dapatkan domain origin aplikasi saat ini untuk pemantul internal
 */
export function getAppRedirectOrigin(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return 'https://ais-dev-ijme26f7gumxuwiipbypbw-463529371600.asia-east1.run.app';
}

/**
 * Menghasilkan link mantulan aman anti-spam Facebook.
 * Dapat menggunakan Domain Aplikasi Ini (Built-in Web Redirector)
 * atau Cloudflare Worker kustom milik pengguna.
 */
export function generateCloakedLink(
  originalUrl: string, 
  workerBaseUrl?: string, 
  mode: 'base64' | 'plain' = 'base64'
): string {
  if (!originalUrl) return '';
  const trimmed = originalUrl.trim();
  
  // Tentukan basis URL pemantul
  let cleanBase = (workerBaseUrl || '').trim();
  if (!cleanBase || cleanBase === 'app' || cleanBase === 'builtin') {
    cleanBase = getAppRedirectOrigin();
  }

  if (!cleanBase.startsWith('http://') && !cleanBase.startsWith('https://')) {
    cleanBase = `https://${cleanBase}`;
  }
  cleanBase = cleanBase.replace(/\/+$/, '');

  if (mode === 'base64') {
    const encoded = encodeUrlSafeBase64(trimmed);
    return `${cleanBase}/?to=${encoded}`;
  } else {
    return `${cleanBase}/?go=${encodeURIComponent(trimmed)}`;
  }
}
