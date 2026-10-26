import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';

export type Role = 'ClubManager' | 'HeadTrainer' | 'Veterinarian' | 'Groom' | 'HorseOwner' | 'WarehouseManager';

interface SeedUser { username: string; password: string; fullname: string; role: Role; status?: string }

const seedUsers = (JSON.parse(readFileSync(new URL('../db.json', import.meta.url), 'utf8')) as { users: SeedUser[] }).users;

export const ROLE_HOME: Record<Role, string> = {
  ClubManager: '/manager',
  HeadTrainer: '/trainer',
  Veterinarian: '/vet',
  Groom: '/groom',
  HorseOwner: '/owner',
  WarehouseManager: '/warehouse',
};

export const ROLES = Object.keys(ROLE_HOME) as Role[];

export const accountFor = (role: Role, fullname?: string) => {
  const user = seedUsers.find((u) => u.role === role && (!fullname || u.fullname === fullname) && (u.status ?? 'ACTIVE') === 'ACTIVE');
  if (!user) throw new Error(`db.json has no active ${role}`);
  return user;
};

export const watchPageErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
};

export const signIn = async (page: Page, role: Role, fullname?: string) => {
  const { username, password } = accountFor(role, fullname);
  await page.goto('/login');
  await page.getByTestId('username-input').fill(username);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(new RegExp(`${ROLE_HOME[role]}$`));
  await expect(page.getByTestId('sidebar')).toBeVisible();
};
