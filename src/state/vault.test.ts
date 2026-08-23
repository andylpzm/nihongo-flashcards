import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { parsePack } from './vault';
import packKey from '../data/packKey.json';

// the pack is the only copy of the artwork chris will ever have. if it can be
// written but not read back, or read back subtly wrong, there is no second
// chance and no error message - just three hundred broken pictures. so these
// open the REAL pack and compare bytes with the files it was made from.

const PACK = 'dist-pack/aonohako.pack';
const have = existsSync(PACK);
const withPack = have ? describe : describe.skip;

const key = await crypto.subtle.importKey(
  'raw',
  Uint8Array.from(atob(packKey.k), (c) => c.charCodeAt(0)).buffer as ArrayBuffer,
  'AES-GCM',
  false,
  ['decrypt'],
);

async function entryBytes(bytes: Uint8Array, indexLen: number, e: [number, number, string]): Promise<Buffer> {
  const [offset, length, iv] = e;
  const head = 9 + 12 + indexLen;
  const slice = bytes.slice(head + offset, head + offset + length).buffer as ArrayBuffer;
  const ivBuf = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0)).buffer as ArrayBuffer;
  return Buffer.from(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuf }, key, slice));
}

describe('pack header', () => {
  it('refuses anything that is not a pack', async () => {
    const junk = new TextEncoder().encode('PK this is a zip, actually, padded out to some length');
    await expect(parsePack(junk.buffer as ArrayBuffer)).rejects.toThrow(/not the cards file/);
  });

  it('refuses a pack that has been cut short', async () => {
    const b = new Uint8Array(64);
    b.set(new TextEncoder().encode('AOHK'));
    new DataView(b.buffer).setUint32(5, 999_999, true);
    await expect(parsePack(b.buffer)).rejects.toThrow(/damaged/);
  });
});

withPack('the real pack', () => {
  it('gives back every picture exactly as it went in', async () => {
    const buffer = (await readFile(PACK)).buffer as ArrayBuffer;
    const { bytes, index } = await parsePack(buffer);
    const indexLen = new DataView(bytes.buffer as ArrayBuffer, bytes.byteOffset).getUint32(5, true);
    const paths = Object.keys(index);

    expect(paths.length).toBe(605);
    expect(paths.filter((p) => p.startsWith('gallery/t/')).length).toBe(302);
    // the wordmark rides along: it only ever appears on a card, and a card can
    // only be looked at with a pack connected, so shipping it with the app put
    // a piece of someone else's artwork in a public repo for nothing
    expect(paths).toContain('gallery/logo.png');

    // a spread of them rather than all 604: same code path, one tenth the time
    const sample = ['gallery/ch-001.jpg', 'gallery/t/ch-001.jpg', 'gallery/bonus-01.jpg', paths[300]!, paths.at(-1)!];
    for (const path of sample) {
      const out = await entryBytes(bytes, indexLen, index[path]!);
      const original = await readFile(`public/${path}`);
      expect(out.equals(original), `${path} came back different`).toBe(true);
    }
  });

  it('is not readable without the key', async () => {
    const buffer = (await readFile(PACK)).buffer as ArrayBuffer;
    const b = new Uint8Array(buffer);
    // the header is plain, as it must be - but nothing past it should be
    expect(String.fromCharCode(...b.subarray(0, 4))).toBe('AOHK');
    const body = Buffer.from(b.subarray(21, 200_000)).toString('latin1');
    expect(body).not.toContain('JFIF');
    expect(body).not.toContain('￘￠');
    expect(body).not.toContain('gallery/ch-');
  });
});
