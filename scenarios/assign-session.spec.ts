import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('session date defaults to today and past days cannot be picked', async ({ page }) => {
  await signIn(page, 'HeadTrainer');
  await page.goto('/trainer/schedule');
  await page.getByRole('button', { name: 'Phân công phiên tập' }).click();
  const dialog = page.getByTestId('assign-session-dialog');
  await expect(dialog).toBeVisible();
  const dateInput = page.getByTestId('assign-date-input');
  await expect(dateInput).toHaveValue('2026-10-03');
  await expect(dateInput).toHaveAttribute('min', '2026-10-03');
  await dateInput.fill('2026-12-24');
  await expect(dialog.getByText('T5')).toBeVisible();
  await page.getByTestId('dialog-cancel').click();
  await expect(dialog).toBeHidden();
});
