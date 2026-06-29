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
 *   3) Resume hint. On exit the engine prints "To resume this session: <prog> --session <id>"
 *      where <prog> is APP_NAME ("pi"). We rewrite that one program token to "regna" so the
 *      printed command actually works as typed. The session dir is the isolated Regna one, so
 *      `regna --session <id>` resumes correctly with no extra flags.
 *
 *   4) Disable the update banner and the install telemetry to pi.dev unconditionally. Both are
 *      guarded by the same `if (process.env.PI_OFFLINE)` early-return, so we force that guard to
 *      always take. This lets us run online by default (so search helpers fd/ripgrep download
 *      on first run) without re-enabling the update check or phoning telemetry home. Fully
 *      offline air-gapped use is then an explicit REGNA_OFFLINE=1 opt-in in the launcher.
 *
 *   5) Hide the "Extensions" and "Themes" sections of the startup resource panel (internal
 *      implementation detail). Context and Skills still show.
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
		const out = src.replace(re, replacement); // no-op if pattern absent (already patched)
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

// 3) Resume hint program name: "<pi> --session <id>" -> "regna --session <id>".
patchEngineFile(
	join("dist", "modes", "interactive", "interactive-mode.js"),
	/const args = \[APP_NAME\];/,
	'const args = ["regna"];',
);

// 4) Force-disable the update banner + pi.dev install telemetry (both gated by the same guard),
//    independent of PI_OFFLINE, so online-by-default does not re-enable them.
patchEngineFile(
	join("dist", "modes", "interactive", "interactive-mode.js"),
	/if \(process\.env\.PI_OFFLINE\) \{/g,
	"if (true) {",
);

// 5) Hide the "Extensions" and "Themes" sections from the startup resource panel. These are
//    Regna Code internals the user does not need to see (Context and Skills still show).
patchEngineFile(
	join("dist", "modes", "interactive", "interactive-mode.js"),
	/addLoadedSection\("Extensions", extensionCompactList, extList, "mdHeading"\);/,
	"void 0;",
);
patchEngineFile(
	join("dist", "modes", "interactive", "interactive-mode.js"),
	/addLoadedSection\("Themes", themeCompactList, themeList\);/,
	"void 0;",
);

// The engine version these patches are written against. The package pins this exact version,
// so a mismatch means something forced a different engine in. We verify and warn rather than
// fail silently: if the engine's compiled shape changed, the patches above become no-ops.
const KNOWN_ENGINE = "0.80.2";
const IM = join("dist", "modes", "interactive", "interactive-mode.js");
try {
	const checks = [
		{ file: join("dist", "config.js"), label: "terminal title", want: /APP_NAME\s*:\s*"Regna"/ },
		{ file: IM, label: "/quit removed", absent: /if \(text === "\/quit"\)/ },
		{ file: join("dist", "core", "slash-commands.js"), label: "/quit menu removed", absent: /name:\s*"quit"/ },
		{ file: IM, label: "resume command name", want: /const args = \["regna"\];/ },
		{ file: IM, label: "update banner/telemetry off", absent: /if \(process\.env\.PI_OFFLINE\) \{/ },
		{ file: IM, label: "Extensions section hidden", absent: /addLoadedSection\("Extensions"/ },
		{ file: IM, label: "Themes section hidden", absent: /addLoadedSection\("Themes"/ },
	];
	const failed = [];
	for (const c of checks) {
		const p = findEngineFile(c.file);
		if (!p) {
			failed.push(c.label);
			continue;
		}
		const src = readFileSync(p, "utf8");
		if (c.want && !c.want.test(src)) failed.push(c.label);
		if (c.absent && c.absent.test(src)) failed.push(c.label);
	}
	if (failed.length > 0) {
		let ver = "unknown";
		try {
			const pj = findEngineFile("package.json");
			if (pj) ver = JSON.parse(readFileSync(pj, "utf8")).version || ver;
		} catch {
			/* ignore */
		}
		process.stderr.write(
			`[regna] Note: some UI customizations did not apply (engine ${ver}, expected ${KNOWN_ENGINE}): ` +
				`${failed.join(", ")}. Try reinstalling: npm i -g @hyperez/regna-code\n`,
		);
	}
} catch {
	/* verification is advisory only; never fail the install */
}
