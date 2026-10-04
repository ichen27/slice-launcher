import assert from "node:assert/strict";
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import process from "node:process";

const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
export function validateDeployment(deployment, expectedVersion) {
  assert.match(deployment.id, uuid, "Invalid deployment ID");
  assert.equal(deployment.versions?.length, 1, "Expected one fully deployed version");
  const version = deployment.versions[0];
  assert.match(version.version_id, uuid, "Invalid Worker version");
  assert.equal(version.percentage, 100, "Expected 100 percent traffic");
  if (expectedVersion)
    assert.equal(version.version_id, expectedVersion, "Unexpected active Worker version");
  return version.version_id;
}
export function validateVerifiedRelease(record, run) {
  assert.equal(run.conclusion, "success", "Only successful release runs may be restored");
  assert.equal(run.status, "completed");
  assert.equal(run.path, ".github/workflows/deploy-launcher.yml");
  assert.equal(run.head_branch, "main");
  assert.ok(["push", "workflow_dispatch"].includes(run.event));
  assert.equal(record.runId, String(run.id));
  assert.equal(record.source, run.head_sha);
  assert.equal(record.schema, 1);
  assert.equal(record.worker, "slice-launcher");
  assert.equal(record.verified, true);
  assert.match(record.source, /^[0-9a-f]{40}$/);
  assert.match(record.digest, /^[0-9a-f]{64}$/);
  assert.match(record.artifactId, /^[1-9][0-9]*$/);
  assert.match(record.artifactDigest, /^[0-9a-f]{64}$/);
  assert.match(record.version, uuid);
  assert.match(record.deployment, uuid);
  return record;
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const [mode] = process.argv.slice(2);
  if (mode === "record") {
    const manifest = JSON.parse(await readFile("release-manifest.json", "utf8"));
    const deployment = JSON.parse(await readFile("deployment.json", "utf8"));
    const output = (await readFile("wrangler-output.ndjson", "utf8"))
      .trim()
      .split("\n")
      .map(JSON.parse);
    const deployed = output
      .filter((row) => row.type === "deploy" && row.worker_name === "slice-launcher")
      .at(-1);
    assert.ok(deployed, "Missing Wrangler deploy record");
    const version = validateDeployment(deployment, deployed.version_id);
    assert.equal(manifest.source, process.env.GITHUB_SHA);
    await writeFile(
      "verified-release.json",
      JSON.stringify(
        {
          schema: 1,
          worker: "slice-launcher",
          verified: true,
          source: manifest.source,
          digest: manifest.digest,
          runId: process.env.GITHUB_RUN_ID,
          artifactId: process.env.RELEASE_ARTIFACT_ID,
          artifactDigest: process.env.RELEASE_ARTIFACT_DIGEST,
          version,
          deployment: deployment.id,
          verifiedAt: new Date().toISOString(),
        },
        null,
        2,
      ) + "\n",
    );
  } else if (mode === "rollback-target") {
    const record = validateVerifiedRelease(
      JSON.parse(await readFile("verified-release.json", "utf8")),
      JSON.parse(await readFile("verified-run.json", "utf8")),
    );
    await appendFile(
      process.env.GITHUB_OUTPUT,
      "version=" + record.version + "\nsource=" + record.source + "\n",
    );
  } else if (mode === "check-rollback") {
    validateDeployment(
      JSON.parse(await readFile("deployment.json", "utf8")),
      process.env.EXPECTED_VERSION,
    );
  } else throw new Error("Unknown provenance operation");
}
