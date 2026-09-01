/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { writeFile, readFile, mkdir, rm, readdir, copyFile, access, unlink } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { dirname, resolve, join, extname, basename } from 'node:path';

const FRAMING = resolve(import.meta.dirname, 'src/data/framing.json');
const OVERRIDES = resolve(import.meta.dirname, 'src/data/cardOverrides.json');
const GALLERY = resolve(import.meta.dirname, 'src/data/gallery.json');
const INSERTS = resolve(import.meta.dirname, 'src/data/cardInserts.json');
const TONE = resolve(import.meta.dirname, 'src/data/tone.json');
// the scanned manga, the pool the framer picks replacement pictures from
const RAW = resolve(import.meta.dirname, 'Ao_no_Hako_Raw');
const ART = resolve(import.meta.dirname, 'public');
// a picture the framer replaces is kept, once, so a swap is never a one-way door
const BACKUP = resolve(import.meta.dirname, 'gallery-source/replaced');
// pictures picked off the disk in the framing tool, kept at full size the way
// gallery-source keeps everything else the artwork was cut from
const UPLOADS = resolve(import.meta.dirname, 'gallery-source/uploads');

const run = promisify(execFile);
const exists = (p: string): Promise<boolean> => access(p).then(() => true).catch(() => false);

// lets tools/framer.html write its result straight into the repo. dev only -
// the framing tool is an authoring step, not part of the app.
function jsonStore(route: string, file: string, name: string): Plugin {
  return {
    name,
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(route, (req, res) => {
        const FRAMING = file;
        if (req.method === 'GET') {
          readFile(FRAMING, 'utf8')
            .then((t) => {
              res.setHeader('content-type', 'application/json');
              res.end(t);
            })
            .catch(() => {
              res.setHeader('content-type', 'application/json');
              res.end('{}');
            });
          return;
        }
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          let parsed: unknown;
          try {
            parsed = JSON.parse(body);
          } catch {
            res.statusCode = 400;
            res.end('bad json');
            return;
          }
          mkdir(dirname(FRAMING), { recursive: true })
            .then(() => writeFile(FRAMING, JSON.stringify(parsed, null, 2) + '\n'))
            .then(() => res.end('ok'))
            .catch((e) => {
              res.statusCode = 500;
              res.end(String(e));
            });
        });
      });
    },
  };
}

// serves the built pack in dev so the connect flow can be exercised without
// copying a file about by hand. dev only - the pack never ships with the app.
function packRoute(): Plugin {
  return {
    name: 'pack-route',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__pack', (_req, res) => {
        readFile(resolve(import.meta.dirname, 'dist-pack/aonohako.pack'))
          .then((buf) => {
            res.setHeader('content-type', 'application/octet-stream');
            res.end(buf);
          })
          .catch(() => {
            res.statusCode = 404;
            res.end('run: node tools/pack-gallery.mjs');
          });
      });
    },
  };
}

// vite copies everything in public/ into the build, and public/gallery is the
// artwork - 35MB of it, the whole reason the pack exists. it stays there so the
// repo can run without a pack; this takes it back out of the build.
function keepArtworkOut(): Plugin {
  return {
    name: 'keep-artwork-out',
    apply: 'build',
    async closeBundle() {
      await rm(resolve(import.meta.dirname, 'dist/gallery'), { recursive: true, force: true });
      this.warn('artwork left out of the build - ship dist-pack/aonohako.pack separately');
    },
  };
}


/* ---- the raw manga pool, and swapping a card's picture for one of its pages
   ---------------------------------------------------------------------------
   dev only, like the framing store above: this is authoring, not the app. the
   scans are 4795 files across 250 chapters and never change while the server
   runs, so the listing is read once and held. */

interface RawList {
  chapters: { id: string; dir: string; files: string[] }[];
}
const IMG = /\.(jpe?g|png|webp)$/i;
let rawCache: RawList | null = null;

