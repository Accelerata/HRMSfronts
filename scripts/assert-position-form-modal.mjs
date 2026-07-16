import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = readFileSync(
  resolve(root, 'src/pages/Organization/PositionManagement/PositionFormModal.tsx'),
  'utf8',
);

if (!/modalProps=\{\{[\s\S]*styles:\s*\{[\s\S]*body:\s*\{[\s\S]*maxHeight:\s*['"]calc\(100vh - 220px\)['"][\s\S]*overflowY:\s*['"]auto['"]/m.test(source)) {
  throw new Error('Position form modal body must be height-limited and scrollable.');
}

if (!/width=\{['"]min\(640px,\s*calc\(100vw - 32px\)\)['"]\}/.test(source)) {
  throw new Error('Position form modal width must fit narrow viewports.');
}
