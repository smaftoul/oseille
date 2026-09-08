import { test, expect } from "@playwright/test";

function waitForIdle(page: import("@playwright/test").Page) {
  return page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => resolve(), { timeout: 4000 });
      } else {
        resolve();
      }
    });
  });
}

test.describe("PWA installability", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#search")).toBeVisible({ timeout: 15_000 });
  });

  test("serves a valid manifest", async ({ page }) => {
    const manifestUrl = new URL("/manifest.webmanifest", page.url()).href;
    const res = await page.request.get(manifestUrl);
    expect(res.status()).toBe(200);
    const manifest = await res.json();
    expect(manifest.name).toBe("Oseille");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.some((i: { sizes: string }) => i.sizes === "192x192")).toBe(true);
    expect(manifest.icons.some((i: { sizes: string }) => i.sizes === "512x512")).toBe(true);
  });

  test("has PWA meta tags", async ({ page }) => {
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#2e7d32");
    const link = page.locator('link[rel="manifest"]');
    await expect(link).toHaveCount(1);
    await expect(link.first()).toHaveAttribute("href", /manifest/);
  });

  test("renders the app shell with search input", async ({ page }) => {
    await expect(page.locator("#search")).toBeVisible();
  });

  test("registers a service worker after idle", async ({ page }) => {
    await waitForIdle(page);
    await expect(async () => {
      const hasRegisterSW = await page.evaluate(() => !!document.querySelector('script[src*="registerSW"]'));
      expect(hasRegisterSW).toBeTruthy();
    }).toPass({ timeout: 10_000 });
  });

  test("shows the install CTA button in the header", async ({ page }) => {
    const cta = page.locator("header button");
    await expect(cta).toBeVisible();
    const text = await cta.textContent();
    expect(text?.toLowerCase()).toMatch(/installer|install/);
  });

  test("install button loads A2HS on demand", async ({ page }) => {
    const button = page.locator("header button");
    await expect(button).toBeEnabled();
    await button.click();
    await expect(async () => {
      const callable = await page.evaluate(() => typeof (window as any).AddToHomeScreenShow === "function");
      expect(callable).toBeTruthy();
    }).toPass({ timeout: 10_000 });
  });

  test("serves sw.js and precaches data files", async ({ page }) => {
    await waitForIdle(page);
    await expect(async () => {
      const ok = await page.evaluate(async () => {
        const regs = await navigator.serviceWorker.getRegistrations();
        return regs.some((r) => !!r.active);
      });
      expect(ok).toBeTruthy();
    }).toPass({ timeout: 10_000 });
    const swRes = await page.request.get("/sw.js");
    expect(swRes.status()).toBe(200);
    const swText = await swRes.text();
    expect(swText).toContain("oseille-data");
  });
});