async function scanRaw(): Promise<RawList> {
  if (rawCache) return rawCache;
  const chapters: RawList['chapters'] = [];
  // the tree is <RAW>/gallery-dl/<site>/<series>/<chapter>/<page>.jpg, but do
  // not hard-code that: walk until a directory holds images.
  const walk = async (dir: string, rel: string): Promise<void> => {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile() && IMG.test(e.name)).map((e) => e.name).sort();
    if (files.length) {
      chapters.push({ id: basename(dir), dir: rel, files });
      return;
    }
    for (const e of entries.filter((e) => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name)))
      await walk(join(dir, e.name), rel ? `${rel}/${e.name}` : e.name);
  };
  await walk(RAW, '').catch(() => undefined);
  chapters.sort((a, b) => a.dir.localeCompare(b.dir, undefined, { numeric: true }));
  rawCache = { chapters };
  return rawCache;
}

/** a path is only usable if it stays inside the directory it claims to be in */
function inside(root: string, rel: string): string | null {
  const full = resolve(root, rel);
  return full === root || full.startsWith(root + '/') ? full : null;
}

/** where a picture came from: a scanned page, or a file picked off the disk */
function sourceFile(src: string): string | null {
  return src.startsWith('upload:') ? inside(UPLOADS, src.slice(7)) : inside(RAW, src);
}

const sendJson = (res: ServerResponse, value: unknown): void => {
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(value));
};
const readBody = (req: IncomingMessage): Promise<string> =>
  new Promise((ok) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => ok(body));
  });

/**
 * how big a card's picture is cut.
 *
 * a landscape card spans two pockets, so it is drawn about twice as wide as a
 * portrait one - and if its picture came off a portrait page, the width is the
 * SHORT edge, which is what -Z leaves smallest. cut to 300 like everything else
 * it arrives with 205 pixels to cover 600 device pixels. the sizes below are
 * per shape rather than per file for that reason.
 */
const cut = (land: boolean): { full: number; thumb: number } =>
  land ? { full: 1400, thumb: 700 } : { full: 1200, thumb: 600 };

/**
 * sips is on every mac - the same resize the gallery build tool uses.
 *
 * never past the source's own size: -Z will happily blow a small picture up,
 * which costs bytes in the pack and buys no detail.
 */
async function resize(src: string, dest: string, max: number, quality = 60): Promise<void> {
  const from = await pixelSize(src).catch(() => ({ width: 0, height: 0 }));
  const longest = Math.max(from.width, from.height);
  const to = longest > 0 ? Math.min(max, longest) : max;
  await run('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(quality),
    '-Z', String(to), src, '--out', dest]);
}

