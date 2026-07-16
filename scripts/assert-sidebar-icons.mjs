import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const routes = readFileSync(resolve(root, 'config/routes.ts'), 'utf8');
const basicLayout = readFileSync(resolve(root, 'src/layouts/BasicLayout.tsx'), 'utf8');

const routeIconNames = [...routes.matchAll(/icon:\s*['"]([A-Za-z]+Outlined)['"]/g)]
  .map((match) => match[1]);
const uniqueIconNames = [...new Set(routeIconNames)];

const missingIconNames = uniqueIconNames.filter((iconName) => {
  const mapEntry = new RegExp(`${iconName}\\s*:\\s*<${iconName}\\s*/>`);
  return !mapEntry.test(basicLayout);
});

if (missingIconNames.length > 0) {
  throw new Error(`Sidebar icon strings are not mapped to components: ${missingIconNames.join(', ')}`);
}
