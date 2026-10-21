import { expect, test } from '@playwright/test';
import { ROLES, signIn, watchPageErrors } from './support';

for (const role of ROLES) {
  test(`${role}: every menu page opens without errors`, async ({ page }) => {
    const errors = watchPageErrors(page);
    await signIn(page, role);
    const links = page.getByTestId('sidebar').locator('[data-testid^="nav-"]');
    const ids = await links.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-testid') ?? ''));
    expect(ids.length).toBeGreaterThan(2);
    for (const id of ids) {
      await page.getByTestId(id).click();
      await expect(page.getByTestId(id)).toHaveClass(/active/);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      expect(errors, `after opening ${id}`).toEqual([]);
    }
  });
}