async function pixelSize(file: string): Promise<{ width: number; height: number }> {
  const { stdout } = await run('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file]);
  const w = /pixelWidth:\s*(\d+)/.exec(stdout);
  const h = /pixelHeight:\s*(\d+)/.exec(stdout);
  return { width: Number(w?.[1] ?? 0), height: Number(h?.[1] ?? 0) };
}

/** the manifest carries a size for the arc payoffs; a swap has to correct it */
async function fixManifestSize(id: string, width: number, height: number): Promise<void> {
  const text = await readFile(GALLERY, 'utf8');
  const data = JSON.parse(text) as {
    sagas: { arcs: { id: string; payoff?: Record<string, unknown>;
      pieces: Record<string, unknown>[] }[] }[];
  };
  let hit: Record<string, unknown> | undefined;
  for (const saga of data.sagas)
    for (const arc of saga.arcs) {
      if (arc.id === id && arc.payoff) hit = arc.payoff;
      for (const p of arc.pieces) if (p.id === id) hit = p;
    }
  if (!hit || !('width' in hit)) return;
  if (hit.width === width && hit.height === height) return;
  hit.width = width;
  hit.height = height;
  await writeFile(GALLERY, JSON.stringify(data, null, 2) + '\n');
}

/* ---- telling the app what the framing tool just did ----------------------
   the tool writes into src/data and public/gallery while it runs. vite's answer
   to a file it cannot hot-update is to reload every client - which reloads the
   TOOL, throwing away the crops it is holding that have not been saved yet.
   these files are intercepted instead: the module cache is invalidated so a
   reload picks up the new contents, and a custom event goes out. main.ts
   reloads on it; the tool, which is where the change came from, ignores it. */
function galleryLive(): Plugin {
  const authored = new Set([FRAMING, OVERRIDES, INSERTS, TONE]);
  const artwork = resolve(import.meta.dirname, 'public/gallery');
  // one message per burst. a tool that re-cuts every thumbnail changes 302
  // files in a few seconds, and one reload each leaves the app reloading on
  // top of itself, stuck on the splash at 0%.
  let pending: NodeJS.Timeout | null = null;
  return {
    name: 'gallery-live',
    apply: 'serve',
    configureServer(server) {
      // the artwork is served out of public/ under the same name after a swap,
      // so without this the app reloads and shows the picture it already had
      server.middlewares.use((req, res, next) => {
        if (req.url?.includes('/gallery/')) res.setHeader('cache-control', 'no-store');
        next();
      });
    },
    handleHotUpdate(ctx) {
      if (!authored.has(ctx.file) && !ctx.file.startsWith(artwork + '/')) return;
      for (const mod of ctx.modules) ctx.server.moduleGraph.invalidateModule(mod);
      if (pending) clearTimeout(pending);
      pending = setTimeout(() => {
        pending = null;
        ctx.server.hot.send({ type: 'custom', event: 'gallery:changed', data: { file: ctx.file } });
      }, 400);
      return [];
    },
  };
}

function rawPool(): Plugin {
  return {
    name: 'raw-pool',
    apply: 'serve',
    configureServer(server) {
      // the listing: every chapter, every page name
      server.middlewares.use('/__raw', (_req, res) => {
        scanRaw().then((r) => sendJson(res, r)).catch((e) => {
          res.statusCode = 500;
          res.end(String(e));
        });
      });

      // one raw page, straight off disk. ?p= is its path under Ao_no_Hako_Raw
      server.middlewares.use('/__rawfile', (req, res) => {
        const rel = new URL(req.url ?? '/', 'http://x').searchParams.get('p') ?? '';
        const full = inside(RAW, rel);
        if (!full || !IMG.test(full)) {
          res.statusCode = 400;
          res.end('bad path');
          return;
        }
        readFile(full)
          .then((buf) => {
            const ext = extname(full).toLowerCase();
            res.setHeader('content-type', ext === '.png' ? 'image/png'
              : ext === '.webp' ? 'image/webp' : 'image/jpeg');
            res.setHeader('cache-control', 'max-age=3600');
            res.end(buf);
          })
          .catch(() => {
            res.statusCode = 404;
            res.end('no such page');
          });
      });

      // a picture off the disk. the bytes come up raw with the name in the
      // query; it lands in gallery-source/uploads and is then just another
      // source path, so swapping and inserting need to know nothing about it
      server.middlewares.use('/__upload', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        const raw = new URL(req.url ?? '/', 'http://x').searchParams.get('name') ?? 'picture';
        // whatever the file was called on someone's desktop is not a path
        const name = raw.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-64);
        if (!IMG.test(name)) {
          res.statusCode = 400;
          res.end('not a picture');
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        req.on('data', (c: Buffer) => {
          size += c.length;
          if (size <= 64 * 1024 * 1024) chunks.push(c);
        });
        req.on('end', () => {
          if (size > 64 * 1024 * 1024) {
            res.statusCode = 413;
            res.end('over 64MB');
            return;
          }
          const file = `${Date.now()}-${name}`;
          mkdir(UPLOADS, { recursive: true })
            .then(() => writeFile(join(UPLOADS, file), Buffer.concat(chunks)))
            .then(() => sendJson(res, { src: `upload:${file}` }))
            .catch((e) => {
              res.statusCode = 500;
              res.end(String(e));
            });
        });
      });

      // { id, src, image, thumb } - a raw page written in as a NEW card. same
      // work as a swap but it refuses to land on a file that already exists:
      // an id collision here would quietly overwrite somebody's artwork
      server.middlewares.use('/__addcard', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        void (async () => {
          try {
            const body = JSON.parse(await readBody(req)) as
              { src: string; image: string; thumb?: string; land?: boolean };
            const src = sourceFile(body.src);
            const full = inside(ART, body.image);
            const thumb = body.thumb ? inside(ART, body.thumb) : null;
            if (!src || !full || !body.image.startsWith('gallery/')) {
              res.statusCode = 400;
              res.end('bad path');
              return;
            }
            if (await exists(full)) {
              res.statusCode = 409;
              res.end('a picture is already filed under that id');
              return;
            }
            const at = cut(!!body.land);
            await resize(src, full, at.full);
            if (thumb) await resize(src, thumb, at.thumb);
            sendJson(res, { ok: true, ...(await pixelSize(full)) });
          } catch (e) {
            res.statusCode = 500;
            res.end(String(e));
          }
        })();
      });

      // takes an inserted card's two files back off disk. only ever called for
      // a card the tool itself added - the pack is built from this directory,
      // so a mistake left here would ship
      server.middlewares.use('/__delcard', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        void (async () => {
          try {
            const body = JSON.parse(await readBody(req)) as { image: string; thumb?: string };
            for (const rel of [body.image, body.thumb]) {
              if (!rel || !rel.startsWith('gallery/')) continue;
              const full = inside(ART, rel);
              if (full && (await exists(full))) await unlink(full);
            }
            sendJson(res, { ok: true });
          } catch (e) {
            res.statusCode = 500;
            res.end(String(e));
          }
        })();
      });

      // { id, src, image, thumb } - writes the chosen raw page into public/
      // gallery at the two sizes the app reads, keeping the picture it replaced
      server.middlewares.use('/__swap', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        void (async () => {
          try {
            const body = JSON.parse(await readBody(req)) as
              { id: string; src: string; image: string; thumb?: string; land?: boolean };
            const src = sourceFile(body.src);
            const full = inside(ART, body.image);
            const thumb = body.thumb ? inside(ART, body.thumb) : null;
            if (!src || !full || !body.image.startsWith('gallery/')) {
              res.statusCode = 400;
              res.end('bad path');
              return;
            }
            // keep the original once - the first swap is the only one that has
            // the real picture to save
            await mkdir(BACKUP, { recursive: true });
            for (const f of [full, thumb]) {
              if (!f) continue;
              const keep = join(BACKUP, (f === full ? '' : 't-') + basename(f));
              if ((await exists(f)) && !(await exists(keep))) await copyFile(f, keep);
            }
            const at = cut(!!body.land);
            await resize(src, full, at.full);
            if (thumb) await resize(src, thumb, at.thumb);
            const size = await pixelSize(full);
            await fixManifestSize(body.id, size.width, size.height);
            sendJson(res, { ok: true, ...size });
          } catch (e) {
            res.statusCode = 500;
            res.end(String(e));
          }
        })();
      });
    },
  };
}

export default defineConfig({
  base: '/nihongo-flashcards/',
  // reachable from a phone on the same wifi. this is a study app for a phone,
  // and a desktop pointer cannot tell you what a thumb will do.
  server: { host: true },
  // HTTPS=1 npm run dev - for anything a phone will only do in a secure
  // context. the cert is self-signed, so the phone asks once before it will
  // load the page.
  plugins: [
    jsonStore('/__framing', FRAMING, 'framing-store'),
    jsonStore('/__overrides', OVERRIDES, 'overrides-store'),
    jsonStore('/__inserts', INSERTS, 'inserts-store'),
    jsonStore('/__tone', TONE, 'tone-store'),
    galleryLive(),
    rawPool(),
    packRoute(),
    keepArtworkOut(),
    ...(process.env.HTTPS ? [basicSsl()] : []),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
