import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { CURRENT, PREVIOUS, hash, versionOf } from "./policy.mjs";

const script = fileURLToPath(new URL("./policy.mjs", import.meta.url));
const template = readFileSync(new URL("../assets/changelog-AGENTS.md", import.meta.url), "utf8");
const v3 = readFileSync(new URL("./fixtures/policy-v3.md", import.meta.url), "utf8");

function withAgents(content, check) {
	const dir = mkdtempSync(join(tmpdir(), "changelog-policy-"));
	const file = join(dir, "AGENTS.md");
	if (content !== null) writeFileSync(file, content);
	const run = (...args) => {
		const result = spawnSync(process.execPath, [script, file, ...args], { encoding: "utf8" });
		assert.equal(result.status, 0, result.stderr);
		return result.stdout.trim();
	};
	try { check({ file, run }); } finally { rmSync(dir, { recursive: true, force: true }); }
}

test("the template's version label, recorded hash, and history agree", () => {
	const message = "The changelog policy template changed. Bump its version label, move the old CURRENT hash into PREVIOUS, and record the new hash in CURRENT.";
	assert.equal(hash(template), CURRENT.hash, message);
	assert.equal(versionOf(template), CURRENT.version, message);
	assert.equal(Math.max(...PREVIOUS.values()), CURRENT.version - 1, message);
	assert(!PREVIOUS.has(CURRENT.hash), message);
	assert(template.includes(`Hapstack changelog policy, version ${CURRENT.version}.`), "The visible label must match the marker version.");
});

test("reports a missing policy without creating one", () => {
	withAgents(null, ({ run }) => assert.equal(run("--update"), "missing: no Hapstack changelog policy (latest is v4)"));
	withAgents("# Project rules\n", ({ file, run }) => {
		assert.match(run("--update"), /^missing/);
		assert.equal(readFileSync(file, "utf8"), "# Project rules\n");
	});
});

test("updates an untouched earlier block and keeps the rest of the file", () => {
	withAgents(`# Project rules\n\nUse tabs.\n\n${v3}\nMore rules.\n`, ({ file, run }) => {
		assert.equal(run(), "outdated: v3 can update to v4");
		assert.equal(run("--update"), "updated: v3 to v4");
		const text = readFileSync(file, "utf8");
		assert(text.startsWith("# Project rules\n\nUse tabs.\n\n"));
		assert(text.endsWith("\nMore rules.\n"));
		assert(text.includes(template.trim()));
		assert.equal(run(), "current: v4");
	});
});

test("never overwrites a customized block", () => {
	const editedOld = v3.replace("Create it if missing.", "Create it if missing. Our app is called Lumen.");
	withAgents(editedOld, ({ file, run }) => {
		assert.equal(run("--update"), "customized: edited from unknown version; v4 is available to review");
		assert.equal(readFileSync(file, "utf8"), editedOld);
	});
	const editedCurrent = template.replace("Create the file\nif it is missing.", "Create the file\nif it is missing. Our app is called Lumen.");
	withAgents(editedCurrent, ({ file, run }) => {
		assert.equal(run("--update"), "customized: edited from v4; v4 is available to review");
		assert.equal(readFileSync(file, "utf8"), editedCurrent);
	});
});

test("leaves a newer policy alone", () => {
	const newer = template.replace("policy v4 -->", "policy v9 -->");
	withAgents(newer, ({ file, run }) => {
		assert.equal(run("--update"), "newer: v9 is newer than this Hapstack (v4); left alone");
		assert.equal(readFileSync(file, "utf8"), newer);
	});
});

test("treats line-ending and trailing-space differences as untouched", () => {
	withAgents(v3.replace(/\n/g, "  \r\n"), ({ run }) => assert.equal(run(), "outdated: v3 can update to v4"));
});

test("refuses to guess the range of a malformed block", () => {
	const doubled = `${v3}\n${template}`;
	withAgents(doubled, ({ file, run }) => {
		assert.match(run("--update"), /^malformed/);
		assert.equal(readFileSync(file, "utf8"), doubled);
	});
});

test("runs when the skill is installed through a symlink", () => {
	const dir = mkdtempSync(join(tmpdir(), "changelog-policy-link-"));
	try {
		symlinkSync(dirname(dirname(script)), join(dir, "changelog"), "dir");
		writeFileSync(join(dir, "AGENTS.md"), v3);
		const result = spawnSync(process.execPath, [join(dir, "changelog/scripts/policy.mjs"), join(dir, "AGENTS.md")], { encoding: "utf8" });
		assert.equal(result.stdout.trim(), "outdated: v3 can update to v4");
	} finally { rmSync(dir, { recursive: true, force: true }); }
});
