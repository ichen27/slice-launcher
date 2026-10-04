import { afterEach, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { Repository } from "./repository";
import { membershipRequest, errorResponse } from "./api";
import type { View, Member } from "./contracts";
const instances: Miniflare[] = [];
afterEach(async () => {
  await Promise.all(instances.splice(0).map((m) => m.dispose()));
});
it("runs onboarding, approval, privacy checks and revocation against D1", async () => {
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
  for (const statement of (
    await readFile(new URL("../../migrations/0001_membership.sql", import.meta.url), "utf8")
  )
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean))
    await db.prepare(statement).run();
  await db
    .prepare("UPDATE organization SET owner_email = 'owner@example.test' WHERE id = 'slice'")
    .run();
  const repo = new Repository(db);
  const owner = { subject: "owner", email: "owner@example.test" };
  const person = { subject: "person", email: "person@example.test" };
  const call = async (identity: typeof owner, body?: unknown, query = "") => {
    const req = new Request(
      `https://slice.example/api/membership${query}`,
      body
        ? {
            method: "POST",
            headers: { origin: "https://slice.example", "content-type": "application/json" },
            body: JSON.stringify(body),
          }
        : {},
    );
    try {
      return await membershipRequest(req, identity, repo);
    } catch (e) {
      return errorResponse(e);
    }
  };
  expect(await (await call(person)).json()).toEqual({ needsEnrollment: true });
  let pending = (await (await call(person, { command: { type: "join" } })).json()) as View;
  expect(pending.me.status).toBe("pending");
  expect(pending.members).toEqual([]);
  expect((await call(person, undefined, "?view=history")).status).toBe(403);
  expect(
    (
      await call(person, {
        revision: pending.revision,
        command: {
          type: "member.add",
          name: "Other",
          email: "other@example.test",
          levelId: "member",
        },
      })
    ).status,
  ).toBe(403);
  const admin = (await (await call(owner, { command: { type: "join" } })).json()) as View;
  const approve = {
    type: "member.update",
    id: pending.me.id,
    status: "active",
    levelId: "member",
    owner: false,
    allow: [],
    deny: [],
  };
  expect((await call(owner, { revision: pending.revision, command: approve })).status).toBe(409);
  let current = (await (
    await call(owner, { revision: admin.revision, command: approve })
  ).json()) as View;
  pending = (await (await call(person)).json()) as View;
  expect(pending.me.status).toBe("active");
  expect(pending.members[0]).not.toHaveProperty("email");
  current = (await (
    await call(owner, { revision: current.revision, command: { ...approve, status: "suspended" } })
  ).json()) as View;
  expect((current.members.find((m) => m.id === pending.me.id) as Member).status).toBe("suspended");
  expect(((await (await call(person)).json()) as View).permissions).toEqual([]);
  expect(
    (
      await call(person, {
        revision: current.revision,
        command: { type: "profile.update", name: "Changed", title: "" },
      })
    ).status,
  ).toBe(403);
  expect(await (await call({ ...person, email: "other@example.test" })).json()).toHaveProperty(
    "error",
  );
});
