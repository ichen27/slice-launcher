import { describe, expect, it } from "vitest";
import { applyCommand, effectivePermissions, enroll, emptyState, memberView } from "./domain";

const ownerIdentity = { subject: "owner-sub", email: "owner@example.test" };
const person = { subject: "person-sub", email: "person@example.test" };
const meta = { id: "event-1", now: "2026-10-04T12:00:00Z" };
function setup() {
  const state = emptyState(ownerIdentity.email);
  return enroll(state, ownerIdentity, meta).state;
}
function run(state: ReturnType<typeof setup>, command: unknown, actor = "owner-sub") {
  return applyCommand(state, actor, command, { ...meta, id: crypto.randomUUID() }).state;
}
describe("membership authorization", () => {
  it("never makes an unknown first visitor owner; pending users see only themselves", () => {
    const result = enroll(emptyState(ownerIdentity.email), person, meta);
    expect(result.state.members[0]).toMatchObject({ status: "pending", owner: false });
    expect(memberView(result.state, person.subject).members).toEqual([]);
    expect(() =>
      run(
        result.state,
        { type: "level.save", name: "Admin", permissions: ["members.manage"] },
        person.subject,
      ),
    ).toThrow();
  });
  it("binds an invitation only to the verified email and does not duplicate sign-ins", () => {
    let s = run(setup(), {
      type: "member.add",
      email: person.email.toUpperCase(),
      name: "Person",
      levelId: "member",
    });
    const invitedId = s.members.find((m) => m.email === person.email)!.id;
    s = enroll(s, person, { ...meta, id: crypto.randomUUID() }).state;
    expect(s.members.find((m) => m.id === invitedId)).toMatchObject({
      subject: person.subject,
      status: "active",
    });
    expect(enroll(s, person, { ...meta, id: crypto.randomUUID() }).state.members).toHaveLength(2);
    expect(() => enroll(s, { ...person, subject: "different-sub" }, meta)).toThrow();
  });
  it("supports custom levels and individual deny overrides", () => {
    let s = setup();
    s = run(s, { type: "level.save", name: "Directory reader", permissions: ["members.read"] });
    const role = s.levels.find((r) => r.name === "Directory reader")!;
    s = enroll(s, person, { ...meta, id: crypto.randomUUID() }).state;
    const id = s.members.find((m) => m.subject === person.subject)!.id;
    s = run(s, {
      type: "member.update",
      id,
      status: "active",
      levelId: role.id,
      allow: [],
      deny: ["members.read"],
      owner: false,
    });
    expect(
      effectivePermissions(
        s,
        s.members.find((m) => m.id === id)!,
      ),
    ).toEqual([]);
    expect(memberView(s, person.subject).members).toEqual([]);
  });
  it("suspension removes access immediately even for an existing identity", () => {
    let s = run(setup(), {
      type: "member.add",
      email: person.email,
      name: "Person",
      levelId: "member",
    });
    s = enroll(s, person, { ...meta, id: crypto.randomUUID() }).state;
    const target = s.members.find((m) => m.subject === person.subject)!;
    s = run(s, {
      type: "member.update",
      id: target.id,
      status: "suspended",
      levelId: "member",
      allow: [],
      deny: [],
      owner: false,
    });
    expect(
      effectivePermissions(
        s,
        s.members.find((m) => m.id === target.id)!,
      ),
    ).toEqual([]);
    expect(
      enroll(s, person, { ...meta, id: crypto.randomUUID() }).state.members.find(
        (m) => m.id === target.id,
      )!.status,
    ).toBe("suspended");
  });
  it("protects the last owner", () => {
    const s = setup();
    expect(() =>
      run(s, {
        type: "member.update",
        id: s.members[0].id,
        status: "suspended",
        levelId: "member",
        allow: [],
        deny: [],
        owner: false,
      }),
    ).toThrow(/owner/i);
  });
  it("rejects self escalation, delegation above authority, and own-role editing", () => {
    let s = run(setup(), {
      type: "level.save",
      name: "Limited admin",
      permissions: ["members.manage", "levels.manage", "members.read"],
    });
    const role = s.levels.find((r) => r.name === "Limited admin")!;
    s = run(s, { type: "member.add", email: person.email, name: "Person", levelId: role.id });
    s = enroll(s, person, { ...meta, id: crypto.randomUUID() }).state;
    const id = s.members.find((m) => m.subject === person.subject)!.id;
    expect(() =>
      run(s, { type: "level.save", name: "Elevated", permissions: ["audit.read"] }, person.subject),
    ).toThrow();
    expect(() =>
      run(s, { type: "level.save", id: role.id, name: role.name, permissions: [] }, person.subject),
    ).toThrow();
    expect(() =>
      run(
        s,
        {
          type: "member.update",
          id,
          status: "active",
          levelId: role.id,
          allow: [],
          deny: [],
          owner: true,
        },
        person.subject,
      ),
    ).toThrow();
  });
  it("validates commands, restricts profile fields, and audits before/after", () => {
    const s = setup();
    expect(() =>
      run(s, { type: "profile.update", name: "Name", title: "", owner: true }),
    ).toThrow();
    const updated = applyCommand(
      s,
      ownerIdentity.subject,
      { type: "profile.update", name: "New name", title: "Project manager" },
      meta,
    );
    expect(updated.state.members[0].name).toBe("New name");
    expect(updated.audit).toMatchObject({ actorId: s.members[0].id, action: "profile.update" });
    expect(updated.audit.before).not.toEqual(updated.audit.after);
  });
  it("keeps directory email and administrative fields private", () => {
    let s = run(setup(), {
      type: "member.add",
      email: person.email,
      name: "Person",
      levelId: "member",
    });
    s = enroll(s, person, { ...meta, id: crypto.randomUUID() }).state;
    const view = memberView(s, person.subject);
    expect(view.members).toHaveLength(2);
    expect(view.members[0]).not.toHaveProperty("email");
    expect(view.members[0]).not.toHaveProperty("allow");
    expect(view.levels).toEqual([]);
  });
});
