import { expect, test } from '@playwright/test';
import { ROLE_HOME, ROLES, accountFor, signIn, watchPageErrors } from './support';

test('a guest opening the site sees the introduction page first, then can go to login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('HorseTrack');
  await page.getByTestId('landing-login').click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByTestId('login-form')).toBeVisible();
  await expect(page.getByTestId('login-identifier-hint')).toContainText('tên đăng nhập, email hoặc số điện thoại');
});

test('a wrong password shows an error and stays on login', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('username-input').fill(accountFor('ClubManager').username);
  await page.getByTestId('password-input').fill('sai-mat-khau-123');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('login-error')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

for (const role of ROLES) {
  test(`${role} lands on ${ROLE_HOME[role]} and can sign out`, async ({ page }) => {
    const errors = watchPageErrors(page);
    await signIn(page, role);
    await expect(page.getByTestId('page-title').first()).toBeVisible();
    await page.getByTestId('user-menu-btn').click();
    await page.getByTestId('logout-btn').click();
    await expect(page).toHaveURL(/\/login$/);
    expect(errors).toEqual([]);
  });
}
