import assert from "node:assert/strict";
import test from "node:test";
import { discoverHooks } from "./helpers/codex-hook-discovery.mjs";

test("hook discovery reports a missing executable without hanging", { timeout: 2000 }, async () => {
  await assert.rejects(discoverHooks("pstack-missing-codex-executable", { cwd: process.cwd(), env: { PATH: "" } }), /ENOENT/);
});

test("hook discovery reports a runtime that exits before initialization", { timeout: 2000 }, async () => {
  await assert.rejects(discoverHooks(process.execPath, { cwd: process.cwd(), env: process.env }), /Codex app-server exited|EPIPE/);
});
