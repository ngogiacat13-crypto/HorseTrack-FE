import { expect, test } from '@playwright/test';
import { watchPageErrors } from './support';

const titles = [
  'QUẢN LÝ GIẢI ĐẤU',
  'ĐĂNG KÝ NGỰA DỰ THI',
  'HLV & KHÁM THÚ Y',
  'LỊCH TẬP & GIÁO ÁN',
  'SỨC KHỎE & CHĂM SÓC NGỰA',
  'KHO & DINH DƯỠNG',
  'KẾT QUẢ & TIỀN THƯỞNG',
];

test('public landing shows core features in a responsive bento grid', async ({ page }) => {
  const errors = watchPageErrors(page);
  const viewports = [
    { width: 1440, height: 1000, columns: 4 },
    { width: 768, height: 1000, columns: 2 },
    { width: 390, height: 844, columns: 1 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/gioi-thieu');
    await expect(page.getByRole('heading', { name: 'TÍNH NĂNG CỐT LÕI', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Các luồng nghiệp vụ chính', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Quy tắc nghiệp vụ được hệ thống bảo vệ', exact: true })).toHaveCount(0);

    const features = page.locator('.ht-landing__feature');
    await expect(features).toHaveCount(7);
    for (const title of titles) {
      await expect(features.getByRole('heading', { name: title, exact: true })).toBeVisible();
    }

    const columns = await page.locator('.ht-landing__feature-grid').evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length);
    expect(columns).toBe(viewport.columns);
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasHorizontalOverflow).toBe(false);
    const danglingAnchors = await page.locator('.ht-landing a[href^="#"]').evaluateAll((anchors) => anchors.filter((anchor) => !document.querySelector(anchor.getAttribute('href') ?? '')).map((anchor) => anchor.getAttribute('href')));
    expect(danglingAnchors).toEqual([]);
  }

  expect(errors).toEqual([]);
});
