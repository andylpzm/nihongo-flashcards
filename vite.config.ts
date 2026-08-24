/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { writeFile, readFile, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const FRAMING = resolve(import.meta.dirname, 'src/data/framing.json');
const OVERRIDES = resolve(import.meta.dirname, 'src/data/cardOverrides.json');

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
    packRoute(),
    keepArtworkOut(),
    ...(process.env.HTTPS ? [basicSsl()] : []),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
