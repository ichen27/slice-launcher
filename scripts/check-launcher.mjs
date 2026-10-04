import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import process from "node:process";
import console from "node:console";
import { pathToFileURL } from "node:url";

export async function checkLauncher(baseUrl, { signal } = {}) {
  const base = new URL(baseUrl);
  const request = (path) =>
    fetch(new URL(path, base), {
      redirect: "error",
      signal: AbortSignal.any([AbortSignal.timeout(5000), ...(signal ? [signal] : [])]),
      headers: { "User-Agent": "slice-launcher-smoke/1.0" },
    });

  const deadline = Date.now() + 30000;
  while (true) {
    try {
      const health = await request("/api/health");
      assert.equal(health.status, 200, "Health endpoint must return 200");
      assert.deepEqual(await health.json(), { status: "ok" });
      break;
    } catch (error) {
      if (signal?.aborted || Date.now() >= deadline) throw error;
      await delay(500, undefined, { signal });
    }
  }

  const page = await request("/");
  assert.equal(page.status, 200, "Launcher page must return 200");
  assert.match(page.headers.get("content-type") ?? "", /text\/html/);
  const html = await page.text();
  assert.match(html, /App Launcher/);

  const assets = new Map();
  for (const tag of html.matchAll(/<(?:link|script)\b[^>]*>/g)) {
    const url = tag[0].match(/(?:href|src)="([^"]+)"/)?.[1];
    if (!url || !url.startsWith("/") || url.startsWith("//")) continue;
    if (tag[0].startsWith("<link") && /rel="stylesheet"/.test(tag[0])) assets.set(url, "text/css");
    if (tag[0].startsWith("<script") && /\bsrc=/.test(tag[0])) assets.set(url, "javascript");
  }
  assert.ok([...assets.values()].includes("text/css"), "Page must reference a stylesheet");
  assert.ok([...assets.values()].includes("javascript"), "Page must reference its JavaScript");
  for (const [url, type] of assets) {
    const response = await request(url);
    assert.equal(response.status, 200, `Asset failed: ${url}`);
    assert.ok(
      (response.headers.get("content-type") ?? "").includes(type),
      `Wrong asset type: ${url}`,
    );
    assert.ok((await response.text()).length > 0, `Empty asset: ${url}`);
  }
  console.log(
    `Launcher page, health endpoint, and ${assets.size} assets passed at ${base.origin}.`,
  );
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  assert.ok(process.argv[2], "Usage: node scripts/check-launcher.mjs <base-url>");
  await checkLauncher(process.argv[2]);
}
