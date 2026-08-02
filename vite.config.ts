/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/nihongo-flashcards/',
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
