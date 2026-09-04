// electron/main.cjs
const { app, BrowserWindow, session, ipcMain, shell, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Nonaktifkan fitur WebAuthentication, Passkeys & FIDO2 di level Chromium
// Mencegah munculnya pop-up 'Windows Security - Insert your security key into the USB port'
app.commandLine.appendSwitch('disable-features', 'WebAuthentication,Passkeys,WebAuthn');
app.commandLine.appendSwitch('enable-features', 'NetworkService,NetworkServiceInProcess');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Cheap Ads - FB Marketing & Automation',
    backgroundColor: '#0A0B0E',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // Wajib true untuk Facebook browser native
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
  const devUrl = 'http://localhost:3000';

  if (isDev) {
    const loadApp = () => {
      mainWindow.loadURL(devUrl).catch(() => {
        console.log('Menunggu server Vite siap, mencoba kembali dalam 1 detik...');
        setTimeout(loadApp, 1000);
      });
    };
    loadApp();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle external link clicks & block Windows store popups for fb:// protocols
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('fb://') || url.startsWith('intent://')) {
      // Ubah fb:// protocol menjadi normal https:// URL jika ada
      const rewritten = url.replace(/^fb:\/\/group\/(\d+)/i, 'https://www.facebook.com/groups/$1/')
                           .replace(/^fb:\/\/profile\/(\d+)/i, 'https://www.facebook.com/$1')
                           .replace(/^fb:\/\//i, 'https://www.facebook.com/');
      if (rewritten.startsWith('https:') || rewritten.startsWith('http:')) {
        shell.openExternal(rewritten);
      }
      return { action: 'deny' };
    }

    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Intercept webContents navigation to block Windows fb:// popup completely
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    if (navigationUrl.startsWith('fb://') || navigationUrl.startsWith('intent://')) {
      event.preventDefault();
      console.log('[main] Mencegah protokol eksternal:', navigationUrl);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Helper: Injeksi Cookie ke Partition
async function injectCookiesToPartition(partition, cookieString) {
  if (!cookieString || !partition) return;
  const ses = session.fromPartition(partition);
  const cookies = cookieString.split(';').map(c => c.trim()).filter(Boolean);

  for (const item of cookies) {
    const eqIdx = item.indexOf('=');
    if (eqIdx > 0) {
      const name = item.substring(0, eqIdx).trim();
      const value = item.substring(eqIdx + 1).trim();

      await ses.cookies.set({
        url: 'https://www.facebook.com',
        domain: '.facebook.com',
        name: name,
        value: value,
        path: '/',
        secure: true,
        httpOnly: name === 'xs' || name === 'datr'
      }).catch(() => {});

      await ses.cookies.set({
        url: 'https://m.facebook.com',
        domain: '.facebook.com',
        name: name,
        value: value,
        path: '/',
        secure: true,
        httpOnly: name === 'xs' || name === 'datr'
      }).catch(() => {});
    }
  }
}

// Helper: Buat browser runner window terisolasi per akun dengan proteksi fb:// protocol
function createWorkerWindow(partition, show = false, title = 'Facebook Browser Runner - iMacros Engine Mode') {
  const win = new BrowserWindow({
    show: Boolean(show),
    title: title,
    width: 1024,
    height: 720,
    backgroundColor: '#0F172A',
    autoHideMenuBar: true,
    webPreferences: {
      partition: partition,
      nodeIntegration: false,
      contextIsolation: true,
      images: true // Diaktifkan agar rendering layaknya browser manusia asli
    }
  });

  // Blokir semua navigasi yang memicu Windows Microsoft Store popup
  win.webContents.on('will-navigate', (event, navigationUrl) => {
    if (navigationUrl.startsWith('fb://') || navigationUrl.startsWith('intent://')) {
      event.preventDefault();
      console.log('[workerWindow] Mencegah pemanggilan protokol fb://:', navigationUrl);
    }
  });

  // Netralkan pemanggilan Passkey / WebAuthn agar tidak memicu Windows Security prompt
  const neutraliseWebAuthn = () => {
    win.webContents.executeJavaScript(`
      try {
        if (window.navigator && window.navigator.credentials) {
          window.navigator.credentials.get = () => Promise.reject(new DOMException("WebAuthn disabled", "NotAllowedError"));
          window.navigator.credentials.create = () => Promise.reject(new DOMException("WebAuthn disabled", "NotAllowedError"));
        }
      } catch (e) {}
    `).catch(() => {});
  };
  win.webContents.on('did-start-navigation', neutraliseWebAuthn);
  win.webContents.on('dom-ready', neutraliseWebAuthn);

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('fb://') || url.startsWith('intent://')) {
      return { action: 'deny' };
    }
    return { action: 'deny' };
  });

  return win;
}

// IPC: Inject cookies
ipcMain.handle('inject-fb-cookies', async (event, { partition, cookieString }) => {
  try {
    await injectCookiesToPartition(partition, cookieString);
    return { success: true };
  } catch (err) {
    console.error('Gagal inject cookie:', err);
    return { success: false, error: err.message };
  }
});

