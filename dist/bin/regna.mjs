#!/usr/bin/env node
import{spawn as w}from"node:child_process";import{fileURLToPath as P}from"node:url";import{dirname as E,join as o}from"node:path";import{existsSync as l,readFileSync as A,writeFileSync as k,mkdirSync as N,unlinkSync as I,chmodSync as G}from"node:fs";import{homedir as L}from"node:os";import{createRequire as U}from"node:module";import{createInterface as $}from"node:readline/promises";var D=E(P(import.meta.url)),u=E(D),f=o(u,"extensions"),_=o(u,"themes","regna.json"),h=o(u,"APPEND_SYSTEM.md"),T="https://regnax.ai/v1",C="regna/regna-pro",R=o(L(),".regna"),m=o(R,"auth.json"),x=o(R,"engine"),a=process.argv.slice(2),g=(...e)=>a.some(r=>e.some(n=>!!(r===n||r.startsWith(`${n}=`)||/^-[a-z]$/i.test(n)&&r.startsWith(n)&&r.length>n.length)));function y(){for(let e of[o(u,"package.json"),o(u,"..","package.json")])try{let r=JSON.parse(A(e,"utf8")).version;if(r)return`v${r}`}catch{}return""}var O=`Regna Code ${y()} - a terminal coding agent on Regna

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
  REGNA_MODEL         starting model (default regna/regna-pro)
  REGNA_POLICY        network egress guard: off | warn | enforce

Docs: https://github.com/HyperEZ/regna-code
`;function v(){try{let e=JSON.parse(A(m,"utf8"));return e&&typeof e.apiKey=="string"?e:null}catch{return null}}function B(e,r){N(R,{recursive:!0}),k(m,`${JSON.stringify({apiKey:e,baseUrl:r},null,2)}
`);try{G(m,384)}catch{}}function j(){try{return I(m),!0}catch{return!1}}function q(e){try{return`${new URL(e).origin}/console`}catch{return"https://regnax.ai/console"}}function F(e){try{let[r,n]=process.platform==="darwin"?["open",[e]]:process.platform==="win32"?["cmd",["/c","start","",e]]:["xdg-open",[e]];w(r,n,{stdio:"ignore",detached:!0}).unref()}catch{}}async function K(e,r){try{let n=new AbortController,s=setTimeout(()=>n.abort(),8e3),t=await fetch(`${e.replace(/\/+$/,"")}/models`,{headers:{Authorization:`Bearer ${r}`},signal:n.signal});return clearTimeout(s),t.status===401||t.status===403?"invalid":t.ok?"ok":"unknown"}catch{return"unknown"}}async function b(){let e=(process.env.REGNA_BASE_URL||"").trim()||v()?.baseUrl||T,r=q(e);process.stdout.write(`
  Regna Code ${y()}
  Log in to continue.

  1) Get an API key at ${r}
  2) Paste it below.

`),F(r);let n=$({input:process.stdin,output:process.stdout}),s="";try{s=(await n.question("  API key: ")).trim()}finally{n.close()}s||(process.stderr.write(`  No key entered. Aborting.
`),process.exit(1));let t=await K(e,s);return t==="invalid"&&(process.stderr.write(`  That key was rejected. Check it and run: regna login
`),process.exit(1)),B(s,e),process.stdout.write(t==="ok"?`  Logged in.

`:`  Saved (could not verify right now).

`),s}(g("--help","-h")||a[0]==="help")&&(process.stdout.write(O),process.exit(0));(g("--version")||a[0]==="version")&&(process.stdout.write(`Regna Code ${y()}
`),process.exit(0));a[0]==="login"&&(await b(),process.exit(0));a[0]==="logout"&&(process.stdout.write(j()?`Logged out.
`:`Not logged in.
`),process.exit(0));var d=(process.env.REGNA_API_KEY||"").trim();if(!d){let e=v();e?.apiKey&&(d=e.apiKey.trim(),!process.env.REGNA_BASE_URL&&e.baseUrl&&(process.env.REGNA_BASE_URL=e.baseUrl))}if(!d)if(process.stdin.isTTY&&process.stdout.isTTY){if(d=await b(),!process.env.REGNA_BASE_URL){let e=v();e?.baseUrl&&(process.env.REGNA_BASE_URL=e.baseUrl)}}else process.stderr.write(`[regna] Not logged in. Run: regna login
`),process.exit(1);process.env.REGNA_API_KEY=d;var i=[],Y=process.env.REGNA_DISCOVER==="1";if(!Y){i.push("--no-extensions");let e=["provider","policy","branding","model","docs-search","docs-analysis"],r=t=>{let p=o(f,`${t}.js`);if(l(p))return p;let c=o(f,`${t}.ts`);return l(c)?c:null},n=e.map(t=>[t,r(t)]),s=n.filter(([,t])=>!t).map(([t])=>t);s.length>0&&(process.stderr.write(`[regna] Missing required extensions: ${s.join(", ")} (in ${f}). Install is corrupted. Aborting.
`),process.exit(1));for(let[,t]of n)i.push("-e",t)}!g("--theme")&&l(_)&&i.push("--theme",_);g("--system-prompt")||(l(h)||(process.stderr.write(`[regna] Missing required prompt: APPEND_SYSTEM.md (${h}). Install is corrupted. Aborting.
  (To set the prompt yourself on purpose, run with --system-prompt.)
`),process.exit(1)),i.push("--append-system-prompt",`@${h}`));g("--model","-m")||i.push("--model",process.env.REGNA_MODEL||C);i.push(...a);try{N(x,{recursive:!0})}catch{}var M={...process.env,PI_OFFLINE:"1",PI_CODING_AGENT_DIR:x};function H(){let e=process.env.REGNA_ENGINE;if(e)return{cmd:e,prefix:[],label:e};try{let n=U(import.meta.url).resolve("@earendil-works/pi-coding-agent/package.json"),s=E(n),t=JSON.parse(A(n,"utf8")),p=typeof t.bin=="string"?t.bin:t.bin?.pi;if(p){let c=o(s,p);if(l(c))return{cmd:process.execPath,prefix:[c],label:c}}}catch{}return{cmd:"pi",prefix:[],label:"runtime (PATH)"}}var{cmd:z,prefix:J,label:V}=H(),S=w(z,[...J,...i],{stdio:"inherit",env:M});S.on("error",e=>{e&&e.code==="ENOENT"&&(process.stderr.write(`[regna] Runtime executable not found (${V}). Reinstall (npm i -g @hyperez/regna-code) or set REGNA_ENGINE.
`),process.exit(127)),process.stderr.write(`[regna] Failed to start the runtime: ${e?.message??String(e)}
`),process.exit(1)});S.on("exit",(e,r)=>{if(r){process.kill(process.pid,r);return}process.exit(e??0)});
