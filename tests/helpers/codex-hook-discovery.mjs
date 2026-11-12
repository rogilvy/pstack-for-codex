import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

export async function discoverHooks(binary, { cwd, env }) {
  const child = spawn(binary, [
    "--disable", "plugin_discovery_prefetch",
    "--disable", "remote_plugin",
    "app-server", "--stdio",
  ], { cwd, env, stdio: ["pipe", "pipe", "pipe"] });
  const lines = createInterface({ input: child.stdout });
  const pending = new Map();
  let nextId = 1;
  let stderr = "";
  child.stderr.on("data", (data) => { stderr = (stderr + data).slice(-16384); });
  const fail = (error) => {
    for (const request of pending.values()) request.reject(error);
    pending.clear();
  };
  child.on("error", fail);
  child.stdin.on("error", fail);
  child.on("exit", (code, signal) => fail(new Error(`Codex app-server exited (${code ?? signal}): ${stderr}`)));
  lines.on("line", (line) => {
    let response;
    try { response = JSON.parse(line); }
    catch (error) { fail(error); return; }
    const request = pending.get(response.id);
    if (!request) return;
    pending.delete(response.id);
    if (response.error) request.reject(new Error(JSON.stringify(response.error)));
    else request.resolve(response.result);
  });
  const request = (method, params) => new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timed out waiting for ${method}: ${stderr}`));
    }, 15000);
    pending.set(id, {
      resolve: (result) => { clearTimeout(timer); resolve(result); },
      reject: (error) => { clearTimeout(timer); reject(error); },
    });
    child.stdin.write(`${JSON.stringify({ id, method, params })}\n`);
  });
  try {
    await request("initialize", {
      clientInfo: { name: "pstack-installed-smoke", version: "1.0" },
      capabilities: { experimentalApi: true },
    });
    child.stdin.write(`${JSON.stringify({ method: "initialized", params: {} })}\n`);
    return await request("hooks/list", { cwds: [cwd] });
  } finally {
    lines.close();
    if (child.pid !== undefined && child.exitCode === null && child.signalCode === null) {
      const exited = new Promise((resolve) => child.once("exit", resolve));
      child.kill();
      const kill = setTimeout(() => child.kill("SIGKILL"), 3000);
      await exited;
      clearTimeout(kill);
    }
  }
}
