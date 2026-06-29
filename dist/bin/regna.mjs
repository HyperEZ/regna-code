#!/usr/bin/env node
import{spawn as A}from"node:child_process";import{fileURLToPath as x}from"node:url";import{dirname as f,join as n}from"node:path";import{existsSync as c,readFileSync as E}from"node:fs";import{createRequire as b}from"node:module";var w=f(x(import.meta.url)),p=f(w),m=n(p,"extensions"),h=n(p,"themes","regna.json"),g=n(p,"APPEND_SYSTEM.md"),l=process.argv.slice(2),d=(...e)=>l.some(s=>e.some(t=>!!(s===t||s.startsWith(`${t}=`)||/^-[a-z]$/i.test(t)&&s.startsWith(t)&&s.length>t.length)));function R(){for(let e of[n(p,"package.json"),n(p,"..","package.json")])try{let s=JSON.parse(E(e,"utf8")).version;if(s)return`v${s}`}catch{}return""}var y=`Regna Code ${R()} - a terminal coding agent on Regna

Usage:
  regna [message...]                 start interactive, optionally with a first message
  regna "explain this repo"          run with a prompt
  regna -p "summarize changes" < /dev/null   headless/scripted (close stdin)

In-session commands:
  /regna-coder        switch to a coding model
  /regna-general      switch to a general model
  /regna-brand        toggle the Regna Code branding
  /regna-docs <q>     document-grounded query (requires REGNA_DOCS_ENABLED=1)

Key environment variables:
  REGNA_API_KEY       Regna API key (required)
  REGNA_BASE_URL      Regna API base URL (default https://regnax.ai/v1)
  REGNA_MODEL         starting model (default regna/default)
  REGNA_POLICY        network egress guard: off | warn | enforce
  REGNA_OFFLINE=1     air-gapped mode (block the runtime's own outbound network)

Docs: https://github.com/HyperEZ/regna-code
`;(d("--help","-h")||l[0]==="help")&&(process.stdout.write(y),process.exit(0));(d("--version")||l[0]==="version")&&(process.stdout.write(`Regna Code ${R()}
`),process.exit(0));var o=[],P=process.env.REGNA_DISCOVER==="1";if(!P){o.push("--no-extensions");let e=["provider","policy","branding","model","docs-search","docs-analysis"],s=r=>{let a=n(m,`${r}.js`);if(c(a))return a;let i=n(m,`${r}.ts`);return c(i)?i:null},t=e.map(r=>[r,s(r)]),u=t.filter(([,r])=>!r).map(([r])=>r);u.length>0&&(process.stderr.write(`[regna] Missing required extensions: ${u.join(", ")} (in ${m}). Install is corrupted. Aborting.
`),process.exit(1));for(let[,r]of t)o.push("-e",r)}!d("--theme")&&c(h)&&o.push("--theme",h);d("--system-prompt")||(c(g)||(process.stderr.write(`[regna] Missing required prompt: APPEND_SYSTEM.md (${g}). Install is corrupted. Aborting.
  (To set the prompt yourself on purpose, run with --system-prompt.)
`),process.exit(1)),o.push("--append-system-prompt",`@${g}`));d("--model","-m")||o.push("--model",process.env.REGNA_MODEL||"regna/default");o.push(...l);var N={...process.env};process.env.REGNA_OFFLINE==="1"&&(N.PI_OFFLINE="1");function _(){let e=process.env.REGNA_ENGINE;if(e)return{cmd:e,prefix:[],label:e};try{let t=b(import.meta.url).resolve("@earendil-works/pi-coding-agent/package.json"),u=f(t),r=JSON.parse(E(t,"utf8")),a=typeof r.bin=="string"?r.bin:r.bin?.pi;if(a){let i=n(u,a);if(c(i))return{cmd:process.execPath,prefix:[i],label:i}}}catch{}return{cmd:"pi",prefix:[],label:"runtime (PATH)"}}var{cmd:G,prefix:I,label:k}=_(),v=A(G,[...I,...o],{stdio:"inherit",env:N});v.on("error",e=>{e&&e.code==="ENOENT"&&(process.stderr.write(`[regna] Runtime executable not found (${k}). Reinstall (npm i -g @hyperez/regna-code) or set REGNA_ENGINE.
`),process.exit(127)),process.stderr.write(`[regna] Failed to start the runtime: ${e?.message??String(e)}
`),process.exit(1)});v.on("exit",(e,s)=>{if(s){process.kill(process.pid,s);return}process.exit(e??0)});