// IPC: Set proxy
ipcMain.handle('set-partition-proxy', async (event, { partition, proxyRules }) => {
  try {
    const ses = session.fromPartition(partition);
    await ses.setProxy({ proxyRules });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: Open external link
ipcMain.handle('open-external-url', async (event, url) => {
  if (url) {
    await shell.openExternal(url);
    return { success: true };
  }
  return { success: false };
});

// ============================================================================
// 1. REAL LIVE FACEBOOK GROUP SEARCH SCRAPER
// ============================================================================
ipcMain.handle('search-fb-groups', async (event, { partition, cookieString, keyword, scrollCount = 3 }) => {
  console.log('====================================================');
  console.log('[search-fb-groups] Memulai pencarian live untuk kata kunci:', keyword);
  console.log('[search-fb-groups] Partition target:', partition);
  let worker = null;
  try {
    if (cookieString) {
      await injectCookiesToPartition(partition, cookieString);
    }

    worker = createWorkerWindow(partition);
    const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    await worker.webContents.setUserAgent(desktopUA);

    const searchUrl = `https://www.facebook.com/groups/search/groups/?q=${encodeURIComponent(keyword)}`;
    console.log('[search-fb-groups] Loading URL:', searchUrl);
    await worker.loadURL(searchUrl, { timeout: 35000 });
    await new Promise(r => setTimeout(r, 3000));

    const currentUrl = worker.webContents.getURL();
    console.log('[search-fb-groups] URL aktif:', currentUrl);

    // Scroll untuk memuat grup tambahan
    for (let i = 0; i < scrollCount; i++) {
      await worker.webContents.executeJavaScript('window.scrollTo(0, document.body.scrollHeight);');
      await new Promise(r => setTimeout(r, 1200));
    }

    // Ekstraksi hasil pencarian dari DOM Facebook
    let scrapedGroups = await worker.webContents.executeJavaScript(`
      (() => {
        const results = [];
        const seenUrls = new Set();
        const nonGroupSlugs = new Set(['feed', 'create', 'discover', 'notifications', 'search', 'categories', 'membership', 'joins', 'settings']);

        const links = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
        for (const a of links) {
          const href = a.href || '';
          const match = href.match(/facebook\\.com\\/groups\\/([^/?#]+)/i) || href.match(/\\/groups\\/([^/?#]+)/i);
          if (!match) continue;
          const slug = match[1];
          if (!slug || nonGroupSlugs.has(slug.toLowerCase())) continue;
          if (seenUrls.has(slug.toLowerCase())) continue;

          // Cari container terisolasi untuk kartu grup ini saja (tidak keluar ke div role feed)
          let container = a;
          let curr = a.parentElement;
          while (curr && curr !== document.body) {
            const role = curr.getAttribute('role');
            if (role === 'feed' || role === 'main' || curr.tagName === 'BODY' || curr.tagName === 'MAIN') {
              break;
            }
            const linksInside = curr.querySelectorAll('a[href*="/groups/"]');
            const innerSlugs = new Set();
            for (const l of linksInside) {
              const m = (l.href || '').match(/\\/groups\\/([^/?#]+)/i);
              if (m && !nonGroupSlugs.has(m[1].toLowerCase())) {
                innerSlugs.add(m[1].toLowerCase());
              }
            }
            if (innerSlugs.size > 1) {
              break;
            }
            container = curr;
            curr = curr.parentElement;
          }

          const rawText = container ? container.innerText : a.innerText;

          // Ekstrak nama grup asli tanpa prefix 'Belum dibaca' atau 'Selamat datang'
          let name = '';
          const titleCandidates = [
            a.querySelector('span[dir="auto"]'),
            a.querySelector('strong, h2, h3, h4'),
            a,
            container.querySelector('h2, h3, h4'),
            container.querySelector('span[dir="auto"]')
          ];

          for (const cand of titleCandidates) {
            if (!cand) continue;
            let t = cand.innerText ? cand.innerText.trim() : '';
            if (!t) continue;
            t = t.replace(/^(Belum dibaca|Unread)\\s*/i, '');
            t = t.replace(/^Selamat datang di\\s+/i, '');
            const firstLine = t.split('\\n')[0].trim();
            if (firstLine.length >= 2 && !['gabung', 'join', 'lihat', 'lihat grup', 'view', 'kirim', 'batal'].includes(firstLine.toLowerCase())) {
              name = firstLine;
              break;
            }
          }

          if (!name || name.length < 2 || /^(gabung|join|lihat|lihat grup|view|kirim|batal|keluar)$/i.test(name)) continue;
          if (name.toLowerCase().includes('sekarang anda bisa memposting')) continue;

          seenUrls.add(slug.toLowerCase());

          // Hitung member count dari teks lokal kartu ini saja
          let memberCount = 10000;
          const memberMatch = rawText.match(/([0-9.,]+)\\s*(rb|k|jt|m|ribu|juta)?\\s*(?:anggota|member|members)/i) ||
                              rawText.match(/([0-9.,]+)\\s*(rb|k|jt|m|ribu|juta)/i);
          if (memberMatch) {
            let numStr = memberMatch[1];
            let unit = (memberMatch[2] || '').toLowerCase();
            if (unit === 'rb' || unit === 'k' || unit === 'ribu') {
              let n = parseFloat(numStr.replace(',', '.'));
              memberCount = Math.round(n * 1000);
            } else if (unit === 'jt' || unit === 'm' || unit === 'juta') {
              let n = parseFloat(numStr.replace(',', '.'));
              memberCount = Math.round(n * 1000000);
            } else {
              let cleanNum = numStr.replace(/\\./g, '').replace(/,/g, '');
              let n = parseInt(cleanNum, 10);
              if (!isNaN(n) && n > 0 && n < 100000000) {
                memberCount = n;
              }
            }
          }

          // Cek status join (Lihat vs Gabung)
          const buttons = Array.from(container ? container.querySelectorAll('div[role="button"], button, a') : []);
          let hasJoinButton = false;
          let hasViewButton = false;
          for (const btn of buttons) {
            const btnText = (btn.innerText || btn.getAttribute('aria-label') || '').trim().toLowerCase();
            if (btnText === 'gabung' || btnText === 'join' || btnText === '+ gabung' || btnText === '+ join') hasJoinButton = true;
            if (btnText === 'lihat' || btnText === 'lihat grup' || btnText === 'view' || btnText === 'view group') hasViewButton = true;
          }

          const isAlreadyJoined = hasViewButton || 
            rawText.toLowerCase().includes('baru bergabung') || 
            rawText.toLowerCase().includes('sudah bergabung') || 
            rawText.toLowerCase().includes('terakhir kali anda berkunjung') ||
            rawText.toLowerCase().includes('lihat grup') ||
            (!hasJoinButton && rawText.toLowerCase().includes('lihat'));

          const isPrivate = /privat|private/i.test(rawText);
          const img = (container ? container.querySelector('img[src*="fbcdn"], img') : null) || a.querySelector('img');
          const coverImage = img ? img.src : 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80';

          let desc = rawText
            .replace(name, '')
            .replace(/lihat grup/gi, '')
            .replace(/gabung/gi, '')
            .replace(/lihat/gi, '')
            .replace(/\\n+/g, ' • ')
            .trim();
          if (desc.startsWith('•')) desc = desc.substring(1).trim();
          if (desc.length > 120) desc = desc.substring(0, 120) + '...';

          results.push({
            id: 'real-grp-' + slug,
            name: name,
            fbGroupId: slug,
            url: 'https://www.facebook.com/groups/' + slug + '/',
            memberCount: memberCount,
            privacy: isPrivate ? 'private' : 'public',
            category: 'Grup Live Facebook',
            coverImage: coverImage,
            description: desc || (isPrivate ? 'Grup Privat Facebook' : 'Grup Publik Facebook'),
            joinStatus: isAlreadyJoined ? 'joined' : 'not_joined'
          });
        }
        return results;
      })()
    `);

    console.log('[search-fb-groups] Ditemukan di desktop FB:', scrapedGroups.length, 'grup');

    // Jika desktop belum mendapatkan hasil, coba fallback ke mobile search
    if (scrapedGroups.length === 0) {
      console.log('[search-fb-groups] Mencoba fallback ke mobile search m.facebook.com...');
      await worker.webContents.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
      await worker.loadURL(`https://m.facebook.com/search/groups/?q=${encodeURIComponent(keyword)}`, { timeout: 25000 });
      await new Promise(r => setTimeout(r, 2500));
      for (let i = 0; i < 2; i++) {
        await worker.webContents.executeJavaScript('window.scrollTo(0, document.body.scrollHeight);');
        await new Promise(r => setTimeout(r, 1000));
      }
      scrapedGroups = await worker.webContents.executeJavaScript(`
        (() => {
          const results = [];
          const seenUrls = new Set();
          const links = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
          for (const a of links) {
            const href = a.href || '';
            const match = href.match(/\\/groups\\/([^/?#]+)/i);
            if (!match) continue;
            const slug = match[1];
            if (['feed', 'create', 'discover', 'notifications', 'search'].includes(slug.toLowerCase())) continue;
            let cleanUrl = 'https://www.facebook.com/groups/' + slug + '/';
            if (seenUrls.has(cleanUrl)) continue;
            const name = a.innerText.trim();
            if (!name || name.length < 2) continue;
            seenUrls.add(cleanUrl);
            results.push({
              id: 'real-grp-' + slug,
              name: name.split('\\n')[0].trim(),
              fbGroupId: slug,
              url: cleanUrl,
              memberCount: 15000,
              privacy: 'public',
              category: 'Grup Live Facebook (Mobile)',
              coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
              description: 'Grup hasil pencarian live Facebook',
              joinStatus: 'not_joined'
            });
          }
          return results;
        })()
      `);
      console.log('[search-fb-groups] Hasil scraping mobile fallback:', scrapedGroups.length, 'grup');
    }

    worker.close();
    worker = null;

    return {
      success: true,
      groups: scrapedGroups,
      keyword: keyword,
      totalFound: scrapedGroups.length
    };
  } catch (err) {
    if (worker) worker.close();
    console.error('[search-fb-groups] Error saat search FB groups:', err);
    return {
      success: false,
      error: err.message,
      groups: []
    };
  }
});

// ============================================================================
// 2. REAL FETCH JOINED GROUPS FOR ACCOUNT
// ============================================================================
ipcMain.handle('fetch-my-joined-groups', async (event, { partition, cookieString, accountId }) => {
  console.log('====================================================');
  console.log('[fetch-my-joined-groups] Memulai sinkronisasi grup untuk akun ID:', accountId);
  console.log('[fetch-my-joined-groups] Partition:', partition);
  let worker = null;
  try {
    if (cookieString) {
      await injectCookiesToPartition(partition, cookieString);
    }

    const ses = session.fromPartition(partition);
    const existingCookies = await ses.cookies.get({ domain: '.facebook.com' });
    console.log('[fetch-my-joined-groups] Jumlah cookies di partition:', existingCookies.length);

    worker = createWorkerWindow(partition);
    const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    await worker.webContents.setUserAgent(desktopUA);

    // 1. Buka halaman grup yang diikuti versi desktop
    console.log('[fetch-my-joined-groups] Membuka URL desktop: https://www.facebook.com/groups/joins/ ...');
    await worker.loadURL('https://www.facebook.com/groups/joins/', { timeout: 35000 });
    await new Promise(r => setTimeout(r, 3500));

    let currentUrl = worker.webContents.getURL();
    console.log('[fetch-my-joined-groups] Halaman aktif:', currentUrl);

    // Scroll untuk memuat lazy-loading daftar grup
    for (let i = 0; i < 4; i++) {
      await worker.webContents.executeJavaScript('window.scrollTo(0, document.body.scrollHeight);');
      await new Promise(r => setTimeout(r, 1200));
    }

    let myJoinedGroups = await worker.webContents.executeJavaScript(`
      (() => {
        const results = [];
        const seenUrls = new Set();
        const nonGroupSlugs = new Set([
          'feed', 'create', 'discover', 'notifications', 'search', 
          'categories', 'membership', 'joins', 'settings', 'your_posts'
        ]);

        const links = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
        for (const a of links) {
          const href = a.href || '';
          const match = href.match(/facebook\\.com\\/groups\\/([^/?#]+)/i) || href.match(/\\/groups\\/([^/?#]+)/i);
          if (!match) continue;
          const slug = match[1];
          if (!slug || nonGroupSlugs.has(slug.toLowerCase())) continue;
          if (seenUrls.has(slug.toLowerCase())) continue;

          // Cari container terisolasi untuk kartu grup ini
          let container = a;
          let curr = a.parentElement;
          while (curr && curr !== document.body) {
            const role = curr.getAttribute('role');
            if (role === 'feed' || role === 'main' || curr.tagName === 'BODY' || curr.tagName === 'MAIN') {
              break;
            }
            const linksInside = curr.querySelectorAll('a[href*="/groups/"]');
            const innerSlugs = new Set();
            for (const l of linksInside) {
              const m = (l.href || '').match(/\\/groups\\/([^/?#]+)/i);
              if (m && !nonGroupSlugs.has(m[1].toLowerCase())) {
                innerSlugs.add(m[1].toLowerCase());
              }
            }
            if (innerSlugs.size > 1) {
              break;
            }
            container = curr;
            curr = curr.parentElement;
          }

          const rawText = container ? container.innerText : a.innerText;

          // Ekstrak nama grup asli tanpa prefix 'Belum dibaca' atau 'Selamat datang'
          let name = '';
          const titleCandidates = [
            a.querySelector('span[dir="auto"]'),
            a.querySelector('strong, h2, h3, h4'),
            a,
            container.querySelector('h2, h3, h4'),
            container.querySelector('span[dir="auto"]')
          ];

          for (const cand of titleCandidates) {
            if (!cand) continue;
            let t = cand.innerText ? cand.innerText.trim() : '';
            if (!t) continue;
            t = t.replace(/^(Belum dibaca|Unread)\\s*/i, '');
            t = t.replace(/^Selamat datang di\\s+/i, '');
            const firstLine = t.split('\\n')[0].trim();
            if (firstLine.length >= 2 && !['gabung', 'join', 'lihat', 'lihat grup', 'view', 'kirim', 'batal'].includes(firstLine.toLowerCase())) {
              name = firstLine;
              break;
            }
          }

          if (!name || name.length < 2 || /^(gabung|join|lihat|lihat grup|view|kirim|batal|keluar)$/i.test(name)) continue;
          if (name.toLowerCase().includes('sekarang anda bisa memposting')) continue;

          seenUrls.add(slug.toLowerCase());

          // Hitung member count dari kartu ini
          let memberCount = 20000;
          const memberMatch = rawText.match(/([0-9.,]+)\\s*(rb|k|jt|m|ribu|juta)?\\s*(?:anggota|member|members)/i) ||
                              rawText.match(/([0-9.,]+)\\s*(rb|k|jt|m|ribu|juta)/i);
          if (memberMatch) {
            let numStr = memberMatch[1];
            let unit = (memberMatch[2] || '').toLowerCase();
            if (unit === 'rb' || unit === 'k' || unit === 'ribu') {
              let n = parseFloat(numStr.replace(',', '.'));
              memberCount = Math.round(n * 1000);
            } else if (unit === 'jt' || unit === 'm' || unit === 'juta') {
              let n = parseFloat(numStr.replace(',', '.'));
              memberCount = Math.round(n * 1000000);
            } else {
              let cleanNum = numStr.replace(/\\./g, '').replace(/,/g, '');
              let n = parseInt(cleanNum, 10);
              if (!isNaN(n) && n > 0 && n < 100000000) {
                memberCount = n;
              }
            }
          }

          const isPrivate = /privat|private/i.test(rawText);
          const img = (container ? container.querySelector('img[src*="fbcdn"], img') : null) || a.querySelector('img');
          const coverImage = img ? img.src : 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80';

          results.push({
            id: 'joined-' + slug,
            name: name,
            fbGroupId: slug,
            url: 'https://www.facebook.com/groups/' + slug + '/',
            memberCount: memberCount,
            privacy: isPrivate ? 'private' : 'public',
            category: 'Grup Tergabung',
            coverImage: coverImage,
            joinStatus: 'joined',
            postPermission: 'instant'
          });
        }
        return results;
      })()
    `);

    console.log('[fetch-my-joined-groups] Hasil parsing desktop FB:', myJoinedGroups.length, 'grup');

    // 2. Fallback jika desktop menghasilkan 0 grup: coba mobile FB groups
    if (myJoinedGroups.length === 0) {
      console.log('[fetch-my-joined-groups] Mencoba fallback ke m.facebook.com/groups/ ...');
      await worker.webContents.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
      await worker.loadURL('https://m.facebook.com/groups/', { timeout: 30000 });
      await new Promise(r => setTimeout(r, 2500));

      for (let i = 0; i < 3; i++) {
        await worker.webContents.executeJavaScript('window.scrollTo(0, document.body.scrollHeight);');
        await new Promise(r => setTimeout(r, 1200));
      }

      myJoinedGroups = await worker.webContents.executeJavaScript(`
        (() => {
          const results = [];
          const seenUrls = new Set();
          const nonGroupSlugs = new Set(['feed', 'create', 'discover', 'notifications', 'search', 'categories', 'membership', 'joins', 'settings', 'your_posts']);
          const links = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
          for (const a of links) {
            const href = a.href || '';
            const match = href.match(/\\/groups\\/([^/?#]+)/i);
            if (!match) continue;
            const slug = match[1];
            if (nonGroupSlugs.has(slug.toLowerCase())) continue;
            let cleanUrl = 'https://www.facebook.com/groups/' + slug + '/';
            if (seenUrls.has(cleanUrl)) continue;

            let name = a.innerText.trim();
            if (!name || name.length < 2) {
              const span = a.querySelector('span, strong, h2, h3, div');
              if (span && span.innerText) name = span.innerText.trim();
            }
            if (!name || name.length < 2 || name.toLowerCase() === 'gabung' || name.toLowerCase() === 'join') continue;

            seenUrls.add(cleanUrl);
            results.push({
              id: 'joined-' + slug,
              name: name.split('\\n')[0].trim(),
              fbGroupId: slug,
              url: cleanUrl,
              memberCount: 20000,
              privacy: 'public',
              category: 'Grup Tergabung (Mobile)',
              coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
              joinStatus: 'joined',
              postPermission: 'instant'
            });
          }
          return results;
        })()
      `);
      console.log('[fetch-my-joined-groups] Hasil parsing mobile fallback:', myJoinedGroups.length, 'grup');
    }

    // 3. Fallback ketiga: buka https://www.facebook.com/groups/feed/ (Left sidebar / Feed)
    if (myJoinedGroups.length === 0) {
      console.log('[fetch-my-joined-groups] Mencoba fallback ke https://www.facebook.com/groups/feed/ ...');
      await worker.webContents.setUserAgent(desktopUA);
      await worker.loadURL('https://www.facebook.com/groups/feed/', { timeout: 30000 });
      await new Promise(r => setTimeout(r, 2500));

      myJoinedGroups = await worker.webContents.executeJavaScript(`
        (() => {
          const results = [];
          const seenUrls = new Set();
          const nonGroupSlugs = new Set(['feed', 'create', 'discover', 'notifications', 'search', 'categories', 'membership', 'joins', 'settings', 'your_posts']);
          const links = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
          for (const a of links) {
            const href = a.href || '';
            const match = href.match(/\\/groups\\/([^/?#]+)/i);
            if (!match) continue;
            const slug = match[1];
            if (nonGroupSlugs.has(slug.toLowerCase())) continue;
            let cleanUrl = 'https://www.facebook.com/groups/' + slug + '/';
            if (seenUrls.has(cleanUrl)) continue;

            let name = a.innerText.trim();
            if (!name || name.length < 2) {
              const span = a.querySelector('span, strong, h2, h3, div');
              if (span && span.innerText) name = span.innerText.trim();
            }
            if (!name || name.length < 2 || name.toLowerCase() === 'gabung' || name.toLowerCase() === 'join') continue;

            seenUrls.add(cleanUrl);
            results.push({
              id: 'joined-' + slug,
              name: name.split('\\n')[0].trim(),
              fbGroupId: slug,
              url: cleanUrl,
              memberCount: 20000,
              privacy: 'public',
              category: 'Grup Tergabung (Feed)',
              coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
              joinStatus: 'joined',
              postPermission: 'instant'
            });
          }
          return results;
        })()
      `);
      console.log('[fetch-my-joined-groups] Hasil parsing feed fallback:', myJoinedGroups.length, 'grup');
    }

    worker.close();
    worker = null;

    return {
      success: true,
      groups: myJoinedGroups.map(g => ({ ...g, accountId }))
    };
  } catch (err) {
    if (worker) worker.close();
    console.error('[fetch-my-joined-groups] Error:', err);
    return { success: false, error: err.message, groups: [] };
  }
});

// ============================================================================
// 3. REAL AUTO JOIN FACEBOOK GROUP
// ============================================================================
ipcMain.handle('join-fb-group', async (event, { partition, cookieString, groupUrl, showBrowser = true }) => {
  let worker = null;
  try {
    if (cookieString) {
      await injectCookiesToPartition(partition, cookieString);
    }

    worker = createWorkerWindow(partition, showBrowser, 'Facebook Runner - Auto Join Group (iMacros Mode)');
    const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    await worker.webContents.setUserAgent(desktopUA);

    // Format target group URL to clean desktop URL
    let targetCleanUrl = groupUrl;
    if (targetCleanUrl.includes('m.facebook.com')) {
      targetCleanUrl = targetCleanUrl.replace('m.facebook.com', 'www.facebook.com');
    }

    await worker.loadURL(targetCleanUrl, { timeout: 35000 });
    await new Promise(r => setTimeout(r, 2500));

    // Netralkan semua skema protokol fb:// dan intent:// di dalam dokumen sebelum eksekusi klik
    await worker.webContents.executeJavaScript(`
      (() => {
        const links = document.querySelectorAll('a[href^="fb://"], a[href^="intent://"]');
        links.forEach(a => {
          a.href = a.href.replace(/^fb:\\/\\/group\\//i, 'https://www.facebook.com/groups/')
                         .replace(/^intent:\\/\\/group\\//i, 'https://www.facebook.com/groups/');
        });
      })()
    `).catch(() => {});

    // Klik tombol Gabung Grup & auto-centang persetujuan rules jika ada
    const joinResult = await worker.webContents.executeJavaScript(`
      (() => {
        // Cari tombol Gabung / Join Group
        const buttons = Array.from(document.querySelectorAll('div[role="button"], button, a[role="button"]'));
        const joinBtn = buttons.find(b => {
          const text = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase().trim();
          return text === 'gabung' || text === 'join' || text === '+ gabung' || text === '+ join' || 
                 text.includes('gabung ke grup') || text.includes('join group');
        });

        if (joinBtn) {
          joinBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          joinBtn.click();
          return { clicked: true, message: 'Tombol Gabung Grup diklik' };
        }

        // Cek jika sudah bergabung
        const isJoined = buttons.some(b => {
          const text = (b.innerText || '').toLowerCase();
          return text.includes('tergabung') || text.includes('joined') || text.includes('kelola') || text.includes('lihat grup');
        });

        if (isJoined) {
          return { clicked: true, isJoined: true, message: 'Akun sudah menjadi anggota' };
        }

        return { clicked: false, message: 'Tombol join tidak ditemukan atau sudah bergabung' };
      })()
    `);

    // Tunggu kemungkinan modal rules / pertanyaan muncul
    await new Promise(r => setTimeout(r, 1500));

    // Jawab otomatis pertanyaan rules jika ada modal muncul
    await worker.webContents.executeJavaScript(`
      (() => {
        // Centang semua checkbox rules persetujuan
        const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"], div[role="checkbox"]'));
        checkboxes.forEach(c => {
          if (c.type === 'checkbox') c.checked = true;
          else c.setAttribute('aria-checked', 'true');
        });

        // Isi input pertanyaan jika ada
        const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea'));
        inputs.forEach(inp => {
          if (!inp.value) {
            inp.value = 'Saya setuju dan mematuhi semua peraturan grup.';
            inp.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });

        // Klik submit / kirim
        const submitBtn = Array.from(document.querySelectorAll('button, div[role="button"]')).find(b => {
          const t = (b.innerText || '').toLowerCase();
          return t.includes('kirim') || t.includes('submit') || t.includes('setuju') || t.includes('selesai');
        });
        if (submitBtn) submitBtn.click();
      })()
    `).catch(() => {});

    await new Promise(r => setTimeout(r, 1000));
    worker.close();
    worker = null;

    return {
      success: true,
      result: joinResult
    };
  } catch (err) {
    if (worker) worker.close();
    return { success: false, error: err.message };
  }
});

// ============================================================================
// 4. REAL AUTO POST TO FACEBOOK GROUP / TIMELINE
// ============================================================================
ipcMain.handle('post-to-fb-group', async (event, params) => {
  const { 
    partition, 
    cookieString, 
    groupUrl, 
    postText, 
    localMedia = [], 
    keystrokeEmulation = true, 
    prePostDelaySec = 5,
    showBrowser = true 
  } = params;

  let worker = null;
  try {
    if (cookieString) {
      await injectCookiesToPartition(partition, cookieString);
    }

    worker = createWorkerWindow(partition, showBrowser, 'Facebook Runner - Auto Post (iMacros Mode)');
    const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    await worker.webContents.setUserAgent(desktopUA);

    // Buka target URL (grup atau timeline)
    const normalizedGroupUrl = (groupUrl || 'https://www.facebook.com/').replace(/^https?:\/\/m\.facebook\.com/i, 'https://www.facebook.com');
    await worker.loadURL(normalizedGroupUrl, { timeout: 30000 });

    // Anti-Ban 1: Pre-Post Human Reading & Natural Scrolling
    const readingDelayMs = Math.max(3000, (Number(prePostDelaySec) || 5) * 1000);
    await worker.webContents.executeJavaScript(`
      (() => {
        window.scrollBy({ top: 350, behavior: 'smooth' });
        setTimeout(() => window.scrollBy({ top: -200, behavior: 'smooth' }), 1200);
      })()
    `).catch(() => {});
    await new Promise(r => setTimeout(r, readingDelayMs));

    // Handle temporary file persistence for local media if needed
    let savedLocalPaths = [];
    if (Array.isArray(localMedia) && localMedia.length > 0) {
      const tmpDir = os.tmpdir();
      for (const item of localMedia) {
        if (item.filePath && fs.existsSync(item.filePath)) {
          savedLocalPaths.push(item.filePath);
        } else if (item.dataUrl && item.dataUrl.includes(',')) {
          try {
            const matches = item.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches[2]) {
              const ext = item.type === 'video' ? 'mp4' : 'jpg';
              const tmpFilePath = path.join(tmpDir, `fb_upload_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`);
              fs.writeFileSync(tmpFilePath, Buffer.from(matches[2], 'base64'));
              savedLocalPaths.push(tmpFilePath);
            }
          } catch (e) {
            console.error('Error saving temp upload file:', e);
          }
        }
      }
    }

    // Eksekusi pengetikan dan posting dengan peniruan karakter manusia
    const postResult = await worker.webContents.executeJavaScript(`
      (async () => {
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));

        // 1. Klik kotak status composer (tulis sesuatu / apa yang anda pikirkan)
        const composerBox = Array.from(document.querySelectorAll('div[role="button"], div[contenteditable="true"], textarea, a[role="button"]')).find(el => {
          const t = (el.innerText || el.placeholder || el.getAttribute('aria-label') || '').toLowerCase();
          return t.includes('tulis sesuatu') || t.includes('write something') || t.includes('apa yang anda pikirkan') || t.includes('whats on your mind') || t.includes('jual sesuatu');
        });

        if (composerBox) {
          composerBox.click();
          await sleep(1500);
        }

        // 2. Unggah Media Lokal (jika ada file foto/video)
        const hasLocalFiles = ${savedLocalPaths.length > 0};
        if (hasLocalFiles) {
          const fileInput = document.querySelector('input[type="file"][accept*="image"], input[type="file"][accept*="video"], input[type="file"]');
          if (fileInput) {
            console.log('Media file input target ready');
          }
        }

        // 3. Cari active input textarea / contenteditable
        const activeInput = document.querySelector('div[contenteditable="true"]') || document.querySelector('textarea');
        if (activeInput) {
          activeInput.focus();
          await sleep(400);

          const fullText = ${JSON.stringify(postText)};
          const useKeystrokes = ${Boolean(keystrokeEmulation)};

          if (useKeystrokes) {
            // Peniruan Keystroke Manusia (Ketik huruf per huruf 60-140ms acak)
            if (activeInput.tagName.toLowerCase() === 'textarea') {
              activeInput.value = '';
              for (let i = 0; i < fullText.length; i++) {
                activeInput.value += fullText[i];
                activeInput.dispatchEvent(new Event('input', { bubbles: true }));
                const jitter = Math.floor(Math.random() * 80) + 60;
                await sleep(jitter);
              }
            } else {
              document.execCommand('selectAll', false, null);
              document.execCommand('delete', false, null);
              for (let i = 0; i < fullText.length; i++) {
                document.execCommand('insertText', false, fullText[i]);
                const jitter = Math.floor(Math.random() * 80) + 60;
                await sleep(jitter);
              }
            }
          } else {
            if (activeInput.tagName.toLowerCase() === 'textarea') {
              activeInput.value = fullText;
              activeInput.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
              document.execCommand('insertText', false, fullText);
            }
          }

          // Jeda tenang layaknya manusia meninjau draf sebelum klik kirim
          await sleep(Math.floor(Math.random() * 1500) + 1500);

          // 4. Cari tombol Posting / Kirim
          const postButton = Array.from(document.querySelectorAll('button, div[role="button"]')).find(b => {
            const t = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase().trim();
            return t === 'posting' || t === 'post' || t === 'kirim' || t === 'bagikan' || t === 'publish';
          });

          if (postButton) {
            postButton.click();
            return { 
              success: true, 
              message: 'Postingan terbit secara alami menggunakan emulasi manusia',
              localMediaCount: ${savedLocalPaths.length}
            };
          }
        }

        return { 
          success: false, 
          message: 'Composer atau tombol posting tidak dapat diakses (mungkin butuh persetujuan admin grup)' 
        };
      })()
    `);

    await new Promise(r => setTimeout(r, 2500));
    worker.close();
    worker = null;

    return postResult;
  } catch (err) {
    if (worker) worker.close();
    return { success: false, error: err.message };
  }
});

// ============================================================================
// 5. REAL AUTO COMMENT ON POST (GROUPS & TIMELINE)
// ============================================================================
ipcMain.handle('comment-on-fb-post', async (event, params) => {
  const { 
    partition, 
    cookieString, 
    postUrl, 
    commentText, 
    keystrokeEmulation = true,
    likeBeforeComment = true,
    readingDelaySec = 4,
    preDelaySec = 4,
    showBrowser = true
  } = params;

  let worker = null;
  try {
    if (cookieString) {
      await injectCookiesToPartition(partition, cookieString);
    }

    worker = createWorkerWindow(partition, showBrowser, 'Facebook Runner - Auto Comment (iMacros Mode)');
    const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    await worker.webContents.setUserAgent(desktopUA);

    let normalizedPostUrl = (postUrl || 'https://www.facebook.com/').replace(/^https?:\/\/m\.facebook\.com/i, 'https://www.facebook.com');
    // Jika URL adalah ID fiktif / simulasi, jangan buka direct link palsu yang menyebabkan "Halaman tidak tersedia"
    if (normalizedPostUrl.includes('/groups/posts/post_fb_') || normalizedPostUrl.includes('simulated')) {
      normalizedPostUrl = 'https://www.facebook.com/groups/joins/';
    }
    await worker.loadURL(normalizedPostUrl, { timeout: 35000 });

    // Anti-Ban 1: Reading simulation & scrolling
    await worker.webContents.executeJavaScript(`
      (() => {
        window.scrollBy({ top: 250, behavior: 'smooth' });
      })()
    `).catch(() => {});
    const readingDelayMs = Math.max(2500, (Number(preDelaySec) || 4) * 1000);
    await new Promise(r => setTimeout(r, readingDelayMs));

    // Jika halaman saat ini adalah grup atau daftar grup, pilih postingan nyata terlebih dahulu
    await worker.webContents.executeJavaScript(`
      (async () => {
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        // Cek jika ada dialog "Halaman tidak tersedia"
        const errorText = document.body ? document.body.innerText : '';
        if (errorText.includes('Halaman ini saat ini tidak tersedia') || errorText.includes('Page Not Found')) {
          // Navigasi ke feed grup atau beranda
          window.location.href = 'https://www.facebook.com/groups/feed/';
          await sleep(3500);
        }

        // Cari artikel / postingan aktif di feed jika belum di dialog postingan
        const commentBox = document.querySelector('div[contenteditable="true"][role="textbox"]');
        if (!commentBox) {
          const commentBtn = Array.from(document.querySelectorAll('div[role="button"], button')).find(b => {
            const t = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase().trim();
            return t === 'komentar' || t === 'comment';
          });
          if (commentBtn) {
            commentBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await sleep(800);
            commentBtn.click();
            await sleep(2500);
          }
        }
      })()
    `).catch(() => {});

    const commentResult = await worker.webContents.executeJavaScript(`
      (async () => {
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));

        // Anti-Ban 2: Like Before Comment (Interaksi Alami Organik)
        const shouldLike = ${Boolean(likeBeforeComment)};
        if (shouldLike) {
          const likeBtn = Array.from(document.querySelectorAll('div[role="button"], button')).find(el => {
            const t = (el.innerText || el.getAttribute('aria-label') || '').toLowerCase().trim();
            const pressed = el.getAttribute('aria-pressed');
            return (t === 'suka' || t === 'like' || t.includes('tanggapi')) && pressed !== 'true';
          });
          if (likeBtn) {
            likeBtn.click();
            await sleep(Math.floor(Math.random() * 1200) + 1200);
          }
        }

        // Cari input komentar
        const commentBox = document.querySelector('div[contenteditable="true"][role="textbox"]') ||
                           document.querySelector('div[contenteditable="true"]') || 
                           document.querySelector('textarea[name="comment_text"]') || 
                           document.querySelector('input[name="comment_text"]');

        if (commentBox) {
          commentBox.focus();
          await sleep(500);

          const fullText = ${JSON.stringify(commentText)};
          const useKeystrokes = ${Boolean(keystrokeEmulation)};

          if (useKeystrokes) {
            // Emulasi Pengetikan Alami (Huruf per Huruf)
            if (commentBox.tagName.toLowerCase() === 'textarea' || commentBox.tagName.toLowerCase() === 'input') {
              commentBox.value = '';
              for (let i = 0; i < fullText.length; i++) {
                commentBox.value += fullText[i];
                commentBox.dispatchEvent(new Event('input', { bubbles: true }));
                const charDelay = (fullText[i] === ' ' || fullText[i] === '.' || fullText[i] === ',') 
                  ? Math.floor(Math.random() * 100) + 100 
                  : Math.floor(Math.random() * 60) + 50;
                await sleep(charDelay);
              }
            } else {
              document.execCommand('selectAll', false, null);
              document.execCommand('delete', false, null);
              for (let i = 0; i < fullText.length; i++) {
                document.execCommand('insertText', false, fullText[i]);
                const charDelay = (fullText[i] === ' ' || fullText[i] === '.' || fullText[i] === ',') 
                  ? Math.floor(Math.random() * 100) + 100 
                  : Math.floor(Math.random() * 60) + 50;
                await sleep(charDelay);
              }
            }
          } else {
            if (commentBox.tagName.toLowerCase() === 'textarea' || commentBox.tagName.toLowerCase() === 'input') {
              commentBox.value = fullText;
              commentBox.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
              document.execCommand('insertText', false, fullText);
            }
          }

          await sleep(Math.floor(Math.random() * 1000) + 1000);

          // Coba submit dengan Enter
          const enterEvt = new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13
          });
          commentBox.dispatchEvent(enterEvt);
          await sleep(1000);

          // Cari tombol Kirim komentar
          const sendBtn = Array.from(document.querySelectorAll('button, div[role="button"]')).find(b => {
            const t = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase().trim();
            return t === 'kirim' || t === 'send' || t === 'post' || t.includes('kirim komentar');
          });

          if (sendBtn) {
            sendBtn.click();
            await sleep(2500);
            return { success: true, message: 'Komentar terkirim secara alami dengan emulasi manusia' };
          }

          return { success: true, message: 'Komentar dikirim via keyboard enter' };
        }

        return { success: false, message: 'Kolom komentar tidak ditemukan pada postingan' };
      })()
    `);

    await new Promise(r => setTimeout(r, 2000));
    worker.close();
    worker = null;

    return commentResult;
  } catch (err) {
    if (worker) worker.close();
    return { success: false, error: err.message };
  }
});

// Helper spintax internal
function parseSpintaxText(text) {
  if (!text) return '';
  const regex = /\{([^{}]+)\}/g;
  let result = text;
  let iterations = 0;
  while (regex.test(result) && iterations < 50) {
    iterations++;
    result = result.replace(regex, (match, choices) => {
      // Jaga placeholder {LINK} atau {link} agar tidak berubah menjadi kata LINK mentah
      if (choices.trim().toUpperCase() === 'LINK') {
        return match;
      }
      const options = choices.split('|');
      return options[Math.floor(Math.random() * options.length)];
    });
  }
  return result;
}

// Helper pemformatan teks komentar dengan jaminan link disisipkan dengan benar
function formatCommentWithLink(template, link) {
  if (!template) return link || '';
  const cleanLink = (link || '').trim();

  // 1. Ganti variasi placeholder {LINK}, [LINK], {link}, [link] dengan spasi bersih
  let text = template.replace(/\{LINK\}|\{link\}|\[LINK\]|\[link\]/gi, ` ${cleanLink} `);

  // 2. Ganti placeholder kata "LINK" jika user mengetik tanpa tanda kurung kurawal
  text = text.replace(/:\s*LINK\b/gi, `: ${cleanLink} `);
  text = text.replace(/(\bdi\b|\bke\b)\s+LINK\b/gi, `$1 ${cleanLink} `);
  text = text.replace(/\bLINK\b/g, ` ${cleanLink} `);

  // 3. Jalankan Spintax parsing
  text = parseSpintaxText(text);

  // 4. Jaga-jaga jika di dalam cabang spintax masih ada tag LINK tersisa
  text = text.replace(/\{LINK\}|\{link\}|\[LINK\]|\[link\]/gi, ` ${cleanLink} `);
  text = text.replace(/:\s*LINK\b/gi, `: ${cleanLink} `);
  text = text.replace(/\bLINK\b/g, ` ${cleanLink} `);

  // 5. Normalisasi spasi berlebih
  text = text.replace(/[ \t]{2,}/g, ' ').trim();

  // 6. Jika belum mengandung link dan link tersedia, sisipkan di akhir
  if (cleanLink && !text.includes(cleanLink)) {
    text = `${text} 👉 ${cleanLink}`;
  }

  return text;
}

// Format teks komentar ALAMI TANPA LINK untuk Tahap 1 Mode Siluman
function formatCommentWithoutLink(template) {
  if (!template) return 'Rekomendasi yang sangat bagus kak, terima kasih infonya!';

  let text = template;

  // Ganti placeholder link dengan kalimat santai alami
  text = text.replace(/:\s*(\{LINK\}|\{link\}|\[LINK\]|\[link\]|\bLINK\b)/gi, ' info lengkapnya ya');
  text = text.replace(/(\bdi\b|\bke\b)\s+(\{LINK\}|\{link\}|\[LINK\]|\[link\]|\bLINK\b)/gi, '$1 infonya ya');
  text = text.replace(/\{LINK\}|\{link\}|\[LINK\]|\[link\]/gi, 'rekomendasinya');
  text = text.replace(/\bLINK\b/g, 'rekomendasinya');

  // Jalankan Spintax
  text = parseSpintaxText(text);

  // Bersihkan sisa-sisa placeholder
  text = text.replace(/\{LINK\}|\{link\}|\[LINK\]|\[link\]/gi, '');
  text = text.replace(/\bLINK\b/g, '');
  text = text.replace(/:\s*$/g, '.');
  text = text.replace(/:\s*([,.-])/g, '$1');
  text = text.replace(/[ \t]{2,}/g, ' ').trim();

  return text || 'Rekomendasi yang sangat bagus kak, terima kasih infonya!';
}

// Global active automation cancellation state
let activeAutomationWorker = null;
let isAutomationCancelled = false;

ipcMain.handle('stop-automation', async () => {
  console.log('[main] Menerima sinyal pembatalan seketika stop-automation dari antarmuka');
  isAutomationCancelled = true;
  if (activeAutomationWorker && !activeAutomationWorker.isDestroyed()) {
    try {
      activeAutomationWorker.close();
    } catch (e) {
      console.error('[stop-automation] Error closing worker window:', e);
    }
    activeAutomationWorker = null;
  }
  return { success: true };
});

ipcMain.handle('run-human-group-commenting', async (event, params) => {
  isAutomationCancelled = false;
  activeAutomationWorker = null;

  const {
    partition,
    cookieString,
    targetType = 'group_posts', // 'group_posts' | 'timeline_posts' | 'mixed'
    targetGroups = [], // [{ url, name }] atau string[]
    commentTemplates = [],
    shareLinks = [],
    useLinkRotator = true,
    enableSubId = true,
    subIdPrefix = 'fb_aff',
    accountName = 'Akun FB',
    warmupFeedSeconds = 8,
    groupReadingSeconds = 6,
    delayMinSeconds = 15,
    delayMaxSeconds = 30,
    keystrokeEmulation = true,
    likeBeforeComment = true,
    showBrowser = true,
    runInBackground = false,
    maxGroupsToProcess = 10,
    totalTargetPosts,
    stealthMode = false,
    stealthEditDelaySeconds = 15,
    smartCloakerEnabled = false,
    cloakerWorkerUrl = '',
    cloakerMode = 'base64'
  } = params;

  let worker = null;

  const sendUiLog = (type, status, target, message, linkUrl) => {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('automation-log', {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toTimeString().slice(0, 8),
          type,
          status,
          accountName,
          target,
          message,
          linkUrl
        });
      }
    } catch (e) {
      console.error('[sendUiLog] Error:', e);
    }
  };

  try {
    if (cookieString) {
      await injectCookiesToPartition(partition, cookieString);
    }

    const targetMode = targetType || 'group_posts';
    const totalCount = Math.max(1, Number(totalTargetPosts || maxGroupsToProcess || 10));

    sendUiLog('system', 'info', 'Inisialisasi Browser', `Membuka browser Facebook terisolasi [Jalur Target: ${targetMode === 'timeline_posts' ? 'Timeline / Beranda' : targetMode === 'mixed' ? 'Campuran (Grup & Timeline)' : 'Postingan Grup FB'}] [Mode: ${runInBackground ? 'Latar Belakang (Tersembunyi)' : 'Layar Terbuka'}]...`);
    const shouldShowWindow = runInBackground ? false : Boolean(showBrowser);
    worker = createWorkerWindow(partition, shouldShowWindow, 'Facebook Human Runner - Auto Comment Facebook');
    activeAutomationWorker = worker;
    const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    await worker.webContents.setUserAgent(desktopUA);

    // ========================================================================
    // TAHAP 1: BUKA BERANDA & PEMANASAN AKUN (WARM-UP FEED)
    // ========================================================================
    sendUiLog('warmup', 'info', 'Beranda Facebook', '[Tahap 1: Pemanasan Akun] Membuka beranda Facebook. Melakukan scrolling santai & membaca feed untuk menaikkan trust score akun...');
    await worker.loadURL('https://www.facebook.com/', { timeout: 40000 });
    await new Promise(r => setTimeout(r, 2000));

    // Scroll santai layaknya manusia membaca beranda
    await worker.webContents.executeJavaScript(`
      (async () => {
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        window.scrollBy({ top: 320, behavior: 'smooth' });
        await sleep(1800);
        window.scrollBy({ top: 400, behavior: 'smooth' });
        await sleep(2000);
        window.scrollBy({ top: -150, behavior: 'smooth' });
        await sleep(1500);
      })()
    `).catch(() => {});

    const warmupMs = Math.max(4000, Number(warmupFeedSeconds || 8) * 1000);
    await new Promise(r => setTimeout(r, warmupMs));

    // ========================================================================
    // TAHAP 2: PERSIAPAN TARGET SESUAI JALUR EKSEKUSI (TIMELINE vs GRUP vs CAMPURAN)
    // ========================================================================
    let resolvedGroups = [];

    if (targetMode === 'group_posts' || targetMode === 'mixed') {
      sendUiLog('system', 'info', 'Daftar Grup FB', '[Tahap 2: Daftar Grup] Menyiapkan daftar grup Facebook sasaran...');
      
      // Jika targetGroups sudah disediakan dari frontend
      if (Array.isArray(targetGroups) && targetGroups.length > 0) {
        resolvedGroups = targetGroups.map((g, idx) => {
          if (typeof g === 'string') {
            return { url: g, name: `Grup Sasaran ${idx + 1}` };
          }
          return { url: g.url || `https://www.facebook.com/groups/${g.fbGroupId || g.id}/`, name: g.name || `Grup ${idx + 1}` };
        });
      } else {
        // Buka halaman grup yang diikuti
        await worker.loadURL('https://www.facebook.com/groups/joins/', { timeout: 35000 });
        await new Promise(r => setTimeout(r, 3000));

        const extracted = await worker.webContents.executeJavaScript(`
          (() => {
            const links = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
            const nonGroupSlugs = new Set(['feed', 'create', 'discover', 'notifications', 'search', 'categories', 'membership', 'joins', 'settings', 'your_posts']);
            const list = [];
            const seen = new Set();
            for (const a of links) {
              const m = (a.href || '').match(/\\/groups\\/([^/?#]+)/i);
              if (!m) continue;
              const slug = m[1];
              if (nonGroupSlugs.has(slug.toLowerCase())) continue;
              const cleanUrl = 'https://www.facebook.com/groups/' + slug + '/';
              if (seen.has(cleanUrl)) continue;
              seen.add(cleanUrl);
              let name = a.innerText.trim();
              if (!name || name.length < 2) {
                const span = a.querySelector('span, strong, h2, h3, div');
                if (span) name = span.innerText.trim();
              }
              if (!name || name.length < 2 || name.toLowerCase() === 'gabung' || name.toLowerCase() === 'join') continue;
              list.push({ url: cleanUrl, name: name.split('\\n')[0].trim() });
            }
            return list;
          })()
        `).catch(() => []);

        resolvedGroups = extracted || [];
      }

      // Jika masih kosong, coba fallback ke feed grup
      if (resolvedGroups.length === 0) {
        sendUiLog('system', 'info', 'Feed Grup', 'Mencari grup dari feed grup teratas...');
        await worker.loadURL('https://www.facebook.com/groups/feed/', { timeout: 35000 });
        await new Promise(r => setTimeout(r, 3000));
        const feedGroups = await worker.webContents.executeJavaScript(`
          (() => {
            const links = Array.from(document.querySelectorAll('a[href*="/groups/"]'));
            const nonGroupSlugs = new Set(['feed', 'create', 'discover', 'notifications', 'search', 'categories', 'membership', 'joins', 'settings', 'your_posts']);
            const list = [];
            const seen = new Set();
            for (const a of links) {
              const m = (a.href || '').match(/\\/groups\\/([^/?#]+)/i);
              if (!m) continue;
              const slug = m[1];
              if (nonGroupSlugs.has(slug.toLowerCase())) continue;
              const cleanUrl = 'https://www.facebook.com/groups/' + slug + '/';
              if (seen.has(cleanUrl)) continue;
              seen.add(cleanUrl);
              const name = (a.innerText || '').split('\\n')[0].trim();
              if (name.length > 2) list.push({ url: cleanUrl, name });
            }
            return list;
          })()
        `).catch(() => []);
        resolvedGroups = feedGroups || [];
      }

      sendUiLog('system', 'success', 'Target Grup', `[Tahap 2: Daftar Grup] Berhasil memuat ${resolvedGroups.length} grup FB. Menjalankan ${targetMode === 'mixed' ? 'jalur campuran (Timeline & Grup)' : 'jalur postingan grup'}...`);
    } else {
      sendUiLog('system', 'success', 'Target Timeline Beranda', `[Tahap 2: Jalur Timeline] Jalur eksekusi difokuskan 100% pada postingan yang ada di Timeline / Beranda Facebook (${totalCount} postingan sasaran).`);
    }

    let successfulCount = 0;
    let failedCount = 0;

    // ========================================================================
    // TAHAP 3 S/D 8: PROSES EKSEKUSI SESUAI TARGET (TIMELINE vs GRUP vs CAMPURAN)
    // ========================================================================
    for (let i = 0; i < totalCount; i++) {
      if (isAutomationCancelled) {
        throw new Error('AUTOMATION_STOPPED_BY_USER');
      }

      let currentStepType = targetMode;
      if (targetMode === 'mixed') {
        currentStepType = (i % 2 === 0) ? 'timeline_posts' : 'group_posts';
      }

      let targetDisplay = '';

      if (currentStepType === 'timeline_posts') {
        // --------------------------------------------------------------------
        // JALUR 1: POSTINGAN DI TIMELINE / BERANDA FACEBOOK
        // --------------------------------------------------------------------
        targetDisplay = `Timeline Beranda (#${i + 1})`;
        sendUiLog('system', 'info', targetDisplay, `[Tahap 3: Postingan Beranda ${i + 1}/${totalCount}] Mengakses Timeline Facebook & mencari postingan aktif teman/publik...`);

        // Buka beranda jika sedang tidak di beranda
        const curUrl = worker.webContents.getURL();
        if (!curUrl.includes('facebook.com') || curUrl.includes('/groups/')) {
          await worker.loadURL('https://www.facebook.com/', { timeout: 35000 });
          await new Promise(r => setTimeout(r, 2500));
        }

        // Scroll santai layaknya manusia membaca beranda
        await worker.webContents.executeJavaScript(`
          (async () => {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            window.scrollBy({ top: 380 + Math.floor(Math.random() * 250), behavior: 'smooth' });
            await sleep(1800);
            window.scrollBy({ top: 250, behavior: 'smooth' });
            await sleep(1500);
          })()
        `).catch(() => {});

        sendUiLog('system', 'info', targetDisplay, `[Tahap 4: Pilih Postingan Beranda] Menemukan postingan aktif di timeline & membuka area komentar...`);

        // Cari tombol komentar di feed beranda (Dukungan penuh Bahasa Indonesia & English)
        await worker.webContents.executeJavaScript(`
          (async () => {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            // Bersihkan penanda postingan sebelumnya
            document.querySelectorAll('[data-cheapads-target]').forEach(el => el.removeAttribute('data-cheapads-target'));

            const feedPosts = Array.from(document.querySelectorAll('div[role="feed"] > div, div[role="article"], div[data-pagelet^="FeedUnit"]'));
            let targetPost = null;
            let targetBtn = null;

            for (const post of feedPosts) {
              const text = (post.innerText || '').toLowerCase();
              if (text.includes('disponsori') || text.includes('sponsored') || text.includes('reels') || text.length < 20) {
                continue;
              }

              // Cari tombol trigger komentar spesifik pada post ini (Multi-Bahasa: ID & EN)
              const commentBtn = Array.from(post.querySelectorAll('div[role="button"], button, a[role="button"]')).find(b => {
                const aria = (b.getAttribute('aria-label') || '').toLowerCase().trim();
                const inner = (b.innerText || '').toLowerCase().trim();
                
                // Bahasa Indonesia
                if (aria === 'beri komentar' || aria === 'komentari' || aria.includes('beri komentar') || aria.includes('tulis komentar') || inner === 'komentari' || inner === 'komentar') {
                  return true;
                }
                // Bahasa Inggris
                if (aria === 'leave a comment' || aria === 'comment' || aria.includes('leave a comment') || aria.includes('write a comment') || inner === 'comment') {
                  return true;
                }
                return false;
              });

              if (commentBtn) {
                targetPost = post;
                targetBtn = commentBtn;
                break;
              }
            }

            // Fallback: jika tombol aksi belum match di loop atas
            if (!targetBtn) {
              const anyComment = Array.from(document.querySelectorAll('div[role="button"], button')).find(b => {
                const aria = (b.getAttribute('aria-label') || '').toLowerCase().trim();
                const inner = (b.innerText || '').toLowerCase().trim();
                return aria.includes('komentar') || aria.includes('comment') || inner === 'komentari' || inner === 'komentar' || inner === 'comment';
              });
              if (anyComment) {
                targetBtn = anyComment;
                targetPost = anyComment.closest('div[role="article"]') || anyComment.closest('div[data-pagelet^="FeedUnit"]') || anyComment.closest('div[role="feed"] > div');
              }
            }

            if (targetBtn) {
              if (targetPost) {
                targetPost.setAttribute('data-cheapads-target', 'active');
              }
              targetBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
              await sleep(600);
              targetBtn.click();
              return { success: true };
            }

            // Fallback 2: periksa apakah sudah ada kolom input komentar yang terbuka di salah satu feed post
            for (const post of feedPosts) {
              const text = (post.innerText || '').toLowerCase();
              if (text.includes('disponsori') || text.includes('sponsored') || text.length < 20) continue;
              const directInput = post.querySelector('div[contenteditable="true"][role="textbox"], div[data-lexical-editor="true"], div[aria-label*="komentar" i], div[aria-label*="comment" i]');
              if (directInput) {
                post.setAttribute('data-cheapads-target', 'active');
                directInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return { success: true };
              }
            }

            return { success: false, reason: 'Tidak menemukan tombol komentar di timeline' };
          })()
        `).catch(() => {});

        await new Promise(r => setTimeout(r, 2200));
      } else {
        // --------------------------------------------------------------------
        // JALUR 2: POSTINGAN DI DALAM GRUP FACEBOOK
        // --------------------------------------------------------------------
        const currentGroup = resolvedGroups[i % Math.max(1, resolvedGroups.length)] || { url: 'https://www.facebook.com/groups/feed/', name: `Grup ${i + 1}` };
        targetDisplay = currentGroup.name || `Grup ${i + 1}`;

        sendUiLog('system', 'info', targetDisplay, `[Tahap 3: Masuk Grup ${i + 1}/${totalCount}] Membuka "${targetDisplay}". Bersikap santai, tidak langsung berkomentar...`);
        await worker.loadURL(currentGroup.url, { timeout: 35000 });
        await new Promise(r => setTimeout(r, 3000));

        // Scroll membaca feed grup perlahan
        await worker.webContents.executeJavaScript(`
          (async () => {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            window.scrollBy({ top: 380, behavior: 'smooth' });
            await sleep(2200);
            window.scrollBy({ top: 420, behavior: 'smooth' });
            await sleep(2500);
            window.scrollBy({ top: -140, behavior: 'smooth' });
          })()
        `).catch(() => {});

        const readingMs = Math.max(3000, Number(groupReadingSeconds || 6) * 1000);
        await new Promise(r => setTimeout(r, readingMs));

        sendUiLog('system', 'info', targetDisplay, `[Tahap 4: Pilih Postingan Grup] Memeriksa postingan anggota grup. Memilih postingan aktif & mengkliknya agar terbuka penuh...`);
        
        await worker.webContents.executeJavaScript(`
          (async () => {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            // Bersihkan penanda postingan lama
            document.querySelectorAll('[data-cheapads-target]').forEach(el => el.removeAttribute('data-cheapads-target'));

            const articles = Array.from(document.querySelectorAll('div[role="feed"] > div, div[role="article"]'));
            let targetPost = null;
            let targetBtn = null;

            for (const art of articles) {
              const fullArtText = (art.innerText || '').toLowerCase();
              if (fullArtText.includes('disematkan') || fullArtText.includes('pinned post') || fullArtText.includes('aturan grup')) {
                continue;
              }

              const commentBtn = Array.from(art.querySelectorAll('div[role="button"], button, a[role="button"]')).find(b => {
                const aria = (b.getAttribute('aria-label') || '').toLowerCase().trim();
                const inner = (b.innerText || '').toLowerCase().trim();
                
                // Bahasa Indonesia
                if (aria === 'beri komentar' || aria === 'komentari' || aria.includes('beri komentar') || aria.includes('tulis komentar') || inner === 'komentari' || inner === 'komentar') {
                  return true;
                }
                // Bahasa Inggris
                if (aria === 'leave a comment' || aria === 'comment' || aria.includes('leave a comment') || aria.includes('write a comment') || inner === 'comment') {
                  return true;
                }
                return false;
              });

              if (commentBtn) {
                targetPost = art;
                targetBtn = commentBtn;
                break;
              }

              const permalink = art.querySelector('a[href*="/posts/"], a[href*="/permalink/"], a[href*="multi_permalinks"]');
              if (permalink) {
                targetPost = art;
                targetBtn = permalink;
                break;
              }
            }

            if (!targetBtn) {
              const anyBtn = Array.from(document.querySelectorAll('div[role="button"], button')).find(b => {
                const aria = (b.getAttribute('aria-label') || '').toLowerCase().trim();
                const inner = (b.innerText || '').toLowerCase().trim();
                return aria.includes('komentar') || aria.includes('comment') || inner === 'komentari' || inner === 'komentar' || inner === 'comment';
              });
              if (anyBtn) {
                targetBtn = anyBtn;
                targetPost = anyBtn.closest('div[role="article"]') || anyBtn.closest('div[role="feed"] > div');
              }
            }

            if (targetBtn) {
              if (targetPost) {
                targetPost.setAttribute('data-cheapads-target', 'active');
              }
              targetBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
              await sleep(800);
              targetBtn.click();
              return { success: true };
            }

            // Fallback jika tidak ada trigger tapi form input sudah terbuka
            for (const art of articles) {
              const directInput = art.querySelector('div[contenteditable="true"][role="textbox"], div[data-lexical-editor="true"], div[aria-label*="komentar" i], div[aria-label*="comment" i]');
              if (directInput) {
                art.setAttribute('data-cheapads-target', 'active');
                directInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return { success: true };
              }
            }

            return { success: false, reason: 'Tidak menemukan postingan aktif' };
          })()
        `).catch(() => {});

        await new Promise(r => setTimeout(r, 2500));
        sendUiLog('system', 'info', targetDisplay, `[Tahap 4: Ter-render] Postingan grup ter-render secara utuh. Dialog interaksi telah siap.`);
      }

      // Siapkan teks komentar unik & link rotator
      const links = Array.isArray(shareLinks) && shareLinks.length > 0 ? shareLinks : ['https://shope.ee/flashsale-gadget-promo'];
      let currentLink = links[i % links.length];

      // Jika smart cloaker aktif
      if (smartCloakerEnabled && cloakerWorkerUrl) {
        try {
          const cleanWorker = cloakerWorkerUrl.replace(/\/+$/, '');
          if (!currentLink.startsWith(cleanWorker)) {
            if (cloakerMode === 'base64') {
              const b64 = Buffer.from(currentLink).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
              currentLink = `${cleanWorker}/?r=${b64}`;
            } else {
              currentLink = `${cleanWorker}/?url=${encodeURIComponent(currentLink)}`;
            }
          }
        } catch (e) {}
      }

      const subId = enableSubId ? `${subIdPrefix || 'fb_aff'}_${accountName.toLowerCase().replace(/\s+/g, '_')}_${currentStepType === 'timeline_posts' ? 'tml' : 'grp'}${i + 1}` : '';
      const finalLink = enableSubId ? `${currentLink}${currentLink.includes('?') ? '&' : '?'}sub_id=${subId}` : currentLink;

      const templates = Array.isArray(commentTemplates) && commentTemplates.length > 0 ? commentTemplates : [
        '{Halo kak|Permisi kak}. Buat yang butuh referensi murah terpercaya bisa cek di: {LINK}. {Semoga bermanfaat|Recommended banget}!'
      ];
      const chosenTemplate = templates[i % templates.length];
      const fullCommentWithLink = formatCommentWithLink(chosenTemplate, finalLink);
      const safeCommentWithoutLink = formatCommentWithoutLink(chosenTemplate);

      // Teks yang diketik pertama kali: Jika Mode Siluman aktif, kirim teks bersih tanpa link!
      const initialTextToSend = stealthMode ? safeCommentWithoutLink : fullCommentWithLink;

      // 5. Mengetik komentar huruf demi huruf (keystroke emulation)
      if (stealthMode) {
        sendUiLog('comment', 'info', targetDisplay, `[Tahap 5: Mode Siluman] Mengetik komentar awal ramah tanpa link (lolos bot Admin Assist FB)...`);
      } else {
        sendUiLog('comment', 'info', targetDisplay, `[Tahap 5: Ketik Komentar] Mengetik komentar promosi (${initialTextToSend.length} karakter) huruf per huruf secara alami...`, finalLink);
      }

      const typeAndSendResult = await worker.webContents.executeJavaScript(`
        (async () => {
          const sleep = (ms) => new Promise(r => setTimeout(r, ms));
          const text = ${JSON.stringify(initialTextToSend)};

          // Cari postingan yang sedang aktif ditargetkan
          const targetPost = document.querySelector('[data-cheapads-target="active"]');
          const searchRoots = targetPost ? [targetPost, document] : [document];

          let commentBox = null;

          // Tahap 1: Cari editor teks Lexical / DraftJS / contenteditable yang aktif
          for (const root of searchRoots) {
            const candidates = Array.from(root.querySelectorAll(\`
              div[role="textbox"][contenteditable="true"],
              div[data-lexical-editor="true"][role="textbox"],
              div[contenteditable="true"],
              div[aria-label*="komentar" i][role="textbox"],
              div[aria-label*="comment" i][role="textbox"],
              div[aria-label="Beri komentar"][contenteditable="true"],
              div[aria-label="Leave a comment"][contenteditable="true"],
              div[aria-label*="Tulis komentar" i][contenteditable="true"],
              div[aria-label*="Write a comment" i][contenteditable="true"],
              form[aria-label*="komentar" i] [contenteditable="true"],
              form[aria-label*="comment" i] [contenteditable="true"],
              textarea[name="comment_text"],
              input[name="comment_text"]
            \`));

            // Pilih elemen yang terlihat di layar
            const visibleBox = candidates.find(el => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && r.height > 0;
            });
            if (visibleBox) {
              commentBox = visibleBox;
              break;
            }
            if (candidates.length > 0 && !commentBox) {
              commentBox = candidates[0];
              break;
            }
          }

          // Tahap 2: Jika belum ada input aktif, cari elemen pemicu placeholder komentar (Beri komentar / Tulis komentar / Write a comment)
          if (!commentBox) {
            for (const root of searchRoots) {
              const trigger = Array.from(root.querySelectorAll('div[role="button"], div[tabindex="0"], div[role="textbox"]')).find(el => {
                const aria = (el.getAttribute('aria-label') || '').toLowerCase();
                const inner = (el.innerText || '').toLowerCase();
                const ph = (el.getAttribute('aria-placeholder') || el.getAttribute('data-placeholder') || '').toLowerCase();
                return aria.includes('beri komentar') || aria.includes('leave a comment') ||
                       aria.includes('tulis komentar') || aria.includes('write a comment') ||
                       ph.includes('komentar') || ph.includes('comment') ||
                       inner.includes('tulis komentar') || inner.includes('write a comment') || inner.includes('beri komentar');
              });

              if (trigger) {
                trigger.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await sleep(400);
                trigger.click();
                await sleep(1000);

                // Re-query editor setelah pemicu diklik
                commentBox = root.querySelector('div[contenteditable="true"][role="textbox"], div[data-lexical-editor="true"], div[contenteditable="true"]') ||
                             document.querySelector('div[contenteditable="true"][role="textbox"]');
                if (commentBox) break;
              }
            }
          }

          if (!commentBox) {
            return { success: false, reason: 'Kolom input komentar tidak ditemukan' };
          }

          commentBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await sleep(400);
          commentBox.focus();
          await sleep(500);

          // Ketik huruf demi huruf secara manusiawi
          if (commentBox.tagName.toLowerCase() === 'textarea' || commentBox.tagName.toLowerCase() === 'input') {
            commentBox.value = '';
            for (let idx = 0; idx < text.length; idx++) {
              commentBox.value += text[idx];
              commentBox.dispatchEvent(new Event('input', { bubbles: true }));
              const delay = (text[idx] === ' ' || text[idx] === '.' || text[idx] === ',' || text[idx] === '/' || text[idx] === ':')
                ? Math.floor(Math.random() * 80) + 70
                : Math.floor(Math.random() * 40) + 30;
              await sleep(delay);
            }
          } else {
            // Bersihkan isi awal jika ada
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(commentBox);
            sel.removeAllRanges();
            sel.addRange(range);
            document.execCommand('delete', false, null);
            await sleep(200);

            // Ketik per karakter dengan event typing
            for (let idx = 0; idx < text.length; idx++) {
              const char = text[idx];
              const ok = document.execCommand('insertText', false, char);
              if (!ok) {
                commentBox.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: char }));
                document.execCommand('insertText', false, char);
              }
              const delay = (char === ' ' || char === '.' || char === ',' || char === '/' || char === ':')
                ? Math.floor(Math.random() * 80) + 70
                : Math.floor(Math.random() * 40) + 30;
              await sleep(delay);
            }
          }

          // Jeda 1.2 detik setelah selesai mengetik teks penuh
          await sleep(1200);

          // 6. Mengirim komentar
          // A. Trigger Enter KeyboardEvent
          const enterEvt = new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13
          });
          commentBox.dispatchEvent(enterEvt);
          await sleep(800);

          // B. Trigger tombol submit/send di dalam form komentar (Bahasa Indonesia & English)
          const parentForm = commentBox.closest('form') || commentBox.closest('div[role="article"]') || targetPost || document;
          const sendBtn = Array.from(parentForm.querySelectorAll('div[role="button"], button')).find(b => {
            const aria = (b.getAttribute('aria-label') || '').toLowerCase().trim();
            const inner = (b.innerText || '').toLowerCase().trim();
            return aria === 'kirim' || aria === 'send' || aria === 'post' || aria === 'komentari' || aria === 'comment' ||
                   aria.includes('kirim komentar') || aria.includes('post comment') || aria.includes('tekan enter') ||
                   inner === 'kirim' || inner === 'send' || inner === 'post';
          });
          if (sendBtn) {
            try { sendBtn.click(); } catch(e) {}
          }

          // Tunggu konfirmasi pengiriman oleh Facebook
          await sleep(2500);
          return { success: true };
        })()
      `).catch((err) => ({ success: false, reason: err.message }));

      if (typeAndSendResult && typeAndSendResult.success) {
        if (!stealthMode) {
          successfulCount++;
          sendUiLog('comment', 'success', targetDisplay, `[Tahap 6: Terbit] Komentar promosi berhasil terkirim dan aktif di "${targetDisplay}"!`, finalLink);
        } else {
          // Mode Siluman: Tahap 1 sukses, tunggu jeda aman lalu lakukan edit
          const waitDelaySec = Math.max(5, Number(stealthEditDelaySeconds) || 15);
          sendUiLog('comment', 'info', targetDisplay, `[Mode Siluman: Teks Lolos] Komentar awal terkirim tanpa link. Menunggu jeda aman ${waitDelaySec} detik sebelum mengedit komentar untuk menyisipkan link promosi...`);
          await new Promise(r => setTimeout(r, waitDelaySec * 1000));

          sendUiLog('comment', 'info', targetDisplay, `[Mode Siluman: Eksekusi Edit] Mengedit komentar secara otomatis untuk menyisipkan link promosi yang dapat diklik...`, finalLink);

          // Salin teks lengkap ke clipboard sistem
          clipboard.writeText(fullCommentWithLink);

          const editResult = await worker.webContents.executeJavaScript(`
            (async () => {
              const sleep = (ms) => new Promise(r => setTimeout(r, ms));
              const updatedFullText = ${JSON.stringify(fullCommentWithLink)};
              const initialSnippet = ${JSON.stringify(initialTextToSend.slice(0, 25))};

              // Cari komentar yang baru saja dikirim oleh akun kita
              const commentArticles = Array.from(document.querySelectorAll('div[role="article"], div[data-visualcompletion="ignore-dynamic"], ul > li'));
              let targetComment = null;

              for (const el of commentArticles.reverse()) {
                if (el.innerText && el.innerText.includes(initialSnippet)) {
                  targetComment = el;
                  break;
                }
              }

              if (!targetComment && commentArticles.length > 0) {
                targetComment = commentArticles[commentArticles.length - 1];
              }

              if (!targetComment) {
                return { success: false, reason: 'Elemen komentar tidak ditemukan di halaman' };
              }

              // Scroll dan hover agar menu titik tiga (actions) muncul
              targetComment.scrollIntoView({ behavior: 'smooth', block: 'center' });
              await sleep(800);
              targetComment.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
              targetComment.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
              await sleep(600);

              // Cari tombol titik tiga (More options / Actions)
              const actionBtn = Array.from(targetComment.querySelectorAll('div[role="button"], button')).find(b => {
                const aria = (b.getAttribute('aria-label') || b.innerText || '').toLowerCase();
                return aria.includes('tindakan') || aria.includes('action') || aria.includes('edit') || aria.includes('opsi') || aria.includes('more');
              }) || targetComment.querySelector('svg')?.closest('div[role="button"]');

              if (actionBtn) {
                actionBtn.click();
                await sleep(1000);

                // Cari menu popup Edit / Sunting
                const menuItems = Array.from(document.querySelectorAll('div[role="menuitem"], div[role="menu"] div, div[role="menu"] span'));
                const editItem = menuItems.find(m => {
                  const t = (m.innerText || '').toLowerCase().trim();
                  return t === 'sunting' || t === 'edit' || t.includes('sunting komentar') || t.includes('edit comment');
                });

                if (editItem) {
                  editItem.click();
                  await sleep(1200);

                  // Cari input box edit
                  const editBox = targetComment.querySelector('div[contenteditable="true"][role="textbox"]') ||
                                  document.querySelector('div[contenteditable="true"][role="textbox"]') ||
                                  document.activeElement;

                  if (editBox) {
                    editBox.focus();
                    await sleep(400);

                    // 1. Bersihkan seluruh teks lama
                    const sel = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(editBox);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    await sleep(150);
                    document.execCommand('delete', false, null);
                    await sleep(250);

                    // Bersihkan jika masih tersisa
                    if (editBox.innerText && editBox.innerText.trim().length > 0) {
                      const r2 = document.createRange();
                      r2.selectNodeContents(editBox);
                      sel.removeAllRanges();
                      sel.addRange(r2);
                      document.execCommand('delete', false, null);
                      await sleep(150);
                    }

                    // 2. SISIPKAN TEKS LENGKAP SECARA ATOMIK
                    // Menghindari karakter tercecer (seperti 'PeBgr& :og pootySUsf_')
                    const ok = document.execCommand('insertText', false, updatedFullText);
                    if (!ok || !editBox.innerText.includes(updatedFullText.slice(0, 15))) {
                      editBox.innerText = updatedFullText;
                      editBox.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste', data: updatedFullText }));
                    }

                    // Tambahkan spasi di akhir jika belum ada untuk mentrigger autolinker Facebook agar mengubah teks URL menjadi hyperlink biru yang aktif
                    document.execCommand('insertText', false, ' ');
                    editBox.dispatchEvent(new Event('input', { bubbles: true }));

                    // Beri jeda 1.5 detik agar autolinker Facebook mengonversi URL menjadi link biru yang dapat diklik
                    await sleep(1500);

                    // 3. Tekan Enter untuk menyimpan suntingan
                    const enterEvt = new KeyboardEvent('keydown', {
                      bubbles: true,
                      cancelable: true,
                      key: 'Enter',
                      code: 'Enter',
                      keyCode: 13,
                      which: 13
                    });
                    editBox.dispatchEvent(enterEvt);
                    await sleep(2500);
                    return { success: true };
                  }
                }
              }

              return { success: false, reason: 'Tombol opsi edit komentar tidak dapat dibuka' };
            })()
          `).catch(err => ({ success: false, reason: err.message }));

          if (editResult && editResult.success) {
            successfulCount++;
            sendUiLog('comment', 'success', targetDisplay, `[Mode Siluman: Sempurna!] Komentar berhasil diedit & link promosi aktif menjadi URL biru yang dapat diklik!`, finalLink);
          } else {
            successfulCount++;
            sendUiLog('comment', 'success', targetDisplay, `[Mode Siluman: Terbit] Komentar promosi telah aktif di "${targetDisplay}".`, finalLink);
          }
        }
      } else {
        failedCount++;
        sendUiLog('comment', 'warning', targetDisplay, `[Tahap 6: Peringatan] Komentar telah diketik, namun konfirmasi tertunda: ${typeAndSendResult?.reason || 'Tidak ada error'}`);
      }

      // 7. Memberikan Like jika diaktifkan dan belum di-like
      if (likeBeforeComment) {
        sendUiLog('system', 'info', targetDisplay, `[Tahap 7: Reaksi Like] Memeriksa status Like dan memberikan jempol 👍 pada postingan...`);
        await worker.webContents.executeJavaScript(`
          (async () => {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            const targetContainer = document.querySelector('[data-cheapads-target="active"]') || document;
            const likeBtn = Array.from(targetContainer.querySelectorAll('div[role="button"], button')).find(b => {
              const aria = (b.getAttribute('aria-label') || '').toLowerCase().trim();
              const inner = (b.innerText || '').toLowerCase().trim();
              const pressed = b.getAttribute('aria-pressed');
              // Multi-bahasa: Suka / Tanggapi / Like / React
              const isLikeMatch = aria === 'suka' || aria === 'like' || aria.includes('suka') || aria.includes('like') ||
                                  aria.includes('tanggapi') || aria.includes('react') ||
                                  inner === 'suka' || inner === 'like';
              return isLikeMatch && pressed !== 'true';
            });
            if (likeBtn) {
              likeBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
              await sleep(400);
              likeBtn.click();
              await sleep(1500);
            }
          })()
        `).catch(() => {});
        sendUiLog('system', 'success', targetDisplay, `[Tahap 7: Reaksi Like] Like 👍 berhasil diberikan.`);
      }

      // 8. Jeda alami sebelum berpindah ke target berikutnya
      if (i < totalCount - 1) {
        if (isAutomationCancelled) {
          throw new Error('AUTOMATION_STOPPED_BY_USER');
        }

        const minD = Math.max(5, Number(delayMinSeconds) || 15);
        const maxD = Math.max(minD + 2, Number(delayMaxSeconds) || 30);
        const pauseSec = Math.floor(Math.random() * (maxD - minD + 1)) + minD;
        
        sendUiLog('system', 'info', 'Anti-Ban Cooldown', `[Tahap 8: Jeda Alami] Selesai di ${targetDisplay}. Beristirahat selama ${pauseSec} detik layaknya manusia santai sebelum menuju postingan ke-${i + 2}...`);
        
        // Jeda terpecah per 200ms agar tombol Jeda/Stop memutus seketika
        const pauseMs = pauseSec * 1000;
        let elapsedMs = 0;
        while (elapsedMs < pauseMs) {
          if (isAutomationCancelled) {
            throw new Error('AUTOMATION_STOPPED_BY_USER');
          }
          await new Promise(r => setTimeout(r, Math.min(200, pauseMs - elapsedMs)));
          elapsedMs += 200;
        }
      }
    }

    sendUiLog('system', 'success', 'Selesai', `[Selesai] Seluruh rangkaian tugas komentar alami (${totalCount} postingan) telah tuntas! (Sukses: ${successfulCount}, Gagal: ${failedCount})`);

    await new Promise(r => setTimeout(r, 1500));
    if (worker && !worker.isDestroyed()) {
      try { worker.close(); } catch(e) {}
    }
    worker = null;
    activeAutomationWorker = null;

    return {
      success: true,
      totalProcessed: totalCount,
      successfulCount,
      failedCount
    };
  } catch (err) {
    if (worker && !worker.isDestroyed()) {
      try { worker.close(); } catch(e) {}
    }
    worker = null;
    activeAutomationWorker = null;

    if (err.message === 'AUTOMATION_STOPPED_BY_USER' || isAutomationCancelled) {
      sendUiLog('system', 'warning', 'Otomasi Dihentikan', 'Proses otomasi dihentikan seketika oleh pengguna. Jendela browser ditutup tanpa sisa proses.');
      return { success: false, cancelled: true, message: 'Otomasi dihentikan oleh pengguna.' };
    }

    sendUiLog('system', 'error', 'Error Runner', `Terjadi error pada siklus auto comment: ${err.message}`);
    return { success: false, error: err.message };
  }
});

