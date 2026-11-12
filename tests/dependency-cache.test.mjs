import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bootstrap = pathToFileURL(join(root, "skills/poteto-mode/scripts/bootstrap.ts")).href;

function fixture(context) {
  const directory = mkdtempSync(join(tmpdir(), "pstack-dependency-cache-"));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const scripts = join(directory, "plugin/skills/poteto-mode/scripts");
  const bin = join(directory, "bin");
  const cache = join(directory, "cache with spaces");
  const log = join(directory, "calls.jsonl");
  mkdirSync(scripts, { recursive: true });
  mkdirSync(bin);
  writeFileSync(join(scripts, "package.json"), '{"dependencies":{"commander":"14.0.0"}}\n');
  writeFileSync(join(scripts, "bun.lock"), '{"lockfileVersion":1}\n');
  const bun = join(bin, "bun");
  writeFileSync(bun, `#!${process.execPath}
const fs = require("node:fs");
const path = require("node:path");
const args = process.argv.slice(2);
if (args[0] === "--version") { console.log("1.4.0"); process.exit(0); }
fs.appendFileSync(process.env.TEST_LOG, JSON.stringify({ args, cwd: process.cwd(), nodePath: process.env.NODE_PATH }) + "\\n");
if (args[0] === "install") {
  if (process.env.TEST_INSTALL_FAIL === "1") process.exit(42);
  if (process.env.TEST_INSTALL_DELAY === "1") Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150);
  const modules = path.join(process.cwd(), "node_modules");
  fs.mkdirSync(path.join(modules, "commander"), { recursive: true });
  fs.writeFileSync(path.join(modules, "commander", "package.json"), '{"version":"14.0.0"}');
}
process.exit(args[0] === "install" ? 0 : Number(process.env.TEST_EXIT || 0));
`);
  chmodSync(bun, 0o755);
  const env = { ...process.env, PATH: bin, XDG_CACHE_HOME: cache, TEST_LOG: log, NODE_PATH: join(directory, "existing modules") };
  const args = ["--input-type=module", "--eval", `import { ensureDependenciesInstalled } from ${JSON.stringify(bootstrap)}; ensureDependenciesInstalled({ scriptsDirectory: ${JSON.stringify(scripts)} });`, "--", "--status-only"];
  function run(overrides = {}) {
    return spawnSync(process.execPath, args, {
      cwd: directory, env: { ...env, ...overrides }, encoding: "utf8",
    });
  }
  function runAsync(overrides = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, args, { cwd: directory, env: { ...env, ...overrides } });
      let stderr = "";
      child.stdout.resume();
      child.stderr.on("data", (data) => { stderr += data; });
      child.on("error", reject);
      child.on("close", (status) => resolve({ status, stderr }));
    });
  }
  const calls = () => existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").map(JSON.parse) : [];
  return { directory, scripts, cache, env, run, runAsync, calls };
}

function snapshot(directory) {
  return readdirSync(directory, { recursive: true, withFileTypes: true }).map((entry) => {
    const absolute = join(entry.parentPath, entry.name);
    return [absolute.slice(directory.length), entry.isSymbolicLink() ? "symlink" : entry.isDirectory() ? "directory" : createHash("sha256").update(readFileSync(absolute)).digest("hex")];
  });
}

test("bootstrap caches dependencies outside the plugin and preserves launcher context", (context) => {
  const f = fixture(context);
  const before = snapshot(join(f.directory, "plugin"));
  const result = f.run({ TEST_EXIT: "17" });
  assert.equal(result.status, 17, result.stderr);
  assert.deepEqual(snapshot(join(f.directory, "plugin")), before);
  const [install, restart] = f.calls();
  assert.deepEqual(install.args, ["install", "--frozen-lockfile", "--production", "--ignore-scripts"]);
  assert.ok(install.cwd.startsWith(f.cache + "/"));
  assert.equal(restart.cwd, f.directory);
  assert.deepEqual(restart.args, ["--status-only"]);
  const [modules, existing] = restart.nodePath.split(delimiter);
  assert.ok(modules.startsWith(f.cache + "/"));
  assert.equal(existsSync(join(modules, "commander/package.json")), true);
  assert.equal(existing, f.env.NODE_PATH);
  assert.equal(f.run({ NODE_PATH: restart.nodePath }).status, 0);
  assert.equal(f.calls().length, 2, "a warmed runtime neither installs nor restarts");
});

