import { defineConfig } from 'vite';

// Configuração do Vite.
//
// `base` define o prefixo de caminho dos assets no build. No GitHub Pages de
// projeto o site é servido em https://<usuario>.github.io/bilby-blitz/, então
// os assets precisam do prefixo "/bilby-blitz/". Em desenvolvimento (`npm run
// dev`) mantemos a raiz "/" para não quebrar o servidor local.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/bilby-blitz/' : '/',
}));