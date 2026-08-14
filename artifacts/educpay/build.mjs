import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Running vite build...');
execSync('npx vite build --config vite.config.ts', { cwd: dirname, stdio: 'inherit' });

const distPublic = path.resolve(dirname, 'dist/public');
const localPublic = path.resolve(dirname, 'public');
const rootPublic = path.resolve(dirname, '../../public');

console.log('Syncing dist/public to local public...');
cpSync(distPublic, localPublic, { recursive: true });

const routes = [
  'app',
  'app/establishment',
  'app/establishments',
  'app/team',
  'app/resources',
  'app/calendar',
  'app/settings',
  'app/help',
  'register-establishment',
  'registration-submitted',
  'registration-status',
  'auth/login',
  'auth/register',
  'auth/forgot-password',
  'auth/reset-password',
  'auth/first-login',
  'auth/activate',
];

const indexHtml = path.resolve(distPublic, 'index.html');
for (const route of routes) {
  const routeDir = path.resolve(localPublic, route);
  mkdirSync(routeDir, { recursive: true });
  cpSync(indexHtml, path.resolve(routeDir, 'index.html'));
}

console.log('Syncing to root public folder...');
rmSync(rootPublic, { recursive: true, force: true });
cpSync(localPublic, rootPublic, { recursive: true });

console.log('Build completed successfully.');
