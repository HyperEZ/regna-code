#!/usr/bin/env node
/**
 * Postinstall: brand the terminal/tab title as "Regna".
 *
 * The runtime composes the terminal title as `${APP_TITLE} - <cwd>` and re-asserts it on
 * every turn/cwd change, so a one-time setTitle from an extension cannot win the race.
 * APP_TITLE is a compiled constant whose fallback is the engine's own mark. We surgically
 * rewrite ONLY that fallback string to "Regna" in the installed dependency.
 *
 * Scope is deliberately narrow:
 *   - Only the `APP_TITLE = piConfigName ? APP_NAME : "<x>"` literal is touched.
 *   - APP_NAME, the config dir name, and the agent-dir env var are left untouched, so the
 *     launcher's state isolation (PI_CODING_AGENT_DIR) keeps working regardless.
 *
 * Best effort: any failure is swallowed and the install still succeeds. If the patch does
 * not apply (e.g. the engine changed its layout), the only effect is the title stays as the
 * engine default. This is idempotent and safe to run on every install.
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

try {
	const configPath = findEngineFile(join("dist", "config.js"));
	if (!configPath) throw new Error("engine config.js not found");
	const src = readFileSync(configPath, "utf8");
	// Match: APP_TITLE = piConfigName ? APP_NAME : "<anything>"
	const re = /(APP_TITLE\s*=\s*piConfigName\s*\?\s*APP_NAME\s*:\s*)"[^"]*"/;
	if (re.test(src)) {
		const out = src.replace(re, `$1"${TITLE}"`);
		if (out !== src) writeFileSync(configPath, out);
	}
} catch {
	/* cosmetic only; never fail the install */
}
