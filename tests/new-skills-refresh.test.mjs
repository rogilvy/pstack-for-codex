import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skills = ["statechart", "create-formal-verification-skill", "maintain-formal-verification-skill", "ketchup-video"];
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("new upstream skills retain explicit-only Codex discovery and bounded authority", () => {
  for (const name of skills) {
    const body = read(`skills/${name}/SKILL.md`);
    const metadata = read(`skills/${name}/agents/openai.yaml`);
    assert.match(body, new RegExp(`name: ${name}\\n`));
    assert.ok(`pstack-for-codex:${name}`.length <= 64);
    assert.match(metadata, /allow_implicit_invocation: false/);
    assert.match(metadata, /- CODEX/);
    assert.ok(metadata.includes(`$${name}`));
    assert.doesNotMatch(body, /disable-model-invocation|\.cursor\//);
    assert.match(body, /codex-agent-runtime\.md/);
    assert.match(body, /sequential-parent/);
  }
});

test("generated verification skills preserve discovery, scratch isolation, and honest failures", () => {
  const create = read("skills/create-formal-verification-skill/SKILL.md");
  const maintain = read("skills/maintain-formal-verification-skill/SKILL.md");
  assert.match(create, /\.agents\/skills\/verify-<area>\/SKILL\.md/);
  assert.match(create, /agents\/openai\.yaml/);
  assert.match(create, /allow_implicit_invocation: false/);
  for (const body of [create, maintain]) {
    assert.match(body, /isolated scratch copy or exclusive worktree/);
    assert.match(body, /do not weaken/i);
    assert.match(body, /sync commit/);
  }
  assert.match(read("skills/ketchup-video/SKILL.md"), /partial-result/);
  assert.match(read("skills/ketchup-video/SKILL.md"), /never private host storage/);
});

test("statechart missing tools fail closed without invoking mise install", (context) => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "statechart-no-install-"));
  context.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const log = path.join(temporary, "mise.log");
  const mise = path.join(temporary, "mise");
  fs.writeFileSync(mise, '#!/bin/sh\nprintf "%s\\n" "$*" >> "$STATECHART_TEST_LOG"\nexit 1\n', { mode: 0o755 });
  const env = { ...process.env, PATH: `${temporary}${path.delimiter}${process.env.PATH}`, STATECHART_TEST_LOG: log };
  delete env.TLA2TOOLS;
  delete env.STATECHART_ALLOW_INSTALL;
  const module = path.join(root, "skills/statechart/scripts/run.ts");
  const fixture = path.join(root, "skills/statechart/scripts/test/corpus/Login/Login");
  const script = `import { check } from ${JSON.stringify(module)}; await check(${JSON.stringify(fixture + ".tla")}, ${JSON.stringify(fixture + ".cfg")});`;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], { env, encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Automatic installation is disabled/);
  const calls = fs.readFileSync(log, "utf8");
  assert.match(calls, /where/);
  assert.match(calls, /which java/);
  assert.doesNotMatch(calls, /^install\b/m);
});

test("statechart retains compiler, launcher, bounded runs, and replay corpus", () => {
  for (const relative of ["scripts/statechart", "scripts/statechart.ts", "scripts/pipeline.ts", "scripts/worker.ts", "scripts/test/corpus/Login/chart.mmd", "references/render.md"]) {
    assert.ok(fs.statSync(path.join(root, "skills/statechart", relative)).isFile(), relative);
  }
  const runner = read("skills/statechart/scripts/run.ts");
  assert.match(runner, /936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88/);
  assert.match(runner, /RERUN_STATES/);
  assert.match(read("skills/statechart/SKILL.md"), /executable local code, not inert data/);
  assert.match(read("skills/statechart/scripts/test/render.test.ts"), /STATECHART_ALLOW_INSTALL/);
});


test("statechart development checks have pinned, reproducible dependencies", () => {
  const pkg = JSON.parse(read("skills/statechart/scripts/package.json"));
  assert.equal(pkg.scripts.typecheck, "tsc --project tsconfig.json");
  assert.deepEqual(pkg.devDependencies, { "fast-check": "4.5.3", "@types/node": "24.10.0", "typescript": "5.9.3" });
  const lock = read("skills/statechart/scripts/bun.lock");
  for (const [name, version] of Object.entries(pkg.devDependencies)) assert.ok(lock.includes(`${name}@${version}`));
});
