import { expect, test, type Page } from '@playwright/test';
import { ROLES, signIn, type Role } from './support';

const EXTRA_PAGES: Partial<Record<Role, string[]>> = {
  HeadTrainer: ['/trainer/plans/new', '/trainer/races/new'],
  Veterinarian: ['/vet/protocols/new'],
  HorseOwner: ['/owner/registrations/new'],
};
const COMMON_PAGES = ['/my-profile', '/change-password'];

const findLayoutIssues = (page: Page) => page.evaluate(() => {
  const issues: string[] = [];
  const name = (el: Element) => (el.querySelector('.ht-label')?.textContent ?? el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 30);
  const controlOf = (field: Element) => field.querySelector<HTMLElement>('input:not([type=checkbox]):not([type=radio]):not([type=file]), select, textarea, .ht-seg');
  const parents = new Set([...document.querySelectorAll('.ht-field')].map((f) => f.parentElement).filter((p): p is HTMLElement => !!p));
  parents.forEach((parent) => {
    const fields = [...parent.children].filter((c) => c.classList.contains('ht-field') && controlOf(c) && (c as HTMLElement).offsetParent);
    const rows = new Map<number, Element[]>();
    fields.forEach((f) => {
      const top = Math.round(f.getBoundingClientRect().top);
      const key = [...rows.keys()].find((k) => Math.abs(k - top) <= 2) ?? top;
      rows.set(key, [...(rows.get(key) ?? []), f]);
    });
    rows.forEach((row) => {
      if (row.length < 2) return;
      const bottoms = row.map((f) => controlOf(f)!.getBoundingClientRect().bottom);
      if (Math.max(...bottoms) - Math.min(...bottoms) > 2) issues.push(`lệch hàng: ${row.map(name).join(' | ')}`);
    });
  });
  const ctx = document.createElement('canvas').getContext('2d')!;
  document.querySelectorAll<HTMLSelectElement>('select').forEach((s) => {
    if (!s.offsetParent) return;
    const style = getComputedStyle(s);
    ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const text = s.selectedOptions[0]?.textContent ?? '';
    const room = s.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    if (ctx.measureText(text).width > room + 1) issues.push(`chữ bị cắt trong ô chọn: "${text.trim().slice(0, 30)}"`);
  });
  if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) issues.push('trang bị cuộn ngang');
  return issues;
});

for (const width of [1280, 1920]) for (const role of ROLES) {
  test(`${role} @${width}px: form fields line up and nothing overflows`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page, role);
    const links = page.getByTestId('sidebar').locator('[data-testid^="nav-"]');
    const ids = await links.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-testid') ?? ''));
    const found: string[] = [];
    for (const id of ids) {
      await page.getByTestId(id).click();
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      found.push(...(await findLayoutIssues(page)).map((i) => `${new URL(page.url()).pathname}: ${i}`));
    }
    for (const path of [...(EXTRA_PAGES[role] ?? []), ...COMMON_PAGES]) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      found.push(...(await findLayoutIssues(page)).map((i) => `${path}: ${i}`));
    }
    expect([...new Set(found)]).toEqual([]);
  });
}

test('public sign-up and password pages line up', async ({ page }) => {
  const found: string[] = [];
  for (const path of ['/login', '/register', '/forgot-password']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    found.push(...(await findLayoutIssues(page)).map((i) => `${path}: ${i}`));
  }
  expect(found).toEqual([]);
});
