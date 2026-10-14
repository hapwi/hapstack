#!/usr/bin/env bun
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
if (args[0] === "install") args.shift();

const help = `Hapstack installer

  bunx github:hapwi/hapstack

Installs the full skill set globally for Codex and Claude Code.
Existing same-name skills are backed up before installation.

Options:
  --project          Install into the current project instead of globally
  --agent NAME       Select codex, claude-code, or cursor; repeat for multiple
  --list             List bundled skills without installing or backing up
  --yes              Accept the skills installer's prompts
  --backup-dir PATH  Choose a private directory for backups
  --help             Show this help
`;

let project = false;
let list = false;
let yes = false;
let backupBase;
const agents = [];

function fail(message) {
  console.error(message);
  process.exit(1);
}

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--help" || arg === "-h") {
    console.log(help);
    process.exit(0);
  }
  if (arg === "--project") project = true;
  else if (arg === "--list") list = true;
  else if (arg === "--yes" || arg === "-y") yes = true;
  else if (arg === "--agent" || arg === "--backup-dir") {
    const value = args[++i];
    if (!value || value.startsWith("--")) fail(`${arg} requires a value.`);
    if (arg === "--agent") {
      if (!["codex", "claude-code", "cursor"].includes(value)) fail(`Unsupported agent: ${value}`);
      agents.push(value);
    } else backupBase = resolve(value);
  } else fail(`Unknown option: ${arg}\nRun with --help for usage.`);
}

const selectedAgents = [...new Set(agents.length ? agents : ["codex", "claude-code"])];
const skillNames = readdirSync(join(packageRoot, "skills"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(packageRoot, "skills", entry.name, "SKILL.md")))
  .map((entry) => entry.name);

let backupDirectory;
if (!list) {
  const installBase = project ? process.cwd() : homedir();
  const directories = { codex: ".agents", "claude-code": ".claude", cursor: ".cursor" };
  const roots = [...new Set([".agents", ...selectedAgents.map((agent) => directories[agent])])];
  const existing = roots.flatMap((directory) => skillNames
    .map((name) => ({ directory, name, path: join(installBase, directory, "skills", name) }))
    .filter((entry) => existsSync(entry.path)));

  if (existing.length) {
    const stateBase = process.env.XDG_STATE_HOME || join(homedir(), ".local", "state");
    const backups = backupBase || join(stateBase, "hapstack", "backups");
    const candidateBackup = resolve(backups);
    for (const entry of existing) {
      const source = resolve(entry.path);
      if (candidateBackup === source || candidateBackup.startsWith(source + "/") || candidateBackup.startsWith(source + "\\")) {
        fail("The backup directory must not be inside a skill being replaced.");
      }
    }
    mkdirSync(backups, { recursive: true });
    backupDirectory = mkdtempSync(join(backups, project ? "project-" : "global-"));
    for (const entry of existing) {
      const target = join(backupDirectory, entry.directory, "skills", entry.name);
      mkdirSync(dirname(target), { recursive: true });
      cpSync(entry.path, target, { recursive: true, dereference: true, errorOnExist: true, force: false });
    }
    console.log(`Backed up ${existing.length} existing skill directories to ${backupDirectory}`);
  }
}

const installArgs = ["skills", "add", "hapwi/hapstack", "--skill", "*", "--copy"];
if (list) installArgs.push("--list");
else {
  if (!project) installArgs.push("-g");
  for (const agent of selectedAgents) installArgs.push("-a", agent);
  if (yes) installArgs.push("--yes");
}
const result = spawnSync("bunx", installArgs, { stdio: "inherit" });
if (result.error) fail(`Could not run the skills installer: ${result.error.message}`);
if (result.status !== 0) {
  if (backupDirectory) console.error(`Installation did not finish. Original skills remain backed up at ${backupDirectory}`);
  process.exit(result.status ?? 1);
}
if (!list) console.log("Hapstack installed. Start a new agent session, then run setup-hapstack.");
