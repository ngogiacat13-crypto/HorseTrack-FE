import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('manager user list: lock buttons and secondary actions line up in fixed columns', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page, 'ClubManager');
  await page.getByTestId('nav-manager-users').click();
  const cells = page.locator('[data-testid^="user-actions-"]');
  await expect(cells.first()).toBeVisible();
  const boxes = await cells.evaluateAll((els) => els.map((el) => {
    const kids = [...el.children].map((c) => c.getBoundingClientRect());
    return kids.length === 2 ? { lockLeft: kids[0].left, lockRight: kids[0].right, nextLeft: kids[1].left } : null;
  }).filter((b): b is { lockLeft: number; lockRight: number; nextLeft: number } => b !== null));
  expect(boxes.length).toBeGreaterThan(2);
  for (const b of boxes) {
    expect(Math.abs(b.lockLeft - boxes[0].lockLeft)).toBeLessThan(1);
    expect(Math.abs(b.lockRight - boxes[0].lockRight)).toBeLessThan(1);
    expect(Math.abs(b.nextLeft - boxes[0].nextLeft)).toBeLessThan(1);
  }
});
