import { expect, test } from '@playwright/test';
import { watchPageErrors } from './support';

const services = ['Huấn luyện theo giáo án', 'Thú y & điều trị', 'Lưu chuồng & dinh dưỡng', 'Tham gia giải đấu', 'Theo dõi trực tuyến'];

test('public landing introduces the club to horse owners: services, get-started steps, team, promises and FAQ', async ({ page }) => {
  const errors = watchPageErrors(page);
  const viewports = [
    { width: 1440, height: 1000, columns: 6 },
    { width: 768, height: 1000, columns: 2 },
    { width: 390, height: 844, columns: 1 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/gioi-thieu');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('HorseTrack');

    const cards = page.locator('.ht-landing__bento > .ht-landing__card');
    await expect(cards).toHaveCount(5);
    for (const title of services) {
      await expect(cards.getByRole('heading', { name: title, exact: true })).toBeVisible();
    }
    await expect(page.locator('.ht-landing__about > .ht-landing__tile')).toHaveCount(3);
    await expect(page.locator('.ht-landing__flow > li')).toHaveCount(4);
    await expect(page.locator('.ht-landing__faq details')).toHaveCount(6);
    await expect(page.locator('.ht-landing__gallery img')).toHaveCount(8);

    const columns = await page.locator('.ht-landing__bento').evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length);
    expect(columns).toBe(viewport.columns);
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasHorizontalOverflow).toBe(false);
    const danglingAnchors = await page.locator('.ht-landing a[href^="#"]').evaluateAll((anchors) => anchors.filter((anchor) => !document.querySelector(anchor.getAttribute('href') ?? '')).map((anchor) => anchor.getAttribute('href')));
    expect(danglingAnchors).toEqual([]);
  }

  await page.getByTestId('landing-team-vet').click();
  await expect(page.getByTestId('landing-team-panel')).toContainText('Sức khỏe là trên hết');
  await page.getByTestId('landing-promise-dot-2').click();
  await expect(page.getByTestId('landing-promise')).toContainText('7 ngày');
  await page.getByTestId('landing-faq-1').locator('summary').click();
  await expect(page.getByTestId('landing-faq-1')).toContainText('giấy chứng nhận sức khỏe');
  await expect(page.getByTestId('landing-status')).toContainText('dữ liệu mẫu');

  await page.getByTestId('landing-lang-en').click();
  await expect(page.locator('.ht-landing__tagline')).toContainText('Structured training');
  await page.getByTestId('landing-lang-vi').click();

  await page.getByTestId('landing-hero-register').click();
  await expect(page).toHaveURL(/\/register$/);
  expect(errors).toEqual([]);
});
