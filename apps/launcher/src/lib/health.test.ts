import { expect, it } from "vitest";
import { GET } from "../../app/api/health/route";

it("returns a public-safe health response", async () => {
  const response = GET();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});
