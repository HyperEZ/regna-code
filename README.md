# Regna Code

A terminal coding agent on Regna. One command, `regna`, gives you an AI coding assistant in your terminal: read, edit, write, run, and multi-step automation, backed by Regna models.

Regna Code is a thin client. The models, knowledge, and routing live behind the Regna API, so the same `regna` command works against the Regna cloud or an on-premise (air-gapped) deployment, just by pointing it at a different endpoint.

## Requirements

- Node.js >= 22.19.0
- A Regna account (sign up at https://regnax.ai).

## Install

```
npm i -g @hyperez/regna-code
```

Then just run it. On first launch it asks how you want to connect:

```
  Choose how to connect:
    1) Online   - Regna cloud (regnax.ai)
    2) Offline  - air-gapped / self-hosted gateway
```

- **Online**: opens https://regnax.ai/console, you paste an API key once. The cloud serves a single model, `regna-1`.
- **Offline**: you enter your internal gateway URL (OpenAI-compatible `/v1`) and key, then pick a default model from whatever the gateway serves. Offline runs with no engine self-network and the egress guard enforced.

Your choice and credentials are stored at `~/.regna/auth.json`. After that:

```
regna                                      # starts interactive
regna "explain this repo"                  # with a prompt
regna -p "summarize today's changes" < /dev/null   # headless/scripted (close stdin)
```

```
regna login                                # re-run the Online/Offline chooser
regna login online                         # set up Online directly
regna login offline                        # set up Offline directly
regna logout                               # remove stored credentials
```

For CI or scripted use, set `REGNA_API_KEY` directly; it takes priority over the stored login. Add `REGNA_OFFLINE=1` and `REGNA_BASE_URL` for non-interactive air-gapped use.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `REGNA_API_KEY` | (none) | Regna API key. Optional once you have run `regna login`. When set, it overrides the stored credential (use for CI). |
| `REGNA_BASE_URL` | `https://regnax.ai/v1` | Regna API base URL (OpenAI-compatible). Point this at a self-hosted endpoint for on-premise use. |
| `REGNA_MODEL` | (auto) | Starting model. By default the current single cloud model is detected from the gateway automatically; set this to pin a specific id. |
| `REGNA_EXPOSE_ALIASES` | (unset) | `1` also exposes path-style (slash) model ids. Hidden by default. The id pinned via `REGNA_MODEL` is always shown. |
| `REGNA_POLICY` | `off` | Network egress guard: `off` / `warn` (notify, allow) / `enforce` (block external network tools). Set `enforce` for locked-down or air-gapped use. |
| `REGNA_OFFLINE` | (unset) | `1` runs fully offline: the runtime skips all self-network, including the one-time download of search helpers (`fd`/`ripgrep`). They fall back to the built-in search. Use for air-gapped installs. |
| `REGNA_ALLOW_HOSTS` | (none) | Extra allowed hosts (comma-separated) when the policy is on. URL or `host:port` accepted. |
| `REGNA_DISCOVER` | (unset) | `1` lets the runtime auto-discover extensions instead of loading the verified set explicitly. |
| `REGNA_ENGINE` | (bundled) | Override the path to the runtime executable. Resolved from the bundled dependency by default. |
| `REGNA_DOCS_ENABLED` | (unset) | `1` enables the document search tool (`regna_docs_search`) and the `/regna-docs` skill. Only turn this on when the backend's retrieval endpoint is available. |
| `REGNA_RETRIEVAL_PATH` | `/api/retrieval/search` | Override the retrieval endpoint path. |
| `REGNA_DOCS_TIMEOUT_MS` | `15000` | Retrieval timeout (clamped 1000~120000). |

## Commands

| Command | Action |
|---|---|
| `regna login` | Log in to Regna and store your API key at `~/.regna/auth.json`. |
| `regna logout` | Remove stored credentials. |
| `/exit` | Exit Regna Code from inside a session. |
| `/compact` | Compact the session context (also runs automatically as it fills). |
| `/regna-brand` | Toggle the Regna Code header/title branding. |
| `/regna-docs <question>` | Document-grounded query. Searches indexed documents with `regna_docs_search`, answers using only retrieved evidence with `[source n]` citations, and says it does not know when there is no evidence. Requires `REGNA_DOCS_ENABLED=1`. |

## Document search (`REGNA_DOCS_ENABLED=1`)

When enabled, two features turn on. Use them only where the backend's retrieval endpoint is available.

- Search tool `regna_docs_search`: the model fetches evidence chunks and answers with `[source n]` citations. Documents outside the caller's permissions are not returned (key = identity).
- Citation check gate: every answer in a turn that searched for evidence is checked. If it cites a source number not in the evidence (hallucination), or asserts a claim without any citation after searching, a non-blocking warning is shown. "I don't know" answers pass.

`/regna-docs <question>` sets up this flow in one command.

## Air-gapped mode

Regna Code does no update checks and sends no telemetry. By default it is online only for Regna API calls and a one-time download of its search helpers (`fd`/`ripgrep`). For a fully offline, self-hosted deployment, set:

```
export REGNA_BASE_URL="http://<your-gateway>/v1"
export REGNA_OFFLINE=1         # skip all engine self-network (search helpers fall back to the built-in search)
export REGNA_POLICY=enforce    # block external network tools; allow the gateway, localhost, and private/internal ranges
```

The egress guard is a defense layer, not a hard sandbox. Enforce real boundaries with OS and network controls and an internal mirror.

## Troubleshooting

| Symptom | Action |
|---|---|
| `401 status code` | Re-authenticate: `regna login`. |
| Headless run hangs | Close stdin: `regna -p ... < /dev/null`. |
| No Regna models show | Run `regna login`, or check `REGNA_BASE_URL`, then `/reload`. |
| `[regna policy] blocked` | If legitimate, add `REGNA_ALLOW_HOSTS` or set `REGNA_POLICY=warn`/`off`. |
| Missing extension/prompt, aborted | Reinstall. Fail-closed behavior is intentional. |
| Runtime executable not found | Reinstall (`npm i -g @hyperez/regna-code`) or set `REGNA_ENGINE`. |

## License

PolyForm Noncommercial License 1.0.0. Noncommercial use is permitted. For commercial use, contact HyperEZ (https://hyperez.io). See `LICENSE`.
