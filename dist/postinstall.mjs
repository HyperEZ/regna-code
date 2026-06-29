#!/usr/bin/env node
/**
 * Postinstall: small, surgical brand patches to the installed engine.
 *
 * The engine ships compiled JS whose constants/built-ins we cannot override at runtime via
 * the extension API. We rewrite a few exact spots in the installed dependency:
 *
 *   1) Terminal title. The engine composes the title as `${APP_TITLE} - <cwd>` and re-asserts
 *      it on every turn/cwd change, so an extension setTitle cannot win. We rewrite ONLY the
 *      `APP_TITLE = piConfigName ? APP_NAME : "<x>"` fallback string to "Regna". APP_NAME, the
 *      config dir name, and the agent-dir env var are untouched, so the launcher's state
 *      isolation (PI_CODING_AGENT_DIR) keeps working regardless.
 *
 *   2) Remove the built-in /quit command. Regna Code exposes /exit instead. We drop the "quit"
 *      entry from the built-in slash-command menu and neutralize its handler so /quit no longer
 *      triggers shutdown (Ctrl+C/Ctrl+D still exit).
 *
 * Best effort: every patch is wrapped so a failure (e.g. the engine changed its layout) just
 * leaves that aspect at the engine default and never fails the install. All patches are
 * idempotent and safe to run on every install.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const TITLE = "Regna";

// The engine's package.json "exports" map blocks require.resolve of its package.json/main,
// so we locate the installed file by walking up node_modules from this script's location.
// Handles both nested (under our package) and hoisted installs, dev and global.
function findEngineFile(relInsidePackage) {
	const rel = join("node_modules", "@earendil-works", "pi-coding-agent", relInsidePackage);
	let dir = dirname(fileURLToPath(import.meta.url));
	for (let i = 0; i < 10; i++) {
		const cand = join(dir, rel);
		if (existsSync(cand)) return cand;
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}

/** Apply one regex replacement to an engine file. No-op if the file or pattern is missing. */
function patchEngineFile(relInsidePackage, re, replacement) {
	try {
		const path = findEngineFile(relInsidePackage);
		if (!path) return;
		const src = readFileSync(path, "utf8");
		if (!re.test(src)) return; // already patched or layout changed
		const out = src.replace(re, replacement);
		if (out !== src) writeFileSync(path, out);
	} catch {
		/* best effort; never fail the install */
	}
}

// 1) Terminal title fallback -> "Regna".
patchEngineFile(
	join("dist", "config.js"),
	/(APP_TITLE\s*=\s*piConfigName\s*\?\s*APP_NAME\s*:\s*)"[^"]*"/,
	`$1"${TITLE}"`,
);

// 2a) Drop the built-in "quit" entry from the slash-command menu.
patchEngineFile(
	join("dist", "core", "slash-commands.js"),
	/\{\s*name:\s*"quit",\s*description:\s*`[^`]*`\s*\},?\n?/,
	"",
);

// 2b) Neutralize the /quit handler so it no longer matches (Ctrl+C/Ctrl+D still exit).
patchEngineFile(
	join("dist", "modes", "interactive", "interactive-mode.js"),
	/if\s*\(\s*text\s*===\s*"\/quit"\s*\)/,
	'if (text === "/__regna_quit_removed__")',
);
