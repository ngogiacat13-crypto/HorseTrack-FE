import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';

export type LiveRole = 'ClubManager' | 'HeadTrainer' | 'Veterinarian' | 'Groom' | 'WarehouseManager' | 'HorseOwner';

export const LIVE_HOME: Record<LiveRole, string> = {
  ClubManager: '/manager',
  HeadTrainer: '/trainer',
  Veterinarian: '/vet',
  Groom: '/groom',
  WarehouseManager: '/warehouse',
  HorseOwner: '/owner',
};

const USERNAME_ROLE: Record<string, LiveRole> = {
  admin: 'ClubManager',
  manager_admin: 'ClubManager',
  test_hlv: 'HeadTrainer',
  test_bacsi: 'Veterinarian',
  test_maphu: 'Groom',
  test_kho: 'WarehouseManager',
  test_chungua: 'HorseOwner',
};

export interface LiveAccount { username: string; password: string; role: LiveRole }

const ACCOUNT_FILES = ['../.env.live.local', '../.env.backend'];

const readIfPresent = (relative: string) => {
  const file = new URL(relative, import.meta.url);
  return existsSync(file) ? readFileSync(file, 'utf8') : '';
};

export const liveAccounts = (): LiveAccount[] => {
  const envFile = ACCOUNT_FILES.map(readIfPresent).join('\n');
  const seen = new Set<string>();
  return envFile.split(/\r?\n/)
    .map((line) => line.match(/^#\s+(\S+)\s+\/\s+(\S+)/))
    .filter((match): match is RegExpMatchArray => !!match && match[1] in USERNAME_ROLE)
    .filter((match) => !seen.has(match[1]) && !!seen.add(match[1]))
    .map(([, username, password]) => ({ username, password, role: USERNAME_ROLE[username] }));
};

export interface ApiCall { method: string; path: string; status: number }

const REPORT_DIR = new URL('../test-results/live-report/', import.meta.url);

export const recordFinding = (role: LiveRole, entry: Record<string, unknown>) => {
  mkdirSync(REPORT_DIR, { recursive: true });
  appendFileSync(new URL(`${role}.jsonl`, REPORT_DIR), `${JSON.stringify(entry)}\n`);
};

export const watchLive = (page: Page) => {
  const calls: ApiCall[] = [];
  const errors: string[] = [];
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith('/api/v1/')) return;
    calls.push({ method: response.request().method(), path: `${url.pathname.replace('/api/v1', '')}${url.search}`, status: response.status() });
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource')) errors.push(`console: ${message.text().slice(0, 300)}`);
  });
  return { calls, errors };
};

export const liveSignIn = async (page: Page, account: LiveAccount) => {
  await page.goto('/login');
  await page.getByTestId('username-input').fill(account.username);
  await page.getByTestId('password-input').fill(account.password);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(new RegExp(`${LIVE_HOME[account.role]}$`), { timeout: 20_000 });
  await expect(page.getByTestId('sidebar')).toBeVisible();
};

export const settle = async (page: Page) => {
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(400);
};
