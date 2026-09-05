// @vitest-environment node
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const DEV_URL = "http://localhost:5173";
const PROD_URL = "http://localhost:4173";

let devServer: ChildProcess;
let previewServer: ChildProcess;

function spawnServer(command: string, args: string[], env: Record<string, string>): ChildProcess {
  return spawn(command, args, {
    stdio: "pipe",
    env: { ...process.env, ...env },
  });
}

async function waitForServer(url: string, child: ChildProcess, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`${url}: server exited with code ${child.exitCode}`);
    }
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`${url}: server not ready within ${timeoutMs}ms`);
}

function assertProdBuildExists(): void {
  const distIndex = resolve("dist/index.html");
  if (!existsSync(distIndex)) {
    throw new Error("dist/ is missing — run `npm run build` first");
  }
}

async function expectAssetsResolve(pageUrl: string, html: string): Promise<void> {
  const urls = new Set<string>();
  for (const match of html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g)) {
    const raw = match[1];
    if (raw.startsWith("http") || raw.startsWith("//") || raw.startsWith("data:")) continue;
    urls.add(new URL(raw, pageUrl).href);
  }
  for (const url of urls) {
    const res = await fetch(url);
    expect(res.status, `${url} should resolve`).toBe(200);
  }
}

beforeAll(async () => {
  assertProdBuildExists();
  try {
    previewServer = spawnServer("vite", ["preview", "--port", "4173", "--strictPort"], {});
    await waitForServer(`${PROD_URL}/`, previewServer);

    devServer = spawnServer("vite", ["--port", "5173", "--strictPort"], {});
    await waitForServer(`${DEV_URL}/`, devServer);
  } catch (err) {
    previewServer?.kill();
    devServer?.kill();
    throw err;
  }
});

afterAll(() => {
  previewServer?.kill();
  devServer?.kill();
});

describe("prod build (vite preview, relative base)", () => {
  it("serves the app", async () => {
    const res = await fetch(`${PROD_URL}/`);
    expect(res.status).toBe(200);
    await expect(await res.text()).toContain('<div id="root"></div>');
  });

  it("serves a valid manifest with relative start_url", async () => {
    const manifestUrl = `${PROD_URL}/manifest.webmanifest`;
    const res = await fetch(manifestUrl);
    expect(res.status).toBe(200);
    const manifest = (await res.json()) as { start_url?: string };
    expect(manifest.start_url).toBeDefined();
    const startUrl = new URL(manifest.start_url!, manifestUrl);
    expect(startUrl.href).toBe(`${PROD_URL}/`);

    const startRes = await fetch(startUrl);
    expect(startRes.status).toBe(200);
  });

  it("serves the app data the frontend fetches", async () => {
    const res = await fetch(`${PROD_URL}/data/prices.json`);
    expect(res.status).toBe(200);
    const payload = (await res.json()) as { items?: unknown[] };
    expect(payload.items?.length).toBeGreaterThan(0);
  });

  it("registers a service worker that is reachable", async () => {
    const sw = await fetch(`${PROD_URL}/sw.js`);
    expect(sw.status).toBe(200);
    expect(await sw.text()).toContain("precacheAndRoute");
  });

  it("serves every asset referenced by index.html", async () => {
    const res = await fetch(`${PROD_URL}/`);
    const html = await res.text();
    await expectAssetsResolve(`${PROD_URL}/`, html);
  });
});

describe("dev server (vite)", () => {
  it("serves the app", async () => {
    const res = await fetch(`${DEV_URL}/`);
    expect(res.status).toBe(200);
    await expect(await res.text()).toContain('<div id="root"></div>');
  });

  it("serves the app data the frontend fetches", async () => {
    const res = await fetch(`${DEV_URL}/data/prices.json`);
    expect(res.status).toBe(200);
    const payload = (await res.json()) as { items?: unknown[] };
    expect(payload.items?.length).toBeGreaterThan(0);
  });
});