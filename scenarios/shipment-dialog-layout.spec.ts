import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('warehouse shipment item controls stay aligned on desktop and mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signIn(page, 'WarehouseManager');
  await page.goto('/warehouse/shipments');
  await page.getByRole('button', { name: 'Tạo đơn nhập' }).click();

  const dialog = page.getByTestId('shipment-create-dialog');
  const select = page.getByTestId('shipment-add-item-select');
  const quantity = page.getByTestId('shipment-add-qty-input');
  const add = page.getByTestId('shipment-add-item-btn');
  await expect(dialog).toBeVisible();
  await expect(select).toBeVisible();
  await expect(quantity).toBeVisible();
  await expect(add).toBeDisabled();

  const itemBounds = await select.boundingBox();
  const quantityBounds = await quantity.boundingBox();
  const addBounds = await add.boundingBox();
  const columns = await page.locator('.shipment-create-items thead th').evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { left: rect.left, right: rect.right };
  }));
  expect(itemBounds).not.toBeNull();
  expect(quantityBounds).not.toBeNull();
  expect(addBounds).not.toBeNull();
  expect(itemBounds!.x).toBeGreaterThanOrEqual(columns[0].left - 1);
  expect(itemBounds!.x + itemBounds!.width).toBeLessThanOrEqual(columns[0].right + 1);
  expect(quantityBounds!.x).toBeGreaterThanOrEqual(columns[1].left - 1);
  expect(quantityBounds!.x + quantityBounds!.width).toBeLessThanOrEqual(columns[1].right + 1);
  expect(addBounds!.x).toBeGreaterThanOrEqual(columns[2].left - 1);
  expect(addBounds!.x + addBounds!.width).toBeLessThanOrEqual(columns[2].right + 1);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(select).toBeVisible();
  const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  const dialogFits = await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth + 1);
  expect(noOverflow).toBe(true);
  expect(dialogFits).toBe(true);
});