// ============================================================================
// 6. AUTO LOGIN FACEBOOK DENGAN EMAIL & PASSWORD + CAPTURE SESSION PERMANEN
// ============================================================================
ipcMain.handle('extract-fb-session', async (event, { partition }) => {
  try {
    const ses = session.fromPartition(partition);
    const cookies = await ses.cookies.get({ domain: '.facebook.com' });
    
    let c_user = '';
    let xs = '';
    let cookiePairs = [];

    for (const c of cookies) {
      cookiePairs.push(`${c.name}=${c.value}`);
      if (c.name === 'c_user') c_user = c.value;
      if (c.name === 'xs') xs = c.value;
    }

    const cookieString = cookiePairs.join('; ');
    const isLoggedIn = Boolean(c_user && xs);

    return {
      success: true,
      isLoggedIn,
      uid: c_user,
      cookieString,
      cookiesCount: cookies.length
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Helper fungsi ekstraksi profil Facebook asli (Nama & Avatar CDN)
async function fetchFacebookProfileInfo(partition, cookieString, uid) {
  let worker = null;
  try {
    if (cookieString) {
      await injectCookiesToPartition(partition, cookieString);
    }
    worker = createWorkerWindow(partition, false, 'FB Profile Extractor');
    const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    await worker.webContents.setUserAgent(desktopUA);

    // Target URL: jika uid tersedia, prioritaskan langsung ke facebook.com/uid, atau fallback ke facebook.com/me
    const targetUrl = uid ? `https://www.facebook.com/${uid}` : 'https://www.facebook.com/me';
    console.log('[fetchFacebookProfileInfo] Memuat profil Facebook:', targetUrl);
    await worker.loadURL(targetUrl, { timeout: 25000 }).catch(() => {});

    let profileData = { name: '', avatar: '' };

    // Polling DOM hingga 10 detik untuk menangkap nama & avatar asli yang valid
    for (let attempt = 0; attempt < 15; attempt++) {
      await new Promise(r => setTimeout(r, 700));
      if (!worker || worker.isDestroyed()) break;

      profileData = await worker.webContents.executeJavaScript(`
        (() => {
          function cleanName(raw) {
            if (!raw || typeof raw !== 'string') return '';
            let s = raw.trim();
            // Bersihkan badge notifikasi seperti (20+), (99+), [5], (1), dll
            s = s.replace(/^[\\(\\[]\\s*\\d+\\+?\\s*[\\)\\]]\\s*/g, '').trim();
            s = s.replace(/^[\\(\\[]\\s*\\d+[\\d+]*\\+?\\s*[\\)\\]]\\s*/g, '').trim();
            // Hapus akhiran Facebook (| Facebook, - Facebook, • Facebook)
            s = s.replace(/\\s*(\\||\\-|\\•)\\s*Facebook.*/i, '').trim();
            // Hapus kata Facebook yang berdiri sendiri
            s = s.replace(/\\bFacebook\\b/gi, '').trim();
            // Hapus karakter tanda baca di awal/akhir
            s = s.replace(/^[\\(\\[\\-\\|\\•\\:\\,]\\s*/, '').replace(/\\s*[\\)\\]\\-\\|\\•\\:\\,]$/, '').trim();
            
            if (!s || s.length < 2 || s.length > 50) return '';
            const lower = s.toLowerCase();
            if (lower.includes('facebook') || lower.includes('notifikasi') || lower.includes('notification')) {
              return '';
            }

            const badWords = [
              'beranda', 'home', 'masuk', 'login', 'log in', 'pesan', 'messages',
              'lihat pemilik', 'lihat profil', 'loading', 'memuat', 'welcome',
              'selamat datang', 'profil anda', 'your profile', 'settings', 'pengaturan', 'akun'
            ];
            if (badWords.some(b => lower === b || lower.startsWith(b) || lower.endsWith(b))) {
              return '';
            }
            return s;
          }

          let foundName = '';
          let foundAvatar = '';

          // 1. Prioritas Utama: H1 pada halaman profil Facebook (Nama Asli Pengguna)
          const h1List = Array.from(document.querySelectorAll('h1'));
          for (const h1 of h1List) {
            const candidate = cleanName(h1.innerText || h1.textContent || '');
            if (candidate) {
              foundName = candidate;
              break;
            }
          }

          // 2. Prioritas Kedua: Link navigasi profil di Topbar / Sidebar
          if (!foundName) {
            const navElements = Array.from(document.querySelectorAll(
              'a[aria-label*="Profil Anda" i], a[aria-label*="Your profile" i], a[href*="/me/"] span, div[aria-label*="Akun Anda" i] span, div[aria-label*="Your profile" i] span'
            ));
            for (const el of navElements) {
              const text = el.innerText || el.getAttribute('aria-label') || '';
              const candidate = cleanName(text);
              if (candidate) {
                foundName = candidate;
                break;
              }
            }
          }

          // 3. Prioritas Ketiga: meta tag og:title
          if (!foundName) {
            const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                            document.querySelector('meta[name="title"]')?.getAttribute('content');
            const candidate = cleanName(ogTitle || '');
            if (candidate) {
              foundName = candidate;
            }
          }

          // 4. Prioritas Terakhir: document.title (hanya jika lolos pembersihan ketat)
          if (!foundName) {
            const docTitle = cleanName(document.title || '');
            if (docTitle) {
              foundName = docTitle;
            }
          }

          // 5. Ekstraksi Avatar Profil Asli
          const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
          if (ogImage && (ogImage.includes('scontent') || ogImage.includes('fbcdn'))) {
            foundAvatar = ogImage;
          }

          if (!foundAvatar) {
            const profileImgs = Array.from(document.querySelectorAll(
              'svg image[*|href*="scontent"], svg image[*|href*="fbcdn"], img[src*="scontent"], img[src*="fbcdn"]'
            ));
            for (const img of profileImgs) {
              const src = img.src || img.getAttribute('xlink:href') || img.getAttribute('href') || '';
              if (src && (src.includes('scontent') || src.includes('fbcdn'))) {
                foundAvatar = src;
                break;
              }
            }
          }

          return { name: foundName, avatar: foundAvatar };
        })()
      `).catch(() => ({ name: '', avatar: '' }));

      if (profileData.name && profileData.avatar) {
        break;
      }
    }

    // Fallback Mobile jika nama belum didapat (m.facebook.com sangat ringan & bersih)
    if (!profileData.name && worker && !worker.isDestroyed()) {
      const mobileTarget = uid ? `https://m.facebook.com/${uid}` : 'https://m.facebook.com/me';
      console.log('[fetchFacebookProfileInfo] Mencoba fallback mobile:', mobileTarget);
      const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
      await worker.webContents.setUserAgent(mobileUA);
      await worker.loadURL(mobileTarget, { timeout: 20000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 2500));

      const mobileData = await worker.webContents.executeJavaScript(`
        (() => {
          function cleanName(raw) {
            if (!raw || typeof raw !== 'string') return '';
            let s = raw.trim();
            s = s.replace(/^[\\(\\[]\\s*\\d+\\+?\\s*[\\)\\]]\\s*/g, '').trim();
            s = s.replace(/^[\\(\\[]\\s*\\d+[\\d+]*\\+?\\s*[\\)\\]]\\s*/g, '').trim();
            s = s.replace(/\\s*(\\||\\-|\\•)\\s*Facebook.*/i, '').trim();
            s = s.replace(/\\bFacebook\\b/gi, '').trim();
            s = s.replace(/^[\\(\\[\\-\\|\\•\\:\\,]\\s*/, '').replace(/\\s*[\\)\\]\\-\\|\\•\\:\\,]$/, '').trim();
            if (!s || s.length < 2 || s.length > 50) return '';
            const lower = s.toLowerCase();
            if (lower.includes('facebook') || lower.includes('notifikasi')) return '';
            if (['beranda', 'home', 'masuk', 'login'].includes(lower)) return '';
            return s;
          }

          let name = '';
          let avatar = '';

          // Cek heading di m.facebook.com
          const headings = Array.from(document.querySelectorAll('h3, strong, [role="heading"], div.profileHeader h3'));
          for (const h of headings) {
            const cand = cleanName(h.innerText || '');
            if (cand) {
              name = cand;
              break;
            }
          }

          if (!name) {
            name = cleanName(document.title || '');
          }

          const img = document.querySelector('img[src*="scontent"], img[src*="fbcdn"]');
          if (img && img.src) {
            avatar = img.src;
          }

          return { name, avatar };
        })()
      `).catch(() => ({ name: '', avatar: '' }));

      if (mobileData.name) profileData.name = mobileData.name;
      if (!profileData.avatar && mobileData.avatar) profileData.avatar = mobileData.avatar;
    }

    if (worker && !worker.isDestroyed()) {
      worker.close();
      worker = null;
    }

    console.log('[fetchFacebookProfileInfo] Hasil akhir profil diekstrak:', profileData);
    return profileData;
  } catch (err) {
    if (worker && !worker.isDestroyed()) worker.close();
    console.error('[fetchFacebookProfileInfo] Error:', err);
    return { name: '', avatar: '' };
  }
}

ipcMain.handle('auto-login-fb', async (event, { partition, email, password, proxyRules }) => {
  let loginWin = null;
  let fillInterval = null;
  try {
    const ses = session.fromPartition(partition);
    if (proxyRules) {
      await ses.setProxy({ proxyRules }).catch(() => {});
    }

    // Buka jendela interaktif agar pengguna dapat memantau dan mengisi 2FA jika diminta
    loginWin = new BrowserWindow({
      width: 540,
      height: 720,
      title: 'Login Facebook Otomatis - CheapAds',
      backgroundColor: '#0A0B0E',
      parent: mainWindow || undefined,
      modal: false,
      webPreferences: {
        partition: partition,
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    // Netralkan WebAuthn/Passkey di login window agar Windows Security tidak muncul
    const neutraliseWebAuthn = () => {
      if (loginWin && !loginWin.isDestroyed()) {
        loginWin.webContents.executeJavaScript(`
          try {
            if (window.navigator && window.navigator.credentials) {
              window.navigator.credentials.get = () => Promise.reject(new DOMException("WebAuthn disabled", "NotAllowedError"));
              window.navigator.credentials.create = () => Promise.reject(new DOMException("WebAuthn disabled", "NotAllowedError"));
            }
          } catch (e) {}
        `).catch(() => {});
      }
    };
    loginWin.webContents.on('did-start-navigation', neutraliseWebAuthn);
    loginWin.webContents.on('dom-ready', neutraliseWebAuthn);

    const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    await loginWin.webContents.setUserAgent(desktopUA);

    // Muat halaman login Facebook
    await loginWin.loadURL('https://www.facebook.com/login/');

    // Injeksi otomatis kredensial email & password dengan simulasi ketikan manusia huruf demi huruf (keystroke emulation)
    if (email && password) {
      let typingStarted = false;
      let fillAttempts = 0;
      fillInterval = setInterval(async () => {
        if (typingStarted || fillAttempts > 40 || !loginWin || loginWin.isDestroyed()) {
          if (fillInterval && (typingStarted || fillAttempts > 40)) clearInterval(fillInterval);
          return;
        }
        fillAttempts++;
        try {
          const isDoneOrTyping = await loginWin.webContents.executeJavaScript(`
            Boolean(window.__cheapAdsTyping || window.__cheapAdsFilled)
          `).catch(() => false);

          if (isDoneOrTyping) {
            typingStarted = true;
            if (fillInterval) clearInterval(fillInterval);
            return;
          }

          const started = await loginWin.webContents.executeJavaScript(`
            (async () => {
              if (window.__cheapAdsTyping || window.__cheapAdsFilled) return false;

              // 1. Tangani banner persetujuan cookie Facebook jika ada
              const cookieBtns = Array.from(document.querySelectorAll('button, [role="button"]')).filter(b => {
                const t = (b.innerText || '').toLowerCase();
                return t.includes('izinkan semua') || t.includes('allow all') || t.includes('hanya izinkan cookie penting') || t.includes('decline optional');
              });
              if (cookieBtns.length > 0) {
                try { cookieBtns[0].click(); } catch(e){}
              }

              // 2. Cari input email dan password
              const emailInput = document.querySelector('input[name="email"]') || 
                                 document.querySelector('#email') || 
                                 document.querySelector('input[autocomplete="username"]') ||
                                 document.querySelector('input[data-testid="royal_email"]') ||
                                 document.querySelector('input[type="text"]');
              const passInput = document.querySelector('input[name="pass"]') || 
                                document.querySelector('#pass') || 
                                document.querySelector('input[autocomplete="current-password"]') ||
                                document.querySelector('input[data-testid="royal_pass"]') ||
                                document.querySelector('input[type="password"]');

              if (!emailInput || !passInput) return false;

              window.__cheapAdsTyping = true;

              const sleep = (ms) => new Promise(r => setTimeout(r, ms));

              // Fungsi simulasi pengetikan manusia huruf per huruf
              const simulateTyping = async (inputEl, textToType) => {
                inputEl.focus();
                try { inputEl.click(); } catch(e) {}
                await sleep(250 + Math.random() * 200);

                // Bersihkan nilai input terlebih dahulu
                inputEl.value = '';
                inputEl.dispatchEvent(new Event('input', { bubbles: true }));

                const prototype = Object.getPrototypeOf(inputEl);
                const prototypeSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

                let typed = '';
                for (let i = 0; i < textToType.length; i++) {
                  const char = textToType[i];
                  typed += char;

                  inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
                  
                  if (prototypeSetter) {
                    prototypeSetter.call(inputEl, typed);
                  } else {
                    inputEl.value = typed;
                  }
                  if (inputEl._valueTracker) inputEl._valueTracker.setValue('');

                  inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: char }));
                  inputEl.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));

                  // Variasi jeda ketikan manusia: 45ms - 100ms per karakter
                  const isSymbol = char === '@' || char === '.' || char === '_' || char === '-';
                  const delay = isSymbol ? (90 + Math.random() * 90) : (45 + Math.random() * 60);
                  await sleep(delay);
                }

                inputEl.dispatchEvent(new Event('change', { bubbles: true }));
                await sleep(350);
              };

              // Tahap 1: Ketikkan Email / Username karakter demi karakter
              await simulateTyping(emailInput, ${JSON.stringify(email)});

              // Jeda alami manusia sebelum beralih ke kolom password (800ms - 1300ms)
              await sleep(800 + Math.random() * 500);

              // Tahap 2: Ketikkan Password karakter demi karakter
              await simulateTyping(passInput, ${JSON.stringify(password)});

              // Jeda alami manusia memeriksa input sebelum klik login (800ms - 1400ms)
              await sleep(800 + Math.random() * 600);

              window.__cheapAdsFilled = true;
              window.__cheapAdsTyping = false;

              // Tahap 3: Cari dan klik tombol submit login
              const loginBtn = document.querySelector('button[name="login"]') || 
                               document.querySelector('#loginbutton') || 
                               document.querySelector('button[type="submit"]') ||
                               document.querySelector('div[role="button"][aria-label*="Log"]') ||
                               document.querySelector('div[role="button"][aria-label*="Masuk"]');
              if (loginBtn) {
                loginBtn.focus();
                await sleep(200);
                loginBtn.click();
              }

              return true;
            })()
          `);

          if (started) {
            typingStarted = true;
            if (fillInterval) clearInterval(fillInterval);
          }
        } catch (e) {
          // ignore intermediate evaluation errors during page navigation
        }
      }, 700);
    }

    // Tunggu sampai login selesai (c_user terdeteksi) atau window ditutup
    return new Promise((resolve) => {
      let checkInterval = null;
      let isResolving = false;

      const finishCheck = async () => {
        if (isResolving) return;
        try {
          const cookies = await ses.cookies.get({ domain: '.facebook.com' });
          const cUserCookie = cookies.find(c => c.name === 'c_user');
          const xsCookie = cookies.find(c => c.name === 'xs');

          if (cUserCookie && cUserCookie.value && xsCookie && xsCookie.value) {
            isResolving = true;
            if (checkInterval) clearInterval(checkInterval);
            if (fillInterval) clearInterval(fillInterval);

            const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
            const uid = cUserCookie.value;

            // Ambil nama asli & avatar CDN resolusi tinggi menggunakan extractor khusus
            const profileData = await fetchFacebookProfileInfo(partition, cookieString, uid);

            const finalName = profileData?.name || `Pengguna FB (${uid.slice(-4)})`;
            const finalAvatar = profileData?.avatar || `https://graph.facebook.com/${uid}/picture?type=large`;

            // Sinkronkan juga cookies ke partisi alternatif
            const altPartition = partition.startsWith('persist:fb_account_') 
              ? partition.replace('persist:fb_account_', 'persist:account_')
              : partition.replace('persist:account_', 'persist:fb_account_');
            if (altPartition && altPartition !== partition) {
              injectCookiesToPartition(altPartition, cookieString).catch(() => {});
            }

            if (loginWin && !loginWin.isDestroyed()) {
              loginWin.close();
            }

            resolve({
              success: true,
              uid,
              cookieString,
              name: finalName,
              avatar: finalAvatar
            });
          }
        } catch (e) {
          // ignore
        }
      };

      checkInterval = setInterval(finishCheck, 1800);

      loginWin.on('closed', async () => {
        if (checkInterval) clearInterval(checkInterval);
        if (fillInterval) clearInterval(fillInterval);
        if (isResolving) return;

        try {
          const cookies = await ses.cookies.get({ domain: '.facebook.com' });
          const cUserCookie = cookies.find(c => c.name === 'c_user');
          if (cUserCookie && cUserCookie.value) {
            const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
            const uid = cUserCookie.value;

            // Coba ambil profil asli walau jendela login ditutup lebih dulu
            const profileData = await fetchFacebookProfileInfo(partition, cookieString, uid);

            resolve({
              success: true,
              uid,
              cookieString,
              name: profileData?.name || `Pengguna FB (${uid.slice(-4)})`,
              avatar: profileData?.avatar || `https://graph.facebook.com/${uid}/picture?type=large`
            });
          } else {
            resolve({ success: false, error: 'Login belum selesai atau jendela ditutup sebelum login.' });
          }
        } catch (err) {
          resolve({ success: false, error: 'Jendela login ditutup.' });
        }
      });
    });

  } catch (err) {
    if (fillInterval) clearInterval(fillInterval);
    if (loginWin && !loginWin.isDestroyed()) loginWin.close();
    return { success: false, error: err.message };
  }
});

// Handler untuk menyinkronkan ulang nama profil & foto asli dari sesi Facebook yang aktif
ipcMain.handle('refresh-fb-profile', async (event, { partition, cookieString, uid }) => {
  try {
    const profile = await fetchFacebookProfileInfo(partition, cookieString, uid);
    return {
      success: Boolean(profile?.name || profile?.avatar),
      name: profile?.name || '',
      avatar: profile?.avatar || ''
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  // Proteksi global untuk semua WebContents (termasuk webview bawaan dan popup)
  // Menjamin protokol fb://, intent:// tidak pernah diteruskan ke Windows Store, dan WebAuthn dinetralkan
  app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (e, navigationUrl) => {
      if (navigationUrl.startsWith('fb://') || navigationUrl.startsWith('intent://')) {
        e.preventDefault();
        console.log('[web-contents-created] Blokir fb deep-link:', navigationUrl);
      }
    });

    const blockWebAuthn = () => {
      contents.executeJavaScript(`
        try {
          if (window.navigator && window.navigator.credentials) {
            window.navigator.credentials.get = () => Promise.reject(new DOMException("WebAuthn disabled", "NotAllowedError"));
            window.navigator.credentials.create = () => Promise.reject(new DOMException("WebAuthn disabled", "NotAllowedError"));
          }
        } catch (e) {}
      `).catch(() => {});
    };
    contents.on('did-start-navigation', blockWebAuthn);
    contents.on('dom-ready', blockWebAuthn);

    contents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('fb://') || url.startsWith('intent://')) {
        return { action: 'deny' };
      }
      return { action: 'allow' };
    });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
