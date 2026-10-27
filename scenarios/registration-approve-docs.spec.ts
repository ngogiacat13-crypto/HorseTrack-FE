import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('manager cannot approve a registration that has no ownership document', async ({ page }) => {
  await signIn(page, 'ClubManager');
  await page.goto('/manager/registrations/REG-0020');
  await expect(page.getByTestId('approve-needs-docs')).toBeVisible();
  await expect(page.getByTestId('approve-registration-btn')).toBeDisabled();
  await page.goto('/manager/registrations/REG-0017');
  await expect(page.getByTestId('approve-needs-docs')).toHaveCount(0);
  await expect(page.getByTestId('approve-registration-btn')).toBeVisible();
});
