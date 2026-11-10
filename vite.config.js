import { defineConfig } from 'vite';
import { cpSync, mkdirSync } from 'node:fs';
// Serve MathLive fonts locally, including production builds.
mkdirSync(new URL('./public/fonts', import.meta.url), { recursive: true });
cpSync(new URL('./node_modules/mathlive/fonts/', import.meta.url), new URL('./public/fonts/', import.meta.url), { recursive: true });
export default defineConfig({ base: './' });