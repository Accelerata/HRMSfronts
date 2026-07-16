import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const routes = readFileSync(resolve(root, 'config/routes.ts'), 'utf8');
const umiConfig = readFileSync(resolve(root, '.umirc.ts'), 'utf8');
const appConfig = readFileSync(resolve(root, 'src/app.tsx'), 'utf8');

const usesCustomRootLayout = /component:\s*['"]@\/layouts\/BasicLayout['"]/.test(routes);
const enablesUmiLayout = /(?:^|\n)\s*layout:\s*\{/.test(umiConfig);
const exportsRuntimeLayout = /export\s+const\s+layout\s*=/.test(appConfig);

if (usesCustomRootLayout && enablesUmiLayout) {
  throw new Error('Custom BasicLayout is active, so .umirc.ts must not enable Umi plugin-layout.');
}

if (usesCustomRootLayout && exportsRuntimeLayout) {
  throw new Error('Custom BasicLayout is active, so src/app.tsx must not export runtime layout config.');
}
