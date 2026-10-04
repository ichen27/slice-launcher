import { afterEach, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { Repository } from "./repository";
import { applyCommand, enroll } from "./domain";
const instances: Miniflare[] = [];
afterEach(async () => {
  await Promise.all(instances.splice(0).map((m) => m.dispose()));
});
async function setup() {
  const mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: "export default { fetch() { return new Response('ok') } }",
      compatibilityDate: "2026-10-02",
      d1Databases: ["DB"],
    }),
  );
  instances.push(mf);
  const db = await mf.getD1Database("DB");
  const sql = await readFile(
    new URL("../../migrations/0001_membership.sql", import.meta.url),
    "utf8",
  );
  for (const stmt of sql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean))
    await db.prepare(stmt).run();
  await db
    .prepare("UPDATE organization SET owner_email = ? WHERE id = 'slice'")
    .bind("owner@example.test")
    .run();
  const repo = new Repository(db);
  const initial = await repo.load();
  const first = enroll(
    initial,
    { subject: "owner", email: "owner@example.test" },
    { id: "owner-member", now: new Date().toISOString() },
  );
  if (!first.audit) throw new Error("Expected enrollment");
  await repo.commit(initial, { ...first, audit: first.audit });
  return { repo, db };
}
it("persists members and their audit record together", async () => {
  const { repo } = await setup();
  const state = await repo.load();
  expect(state.ownerClaimed).toBe(true);
  expect(state.members[0].owner).toBe(true);
  expect(await repo.history()).toHaveLength(1);
});
it("rejects stale mutations and rolls back every write and audit", async () => {
  const { repo, db } = await setup();
  const before = await repo.load();
  const first = applyCommand(
    before,
    "owner",
    { type: "level.save", name: "One", permissions: [] },
    { id: "one", now: "now" },
  );
  const second = applyCommand(
    before,
    "owner",
    { type: "level.save", name: "Two", permissions: [] },
    { id: "two", now: "now" },
  );
  await repo.commit(before, first);
  await expect(repo.commit(before, second)).rejects.toMatchObject({ status: 409 });
  expect((await repo.load()).levels.map((r) => r.name)).toEqual(["Member", "One"]);
  expect(await repo.history()).toHaveLength(2);
  expect(await db.prepare("SELECT COUNT(*) as count FROM mutation_guard").first("count")).toBe(0);
});
