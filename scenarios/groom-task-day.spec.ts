import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('groom previews next-day tasks without being able to complete them', async ({ page }) => {
  await signIn(page, 'Groom');
  await expect(page.getByTestId('task-TK-0301')).toBeVisible();
  await expect(page.getByTestId('task-TK-0324')).toHaveCount(0);
  await page.getByTestId('task-day-input').fill('2026-10-04');
  await expect(page.getByTestId('task-day-preview')).toBeVisible();
  await expect(page.getByTestId('task-TK-0324')).toContainText('NGÀY SAU');
  await expect(page.getByTestId('task-done-TK-0324')).toHaveCount(0);
  await page.getByTestId('task-day-today').click();
  await expect(page.getByTestId('task-TK-0301')).toBeVisible();
  await expect(page.getByTestId('task-done-TK-0301')).toBeVisible();
});
