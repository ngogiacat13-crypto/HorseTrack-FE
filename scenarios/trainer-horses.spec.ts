import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('a head trainer can be given horses from several zones without picking a zone', async ({ page }) => {
  await signIn(page, 'ClubManager');
  await page.goto('/manager/users');
  await page.getByTestId('assign-duchung').click();
  const dialog = page.getByTestId('trainer-horses-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Khu chăm sóc')).toHaveCount(0);
  for (const id of ['h-galaxy', 'h-bolt', 'h-flash', 'h-comet']) await expect(page.getByTestId(`trainer-horse-${id}`)).toBeChecked();
  await expect(dialog).toContainText('Khu A 2 · Khu B 1 · Khu C 1');
  await expect(dialog).toContainText('Đang do Lê Minh Tâm phụ trách');
  await page.getByTestId('trainer-horse-h-blaze').check();
  await expect(dialog).toContainText('Khu A 2 · Khu B 1 · Khu C 2');
  await page.getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('toast')).toContainText('Đã phân công 5 ngựa cho Trần Đức Hùng');
});
