import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { test } from "node:test";
import { checkLauncher } from "./check-launcher.mjs";

async function serve(t, missingAsset = false) {
  const server = createServer((request, response) => {
    const routes = {
      "/api/health": ["application/json", '{"status":"ok"}'],
      "/": [
        "text/html",
        '<h1>App Launcher</h1><link rel="stylesheet" href="/app.css"><script src="/app.js"></script>',
      ],
      "/app.css": ["text/css", "body { color: black; }"],
      "/app.js": ["text/javascript", "void 0;"],
    };
    const route = routes[request.url];
    if (!route || (missingAsset && request.url === "/app.js")) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.setHeader("content-type", route[0]);
    response.end(route[1]);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test("checks the served launcher and its stylesheet and JavaScript", async (t) => {
  await checkLauncher(await serve(t));
});

test("fails a release when health works but a page asset is missing", async (t) => {
  await assert.rejects(checkLauncher(await serve(t, true)), /Asset failed/);
});
