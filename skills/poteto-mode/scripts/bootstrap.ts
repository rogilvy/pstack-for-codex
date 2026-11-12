import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  realpathSync, renameSync, rmSync, writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, delimiter, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const defaultScriptsDirectory = dirname(fileURLToPath(import.meta.url));

export interface DependencyBootstrapOptions {
  readonly scriptsDirectory?: string;
  readonly env?: NodeJS.ProcessEnv;
}

function runBun(
  bun: string,
  args: readonly string[],
  options: {
    readonly cwd?: string;
    readonly env: NodeJS.ProcessEnv;
    readonly stdio?: "pipe" | "inherit";
  }
): { readonly status: number | null; readonly stdout: string; readonly stderr: string } {
  try {
    if (options.stdio === "inherit") {
      execFileSync(bun, [...args], {
        cwd: options.cwd,
        env: options.env,
        stdio: "inherit",
      });
      return { status: 0, stdout: "", stderr: "" };
    }
    const stdout = execFileSync(bun, [...args], {
      cwd: options.cwd,
      env: options.env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout: stdout ?? "", stderr: "" };
  } catch (error) {
    const failure = error as {
      status?: number | null;
      stdout?: string | Buffer;
      stderr?: string | Buffer;
      message?: string;
    };
    if (options.stdio === "inherit") {
      return { status: failure.status ?? 1, stdout: "", stderr: "" };
    }
    return {
      status: failure.status ?? 1,
      stdout: String(failure.stdout ?? ""),
      stderr: String(failure.stderr ?? failure.message ?? ""),
    };
  }
}

function resolveBunExecutable(env: NodeJS.ProcessEnv): string {
  const executable = basename(process.execPath).toLowerCase();
  const candidate = executable === "bun" || executable === "bun.exe"
    ? process.execPath
    : "bun";
  const probe = runBun(candidate, ["--version"], { env, stdio: "pipe" });
  if (probe.status !== 0) {
    throw new Error(
      "Bun is required to run pstack-for-codex tools. Install Bun and retry."
    );
  }
  return candidate;
}

function currentInstallKey(scriptsDirectory: string): string {
  return createHash("sha256")
    .update(readFileSync(join(scriptsDirectory, "package.json")))
    .update("\0")
    .update(readFileSync(join(scriptsDirectory, "bun.lock")))
    .digest("hex");
}

function canonicalPath(path: string): string {
  if (existsSync(path)) return realpathSync(path);
  return join(canonicalPath(dirname(path)), basename(path));
}

function dependencyCache(scriptsDirectory: string, env: NodeJS.ProcessEnv, installKey: string): string {
  const cacheHome = env.XDG_CACHE_HOME && isAbsolute(env.XDG_CACHE_HOME)
    ? env.XDG_CACHE_HOME
    : join(env.HOME || homedir(), ".cache");
  const cache = canonicalPath(resolve(cacheHome, "pstack-for-codex", "poteto-mode-tools", `${process.platform}-${process.arch}`, installKey));
  const plugin = canonicalPath(resolve(scriptsDirectory, "../../.."));
  const withinPlugin = relative(plugin, cache);
  if (withinPlugin === "" || (
    !isAbsolute(withinPlugin) && withinPlugin !== ".." && !withinPlugin.startsWith(`..${sep}`)
  )) {
    throw new Error("The dependency cache must be outside the plugin. Set XDG_CACHE_HOME to an external cache directory.");
  }
  return cache;
}

function isCompleteInstall(directory: string, installKey: string): boolean {
  const modules = join(directory, "node_modules");
  const receipt = join(modules, ".poteto-mode-tools-install-key");
  return existsSync(join(modules, "commander", "package.json")) &&
    existsSync(receipt) && readFileSync(receipt, "utf8").trim() === installKey;
}

function completeInstall(directory: string, installKey: string, preferredModules?: string): string | null {
  const preferred = preferredModules ? dirname(preferredModules) : null;
  if (preferred && dirname(preferred) === directory &&
    basename(preferred).startsWith("runtime-") && isCompleteInstall(preferred, installKey)) {
    return preferred;
  }
  if (!existsSync(directory)) return null;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith("runtime-")) continue;
    const candidate = join(directory, entry.name);
    if (isCompleteInstall(candidate, installKey)) return candidate;
  }
  return null;
}

export function ensureDependenciesInstalled(
  options: DependencyBootstrapOptions = {}
): void {
  const scriptsDirectory = options.scriptsDirectory ?? defaultScriptsDirectory;
  const env = options.env ?? process.env;
  const bun = resolveBunExecutable(env);
  const installKey = currentInstallKey(scriptsDirectory);
  const generations = dependencyCache(scriptsDirectory, env, installKey);
  const modulePaths = env.NODE_PATH?.split(delimiter).filter(Boolean) ?? [];
  let installDirectory = completeInstall(generations, installKey, modulePaths[0]);
  const wasInstalled = installDirectory !== null;

  if (!installDirectory) {
    mkdirSync(generations, { recursive: true });
    const staging = mkdtempSync(join(generations, ".install-"));
    try {
      for (const filename of ["package.json", "bun.lock"]) {
        writeFileSync(join(staging, filename), readFileSync(join(scriptsDirectory, filename)));
      }
      const result = runBun(bun, ["install", "--frozen-lockfile", "--production", "--ignore-scripts"], {
        cwd: staging,
        env,
        stdio: "pipe",
      });
      if (result.status !== 0) {
        process.stdout.write(result.stdout);
        process.stderr.write(result.stderr);
        throw new Error(`bun install --frozen-lockfile exited with status ${result.status ?? "unavailable"}`);
      }
      if (!existsSync(join(staging, "node_modules", "commander", "package.json"))) {
        throw new Error("bun install --frozen-lockfile completed without installing commander");
      }
      writeFileSync(join(staging, "node_modules", ".poteto-mode-tools-install-key"), `${installKey}\n`);
      installDirectory = completeInstall(generations, installKey);
      if (!installDirectory) {
        installDirectory = join(generations, `runtime-${basename(staging).slice(".install-".length)}`);
        renameSync(staging, installDirectory);
      }
    } finally {
      rmSync(staging, { recursive: true, force: true });
    }
  }

  const nodeModulesDirectory = join(installDirectory, "node_modules");
  if (wasInstalled && modulePaths[0] === nodeModulesDirectory) return;
  const restarted = runBun(bun, process.argv.slice(1), {
    cwd: process.cwd(),
    env: {
      ...env,
      NODE_PATH: [nodeModulesDirectory, ...modulePaths.filter((path) => path !== nodeModulesDirectory)].join(delimiter),
    },
    stdio: "inherit",
  });
  process.exit(restarted.status ?? 1);
}
