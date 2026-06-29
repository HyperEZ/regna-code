#!/usr/bin/env node
import{spawn as w}from"node:child_process";import{fileURLToPath as b}from"node:url";import{dirname as E,join as o}from"node:path";import{existsSync as l,readFileSync as y,writeFileSync as S,mkdirSync as k,unlinkSync as P,chmodSync as L}from"node:fs";import{homedir as G}from"node:os";import{createRequire as U}from"node:module";import{createInterface as $}from"node:readline/promises";var I=E(b(import.meta.url)),u=E(I),f=o(u,"extensions"),v=o(u,"themes","regna.json"),h=o(u,"APPEND_SYSTEM.md"),T="https://regnax.ai/v1",N=o(G(),".regna"),m=o(N,"auth.json"),a=process.argv.slice(2),g=(...e)=>a.some(t=>e.some(n=>!!(t===n||t.startsWith(`${n}=`)||/^-[a-z]$/i.test(n)&&t.startsWith(n)&&t.length>n.length)));function A(){for(let e of[o(u,"package.json"),o(u,"..","package.json")])try{let t=JSON.parse(y(e,"utf8")).version;if(t)return`v${t}`}catch{}return""}var C=`Regna Code ${A()} - a terminal coding agent on Regna

Usage:
  regna [message...]                 start interactive, optionally with a first message
  regna "explain this repo"          run with a prompt
  regna -p "summarize changes" < /dev/null   headless/scripted (close stdin)

Auth:
  regna login                        log in to Regna and store your API key
  regna logout                       remove stored credentials

In-session commands:
  /regna-coder        switch to a coding model
  /regna-general      switch to a general model
  /regna-brand        toggle the Regna Code branding
  /regna-docs <q>     document-grounded query (requires REGNA_DOCS_ENABLED=1)

Environment:
  REGNA_API_KEY       Regna API key (optional once logged in)
  REGNA_BASE_URL      Regna API base URL (default https://regnax.ai/v1)
  REGNA_MODEL         starting model (default regna/default)
  REGNA_POLICY        network egress guard: off | warn | enforce

Docs: https://github.com/HyperEZ/regna-code
`;function R(){try{let e=JSON.parse(y(m,"utf8"));return e&&typeof e.apiKey=="string"?e:null}catch{return null}}function D(e,t){k(N,{recursive:!0}),S(m,`${JSON.stringify({apiKey:e,baseUrl:t},null,2)}
`);try{L(m,384)}catch{}}function B(){try{return P(m),!0}catch{return!1}}function O(e){try{return`${new URL(e).origin}/console`}catch{return"https://regnax.ai/console"}}function j(e){try{let[t,n]=process.platform==="darwin"?["open",[e]]:process.platform==="win32"?["cmd",["/c","start","",e]]:["xdg-open",[e]];w(t,n,{stdio:"ignore",detached:!0}).unref()}catch{}}async function q(e,t){try{let n=new AbortController,s=setTimeout(()=>n.abort(),8e3),r=await fetch(`${e.replace(/\/+$/,"")}/models`,{headers:{Authorization:`Bearer ${t}`},signal:n.signal});return clearTimeout(s),r.status===401||r.status===403?"invalid":r.ok?"ok":"unknown"}catch{return"unknown"}}async function _(){let e=(process.env.REGNA_BASE_URL||"").trim()||R()?.baseUrl||T,t=O(e);process.stdout.write(`
  Regna Code ${A()}
  Log in to continue.

  1) Get an API key at ${t}
  2) Paste it below.

`),j(t);let n=$({input:process.stdin,output:process.stdout}),s="";try{s=(await n.question("  API key: ")).trim()}finally{n.close()}s||(process.stderr.write(`  No key entered. Aborting.
`),process.exit(1));let r=await q(e,s);return r==="invalid"&&(process.stderr.write(`  That key was rejected. Check it and run: regna login
`),process.exit(1)),D(s,e),process.stdout.write(r==="ok"?`  Logged in.

`:`  Saved (could not verify right now).

`),s}(g("--help","-h")||a[0]==="help")&&(process.stdout.write(C),process.exit(0));(g("--version")||a[0]==="version")&&(process.stdout.write(`Regna Code ${A()}
`),process.exit(0));a[0]==="login"&&(await _(),process.exit(0));a[0]==="logout"&&(process.stdout.write(B()?`Logged out.
`:`Not logged in.
`),process.exit(0));var d=(process.env.REGNA_API_KEY||"").trim();if(!d){let e=R();e?.apiKey&&(d=e.apiKey.trim(),!process.env.REGNA_BASE_URL&&e.baseUrl&&(process.env.REGNA_BASE_URL=e.baseUrl))}if(!d)if(process.stdin.isTTY&&process.stdout.isTTY){if(d=await _(),!process.env.REGNA_BASE_URL){let e=R();e?.baseUrl&&(process.env.REGNA_BASE_URL=e.baseUrl)}}else process.stderr.write(`[regna] Not logged in. Run: regna login
`),process.exit(1);process.env.REGNA_API_KEY=d;var i=[],K=process.env.REGNA_DISCOVER==="1";if(!K){i.push("--no-extensions");let e=["provider","policy","branding","model","docs-search","docs-analysis"],t=r=>{let p=o(f,`${r}.js`);if(l(p))return p;let c=o(f,`${r}.ts`);return l(c)?c:null},n=e.map(r=>[r,t(r)]),s=n.filter(([,r])=>!r).map(([r])=>r);s.length>0&&(process.stderr.write(`[regna] Missing required extensions: ${s.join(", ")} (in ${f}). Install is corrupted. Aborting.
`),process.exit(1));for(let[,r]of n)i.push("-e",r)}!g("--theme")&&l(v)&&i.push("--theme",v);g("--system-prompt")||(l(h)||(process.stderr.write(`[regna] Missing required prompt: APPEND_SYSTEM.md (${h}). Install is corrupted. Aborting.
  (To set the prompt yourself on purpose, run with --system-prompt.)
`),process.exit(1)),i.push("--append-system-prompt",`@${h}`));g("--model","-m")||i.push("--model",process.env.REGNA_MODEL||"regna/default");i.push(...a);var Y={...process.env,PI_OFFLINE:"1"};function F(){let e=process.env.REGNA_ENGINE;if(e)return{cmd:e,prefix:[],label:e};try{let n=U(import.meta.url).resolve("@earendil-works/pi-coding-agent/package.json"),s=E(n),r=JSON.parse(y(n,"utf8")),p=typeof r.bin=="string"?r.bin:r.bin?.pi;if(p){let c=o(s,p);if(l(c))return{cmd:process.execPath,prefix:[c],label:c}}}catch{}return{cmd:"pi",prefix:[],label:"runtime (PATH)"}}var{cmd:M,prefix:H,label:z}=F(),x=w(M,[...H,...i],{stdio:"inherit",env:Y});x.on("error",e=>{e&&e.code==="ENOENT"&&(process.stderr.write(`[regna] Runtime executable not found (${z}). Reinstall (npm i -g @hyperez/regna-code) or set REGNA_ENGINE.
`),process.exit(127)),process.stderr.write(`[regna] Failed to start the runtime: ${e?.message??String(e)}
`),process.exit(1)});x.on("exit",(e,t)=>{if(t){process.kill(process.pid,t);return}process.exit(e??0)});
