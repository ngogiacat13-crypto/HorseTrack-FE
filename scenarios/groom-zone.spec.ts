import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('creating a groom account does not ask for a stall zone', async ({ page }) => {
  await signIn(page, 'ClubManager');
  await page.goto('/manager/users');
  await page.getByRole('button', { name: 'Tạo tài khoản nhân viên' }).click();
  await page.getByRole('radio', { name: 'Người chăm ngựa' }).check();
  await expect(page.getByText('Khu chuồng phụ trách')).toHaveCount(0);
  await page.getByTestId('dialog-cancel').click();
});

test('a groom keeps exactly one zone and zones of other grooms are locked', async ({ page }) => {
  await signIn(page, 'ClubManager');
  await page.goto('/manager/users');
  await page.getByTestId('assign-vantoan').click();
  const dialog = page.getByTestId('groom-zone-dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('groom-zone-Khu A')).toBeChecked();
  await expect(page.getByTestId('groom-zone-Khu B')).toBeDisabled();
  await expect(page.getByTestId('groom-zone-Khu C')).toBeDisabled();
  await page.getByTestId('dialog-cancel').click();
  await expect(dialog).toBeHidden();
});