test("lock changes get a fresh cache without modifying a prior generation", (context) => {
  const f = fixture(context);
  assert.equal(f.run().status, 0);
  const firstModules = f.calls()[1].nodePath.split(delimiter)[0];
  const before = snapshot(firstModules);
  writeFileSync(join(f.scripts, "bun.lock"), '{"lockfileVersion":2}\n');
  assert.equal(f.run().status, 0);
  const secondModules = f.calls()[3].nodePath.split(delimiter)[0];
  assert.notEqual(firstModules, secondModules);
  assert.deepEqual(snapshot(firstModules), before);
});

test("failed installs leave no usable cache and can be retried", (context) => {
  const f = fixture(context);
  const result = f.run({ TEST_INSTALL_FAIL: "1" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /exited with status 42/);
  assert.equal(snapshot(f.cache).some(([name]) => name.includes(".install-")), false);
  assert.equal(existsSync(join(f.scripts, "node_modules")), false);
  assert.equal(f.run().status, 0);
  assert.equal(f.calls().filter((call) => call.args[0] === "install").length, 2);
});

test("a cache inside the plugin is rejected before writing", (context) => {
  const f = fixture(context);
  const plugin = join(f.directory, "plugin");
  const before = snapshot(plugin);
  const result = f.run({ XDG_CACHE_HOME: join(plugin, "mutable") });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /outside the plugin/);
  assert.deepEqual(snapshot(plugin), before);
});


test("concurrent cold launches share a complete cache and clean up staging", async (context) => {
  const f = fixture(context);
  const results = await Promise.all([f.runAsync({ TEST_INSTALL_DELAY: "1" }), f.runAsync({ TEST_INSTALL_DELAY: "1" })]);
  for (const result of results) assert.equal(result.status, 0, result.stderr);
  const restarts = f.calls().filter((call) => call.args[0] !== "install");
  assert.equal(restarts.length, 2);
  const callsBeforeReuse = f.calls().length;
  for (const restart of restarts) {
    assert.equal(existsSync(join(restart.nodePath.split(delimiter)[0], "commander/package.json")), true);
    assert.equal(f.run({ NODE_PATH: restart.nodePath }).status, 0);
  }
  assert.equal(f.calls().length, callsBeforeReuse, "each concurrent runtime reuses its completed generation");
  assert.equal(snapshot(f.cache).some(([name]) => name.includes(".install-")), false);
});

test("a cache symlink into the plugin is rejected before writing", (context) => {
  const f = fixture(context);
  const plugin = join(f.directory, "plugin");
  symlinkSync(plugin, f.cache, "dir");
  const before = snapshot(plugin);
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /outside the plugin/);
  assert.deepEqual(snapshot(plugin), before);
});

test("relative XDG cache paths fall back to the user's home", (context) => {
  const f = fixture(context);
  const home = join(f.directory, "home");
  const result = f.run({ XDG_CACHE_HOME: "relative-cache", HOME: home });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(f.calls()[0].cwd.startsWith(join(home, ".cache") + "/"));
});


for (const damage of ["missing receipt", "stale receipt", "missing package"]) {
  test(`bootstrap recovers from a ${damage} without replacing the old generation`, (context) => {
    const f = fixture(context);
    assert.equal(f.run().status, 0);
    const oldModules = f.calls()[1].nodePath.split(delimiter)[0];
    const receipt = join(oldModules, ".poteto-mode-tools-install-key");
    if (damage === "missing receipt") rmSync(receipt);
    else if (damage === "stale receipt") writeFileSync(receipt, "stale");
    else rmSync(join(oldModules, "commander/package.json"));
    const before = snapshot(oldModules);
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    const newModules = f.calls()[3].nodePath.split(delimiter)[0];
    assert.notEqual(oldModules, newModules);
    assert.deepEqual(snapshot(oldModules), before);
    assert.equal(f.run({ NODE_PATH: newModules }).status, 0);
    assert.equal(f.calls().length, 4);
  });
}
