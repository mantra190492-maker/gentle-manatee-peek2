// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { URL } from 'url'; // Import URL for path resolution

export default defineConfig(async () => {
  let dyadTagger: any = null;
  try {
    // ESM-safe dynamic import; only use if available
    const m = await import('@dyad-sh/react-vite-component-tagger');
    dyadTagger = (m as any).default ?? m;
  } catch {
    // not installed or not needed locally — continue without it
  }

  return {
    plugins: [
      react(),
      ...(dyadTagger ? [dyadTagger()] : []),
    ],
    optimizeDeps: {
      // avoid prebundling the tagger
      exclude: ['@dyad-sh/react-vite-component-tagger'],
    },
    ssr: {
      // ensure it isn't externalized in SSR builds
      noExternal: ['@dyad-sh/react-vite-component-tagger'],
    },
    resolve: {
      alias: { '@': new URL('./src', import.meta.url).pathname },
    },
  };
});