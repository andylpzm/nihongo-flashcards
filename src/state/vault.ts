// the picture pack.
//
// the artwork cannot ship inside the app, so it arrives as one scrambled file
// that gets connected once and then lives in the browser's own storage. this
// module is the only thing that knows how to open it.
//
// two rules shape the design:
//
//   1. the pack is stored still scrambled. the plain pictures are never
//      written to disk - only held as blobs while they are on screen. a
//      decrypted cache sitting in storage is exactly what someone curious
//      would go looking for, and the whole point is that they cannot.
//   2. thumbnails are opened all at once on connect, because the binder shows
//      three hundred of them and asking for each one separately would make
//      scrolling wait on decryption. full pictures are opened one at a time.

import packKey from '../data/packKey.json';

const MAGIC = 'AOHK';
const DB = 'nihongo-vault';
const STORE = 'pack';
const ROW = 'current';

type Entry = [offset: number, length: number, iv: string];
type Index = Record<string, Entry>;

let bytes: Uint8Array | null = null;
let index: Index | null = null;
let key: CryptoKey | null = null;
const thumbs = new Map<string, string>();
const fulls = new Map<string, string>();

// Uint8Array<ArrayBufferLike> is not BufferSource to typescript, and every
// crypto call wants BufferSource - so these hand back a plain ArrayBuffer
const b64 = (s: string): ArrayBuffer => {
  const raw = atob(s);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out.buffer;
};

async function theKey(): Promise<CryptoKey> {
  key ??= await crypto.subtle.importKey('raw', b64(packKey.k), 'AES-GCM', false, ['decrypt']);
  return key;
}

async function open(entry: Entry): Promise<Blob> {
  const [offset, length, iv] = entry;
  const head = 9 + 12 + headIndexLength(bytes!);
  const slice = bytes!.slice(head + offset, head + offset + length).buffer as ArrayBuffer;
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(iv) }, await theKey(), slice);
  return new Blob([plain], { type: 'image/jpeg' });
}

const headIndexLength = (b: Uint8Array): number =>
  new DataView(b.buffer as ArrayBuffer, b.byteOffset).getUint32(5, true);

// ---- storage -------------------------------------------------------------

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function put(value: ArrayBuffer): Promise<void> {
  const db = await idb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, ROW);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function get(): Promise<ArrayBuffer | null> {
  const db = await idb();
  const value = await new Promise<ArrayBuffer | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(ROW);
    req.onsuccess = () => resolve((req.result as ArrayBuffer) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return value;
}

// ---- opening -------------------------------------------------------------

/** reads the header and index. throws if this is not a pack we can open. */
export async function parsePack(buffer: ArrayBuffer): Promise<{ bytes: Uint8Array; index: Index }> {
  const b = new Uint8Array(buffer);
  if (b.length < 25 || String.fromCharCode(...b.subarray(0, 4)) !== MAGIC)
    throw new Error('That is not the cards file.');
  const len = headIndexLength(b);
  const iv = b.slice(9, 21).buffer as ArrayBuffer;
  const body = b.slice(21, 21 + len).buffer as ArrayBuffer;
  let json: string;
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await theKey(), body);
    json = new TextDecoder().decode(plain);
  } catch {
    // right shape, wrong contents: a truncated download is the likely cause
    throw new Error('That file is damaged. Copy it across again.');
  }
  return { bytes: b, index: JSON.parse(json) as Index };
}

/**
 * the wordmark, handed to CSS as a custom property.
 *
 * three rules draw it - the card's logo, its shine mask, and the card back -
 * and all three do it by url. the file only exists inside the pack, so without
 * this every card in the built app loses its wordmark and the mask silently
 * covers nothing.
 */
const LOGO = 'gallery/logo.png';
async function publishLogo(): Promise<void> {
  const entry = index?.[LOGO];
  if (!entry) return;
  const url = URL.createObjectURL(await open(entry));
  document.documentElement.style.setProperty('--card-logo', `url("${url}")`);
}

/** every thumbnail, opened up front so the binder never waits */
async function openThumbs(): Promise<void> {
  for (const url of thumbs.values()) URL.revokeObjectURL(url);
  thumbs.clear();
  for (const [path, entry] of Object.entries(index!)) {
    if (path.startsWith('gallery/t/')) thumbs.set(path, URL.createObjectURL(await open(entry)));
  }
  await publishLogo();
}

/** connects a pack the user picked, and keeps it for next time */
export async function connectPack(file: File): Promise<number> {
  const buffer = await file.arrayBuffer();
  const parsed = await parsePack(buffer);
  bytes = parsed.bytes;
  index = parsed.index;
  await put(buffer);
  // ask the browser not to evict it; 34MB is small but this is not something
  // we can re-download, it lives only on the phone
  void navigator.storage?.persist?.();
  await openThumbs();
  return count();
}

/** loads a pack connected on an earlier visit. safe to call at boot. */
export async function restorePack(): Promise<boolean> {
  if (index) return true;
  try {
    const buffer = await get();
    if (!buffer) return false;
    const parsed = await parsePack(buffer);
    bytes = parsed.bytes;
    index = parsed.index;
    await openThumbs();
    return true;
  } catch {
    return false;
  }
}

export function isConnected(): boolean {
  return index !== null;
}

/** how many pictures are in the connected pack, thumbnails not counted */
export function count(): number {
  return index ? Object.keys(index).filter((p) => !p.startsWith('gallery/t/')).length : 0;
}

/**
 * a thumbnail, ready now. synchronous on purpose: the binder builds three
 * hundred cards in one pass and an await per card would tear the first paint.
 */
export function thumbUrl(path: string): string | null {
  return thumbs.get(path) ?? null;
}

/** a full picture. opened on demand and kept, so paging back is instant. */
export async function fullUrl(path: string): Promise<string | null> {
  if (!index) return null;
  const hit = fulls.get(path);
  if (hit) return hit;
  const entry = index[path];
  if (!entry) return null;
  const url = URL.createObjectURL(await open(entry));
  fulls.set(path, url);
  return url;
}
