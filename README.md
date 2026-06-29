# Regna Code

A terminal coding agent on Regna. One command, `regna`, gives you an AI coding assistant in your terminal: read, edit, write, run, and multi-step automation, backed by Regna models.

Regna Code is a thin client. The models, knowledge, and routing live behind the Regna API, so the same `regna` command works against the Regna cloud or an on-premise (air-gapped) deployment, just by pointing it at a different endpoint.

## Requirements

- Node.js >= 22.19.0
- A Regna API endpoint and key.

## Install

```
npm i -g @hyperez/regna-code
```

Set your key and run:

```
export REGNA_API_KEY="..."                 # your Regna API key

regna                                      # interactive
regna "explain this repo"                  # with a prompt
regna -p "summarize today's changes" < /dev/null   # headless/scripted (close stdin)
```

By default Regna Code talks to the Regna cloud API (`https://regnax.ai/v1`). To use a self-hosted or air-gapped deployment, point it at your own endpoint:

```
export REGNA_BASE_URL="http://<your-gateway>/v1"
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `REGNA_API_KEY` | (none) | Regna API key. Required. Read from the environment only. |
| `REGNA_BASE_URL` | `https://regnax.ai/v1` | Regna API base URL (OpenAI-compatible). Point this at a self-hosted endpoint for on-premise use. |
| `REGNA_MODEL` | `regna/default` | Starting model pattern. |
| `REGNA_CODER_MODEL` | (none) | Exact model id that `/regna-coder` selects. |
| `REGNA_GENERAL_MODEL` | (none) | Exact model id that `/regna-general` selects. |
| `REGNA_EXPOSE_ALIASES` | (unset) | `1` also exposes path-style (slash) model ids. Hidden by default. Ids pinned via `REGNA_MODEL`/`REGNA_CODER_MODEL`/`REGNA_GENERAL_MODEL` are always shown. |
| `REGNA_POLICY` | `off` | Network egress guard: `off` / `warn` (notify, allow) / `enforce` (block external network tools). Set `enforce` for locked-down or air-gapped use. |
| `REGNA_ALLOW_HOSTS` | (none) | Extra allowed hosts (comma-separated) when the policy is on. URL or `host:port` accepted. |
| `REGNA_OFFLINE` | (unset) | `1` runs in air-gapped mode: blocks the runtime's own outbound network (update checks and the like). Your Regna API calls are unaffected. |
| `REGNA_DISCOVER` | (unset) | `1` lets the runtime auto-discover extensions instead of loading the verified set explicitly. |
| `REGNA_ENGINE` | (bundled) | Override the path to the runtime executable. Resolved from the bundled dependency by default. |
| `REGNA_DOCS_ENABLED` | (unset) | `1` enables the document search tool (`regna_docs_search`) and the `/regna-docs` skill. Only turn this on when the backend's retrieval endpoint is available. |
| `REGNA_RETRIEVAL_PATH` | `/api/retrieval/search` | Override the retrieval endpoint path. |
| `REGNA_DOCS_TIMEOUT_MS` | `15000` | Retrieval timeout (clamped 1000~120000). |

## Commands

| Command | Action |
|---|---|
| `/regna-coder` | Switch to a coding model (prefers an id containing `coder`, else default). |
| `/regna-general` | Switch to a general model (prefers `instruct`, else default). |
| `/regna-brand` | Toggle the Regna Code header/title branding. |
| `/regna-docs <question>` | Document-grounded query. Searches indexed documents with `regna_docs_search`, answers using only retrieved evidence with `[source n]` citations, and says it does not know when there is no evidence. Requires `REGNA_DOCS_ENABLED=1`. |

## Document search (`REGNA_DOCS_ENABLED=1`)

When enabled, two features turn on. Use them only where the backend's retrieval endpoint is available.

- Search tool `regna_docs_search`: the model fetches evidence chunks and answers with `[source n]` citations. Documents outside the caller's permissions are not returned (key = identity).
- Citation check gate: every answer in a turn that searched for evidence is checked. If it cites a source number not in the evidence (hallucination), or asserts a claim without any citation after searching, a non-blocking warning is shown. "I don't know" answers pass.

`/regna-docs <question>` sets up this flow in one command.

## Air-gapped mode

Regna Code runs fully offline against a self-hosted deployment. Set:

```
export REGNA_BASE_URL="http://<your-gateway>/v1"
export REGNA_OFFLINE=1        # block the runtime's own outbound network
export REGNA_POLICY=enforce   # block external network tools; allow the gateway, localhost, and private/internal ranges
```

The egress guard is a defense layer, not a hard sandbox. Enforce real boundaries with OS and network controls and an internal mirror.

## Troubleshooting

| Symptom | Action |
|---|---|
| `401 status code` | Check `REGNA_API_KEY`. |
| Headless run hangs | Close stdin: `regna -p ... < /dev/null`. |
| Only `regna/default` shows | Check `REGNA_BASE_URL` and key, then `/reload`. |
| `[regna policy] blocked` | If legitimate, add `REGNA_ALLOW_HOSTS` or set `REGNA_POLICY=warn`/`off`. |
| Missing extension/prompt, aborted | Reinstall. Fail-closed behavior is intentional. |
| Runtime executable not found | Reinstall (`npm i -g @hyperez/regna-code`) or set `REGNA_ENGINE`. |

## License

PolyForm Noncommercial License 1.0.0. Noncommercial use is permitted. For commercial use, contact HyperEZ (https://hyperez.io). See `LICENSE`.
