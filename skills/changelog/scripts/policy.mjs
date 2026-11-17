#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const START = /<!-- agent-changelog-start(?::[^>]*?)? -->/g;
const END = /<!-- agent-changelog-end -->/g;
const LABELED_VERSION = /<!-- agent-changelog-start: Hapstack changelog policy v(\d+) -->/;

// The released template text, as a normalized hash. Changing the template fails the tests
// until you bump its version label, move this entry into PREVIOUS, and record the new hash.
export const CURRENT = { version: 4, hash: "eec4807c856e4d68f3cbb282bf94ce7132326919816c669951130999f5dcf848" };

// Every earlier released template. A block that matches one was never edited by the project,
// so it is safe to replace. Versions 1 to 3 predate the version label.
export const PREVIOUS = new Map([
	["8640d84f96a43b56d89e46555daae3f02fe7adba1c294a9b87781acf48128ee4", 1],
	["666cb6917aaba3d99b85129a4d61212c47799b7faf2924f5b0ce91f1d52751ff", 2],
	["c7f16fd86165927f758ae7069de3e87d2de676915cc70cb74d2ff53ee08b6112", 3],
]);

export const normalize = (text) => text.replace(/\r\n/g, "\n").split("\n").map((line) => line.trimEnd()).join("\n").trim();
export const hash = (text) => createHash("sha256").update(normalize(text)).digest("hex");
export const versionOf = (block) => PREVIOUS.get(hash(block)) || Number(block.match(LABELED_VERSION)?.[1]) || null;

export function inspect(text, template) {
	const latest = versionOf(template);
	const starts = text === null ? [] : [...text.matchAll(START)];
	const ends = text === null ? [] : [...text.matchAll(END)];
	if (starts.length === 0 && ends.length === 0) return { status: "missing", latest };
	if (starts.length !== 1 || ends.length !== 1 || ends[0].index < starts[0].index) return { status: "malformed", latest };
	const range = [starts[0].index, ends[0].index + ends[0][0].length];
	const block = text.slice(...range);
	const version = versionOf(block);
	if (normalize(block) === normalize(template)) return { status: "current", version, latest, range };
	if (version > latest) return { status: "newer", version, latest, range };
	if (PREVIOUS.has(hash(block))) return { status: "outdated", version, latest, range };
	return { status: "customized", version, latest, range };
}

export function describe(result) {
	const v = (n) => (n ? `v${n}` : "unknown version");
	switch (result.status) {
		case "missing": return `missing: no Hapstack changelog policy (latest is v${result.latest})`;
		case "malformed": return "malformed: the policy markers are missing, repeated, or out of order";
		case "current": return `current: v${result.version}`;
		case "newer": return `newer: v${result.version} is newer than this Hapstack (v${result.latest}); left alone`;
		case "outdated": return `outdated: ${v(result.version)} can update to v${result.latest}`;
		case "updated": return `updated: ${v(result.version)} to v${result.latest}`;
		default: return `customized: edited from ${v(result.version)}; v${result.latest} is available to review`;
	}
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
	const [file, flag] = process.argv.slice(2);
	if (!file || (flag && flag !== "--update")) {
		console.error("Usage: node policy.mjs <AGENTS.md> [--update]");
		process.exit(2);
	}
	const template = readFileSync(new URL("../assets/changelog-AGENTS.md", import.meta.url), "utf8");
	const text = existsSync(file) ? readFileSync(file, "utf8") : null;
	const result = inspect(text, template);
	if (flag && result.status === "outdated") {
		const [from, to] = result.range;
		writeFileSync(file, text.slice(0, from) + template.trim() + text.slice(to));
		result.status = "updated";
	}
	console.log(describe(result));
}
