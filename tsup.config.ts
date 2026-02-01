import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.tsx',
    clawd: 'bin/clawd.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
});
