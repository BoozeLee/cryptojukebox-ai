import { readFile } from 'node:fs/promises';

const output = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const rootRelativeAsset = /\b(?:src|href)="\/assets\//;

if (rootRelativeAsset.test(output)) {
  throw new Error('Static build contains root-relative asset URLs that fail on GitHub Pages projects.');
}
