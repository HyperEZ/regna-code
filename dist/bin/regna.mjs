#!/usr/bin/env node
import{spawn as v}from"node:child_process";import{fileURLToPath as P}from"node:url";import{dirname as f,join as o}from"node:path";import{existsSync as p,readFileSync as w,writeFileSync as I,mkdirSync as N,unlinkSync as G,chmodSync as L}from"node:fs";import{homedir as k}from"node:os";import{createInterface as U}from"node:readline/promises";var $=f(P(import.meta.url)),c=f($),g=o(c,"extensions"),_=o(c,"themes","regna.json"),m=o(c,"APPEND_SYSTEM.md"),T="https://regnax.ai/v1",D="regna/regna-pro",h=o(k(),".regna"),d=o(h,"auth.json"),x=o(h,"engine"),a=process.argv.slice(2),u=(...e)=>a.some(t=>e.some(n=>!!(t===n||t.startsWith(`${n}=`)||/^-[a-z]$/i.test(n)&&t.startsWith(n)&&t.length>n.length)));function E(){for(let e of[o(c,"package.json"),o(c,"..","package.json")])try{let t=JSON.parse(w(e,"utf8")).version;if(t)return`v${t}`}catch{}return""}var C=`Regna Code ${E()} - a terminal coding agent on Regna

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
  /exit               exit Regna Code
  /compact            compact the session context

Environment:
  REGNA_API_KEY       Regna API key (optional once logged in)
  REGNA_BASE_URL      Regna API base URL (default https://regnax.ai/v1)
  REGNA_MODEL         starting model (default regna/regna-pro)
  REGNA_POLICY        network egress guard: off | warn | enforce

Docs: https://github.com/HyperEZ/regna-code
`;function A(){try{let e=JSON.parse(w(d,"utf8"));return e&&typeof e.apiKey=="string"?e:null}catch{return null}}function B(e,t){N(h,{recursive:!0}),I(d,`${JSON.stringify({apiKey:e,baseUrl:t},null,2)}
`);try{L(d,384)}catch{}}function O(){try{return G(d),!0}catch{return!1}}function j(e){try{return`${new URL(e).origin}/console`}catch{return"https://regnax.ai/console"}}function F(e){try{let[t,n]=process.platform==="darwin"?["open",[e]]:process.platform==="win32"?["cmd",["/c","start","",e]]:["xdg-open",[e]];v(t,n,{stdio:"ignore",detached:!0}).unref()}catch{}}async function K(e,t){try{let n=new AbortController,s=setTimeout(()=>n.abort(),8e3),r=await fetch(`${e.replace(/\/+$/,"")}/models`,{headers:{Authorization:`Bearer ${t}`},signal:n.signal});return clearTimeout(s),r.status===401||r.status===403?"invalid":r.ok?"ok":"unknown"}catch{return"unknown"}}async function S(){let e=(process.env.REGNA_BASE_URL||"").trim()||A()?.baseUrl||T,t=j(e);process.stdout.write(`
  Regna Code ${E()}
  Log in to continue.

  1) Get an API key at ${t}
  2) Paste it below.

`),F(t);let n=U({input:process.stdin,output:process.stdout}),s="";try{s=(await n.question("  API key: ")).trim()}finally{n.close()}s||(process.stderr.write(`  No key entered. Aborting.
`),process.exit(1));let r=await K(e,s);return r==="invalid"&&(process.stderr.write(`  That key was rejected. Check it and run: regna login
`),process.exit(1)),B(s,e),process.stdout.write(r==="ok"?`  Logged in.

`:`  Saved (could not verify right now).

`),s}(u("--help","-h")||a[0]==="help")&&(process.stdout.write(C),process.exit(0));(u("--version")||a[0]==="version")&&(process.stdout.write(`Regna Code ${E()}
`),process.exit(0));a[0]==="login"&&(await S(),process.exit(0));a[0]==="logout"&&(process.stdout.write(O()?`Logged out.
`:`Not logged in.
`),process.exit(0));var l=(process.env.REGNA_API_KEY||"").trim();if(!l){let e=A();e?.apiKey&&(l=e.apiKey.trim(),!process.env.REGNA_BASE_URL&&e.baseUrl&&(process.env.REGNA_BASE_URL=e.baseUrl))}if(!l)if(process.stdin.isTTY&&process.stdout.isTTY){if(l=await S(),!process.env.REGNA_BASE_URL){let e=A();e?.baseUrl&&(process.env.REGNA_BASE_URL=e.baseUrl)}}else process.stderr.write(`[regna] Not logged in. Run: regna login
`),process.exit(1);process.env.REGNA_API_KEY=l;var i=[],Y=process.env.REGNA_DISCOVER==="1";if(!Y){i.push("--no-extensions");let e=["provider","policy","branding","model","context","exit","docs-search","docs-analysis"],t=r=>{let R=o(g,`${r}.js`);if(p(R))return R;let y=o(g,`${r}.ts`);return p(y)?y:null},n=e.map(r=>[r,t(r)]),s=n.filter(([,r])=>!r).map(([r])=>r);s.length>0&&(process.stderr.write(`[regna] Missing required extensions: ${s.join(", ")} (in ${g}). Install is corrupted. Aborting.
`),process.exit(1));for(let[,r]of n)i.push("-e",r)}!u("--theme")&&p(_)&&i.push("--theme",_);u("--system-prompt")||(p(m)||(process.stderr.write(`[regna] Missing required prompt: APPEND_SYSTEM.md (${m}). Install is corrupted. Aborting.
  (To set the prompt yourself on purpose, run with --system-prompt.)
`),process.exit(1)),i.push("--append-system-prompt",`@${m}`));u("--model","-m")||i.push("--model",process.env.REGNA_MODEL||D);i.push(...a);try{N(x,{recursive:!0})}catch{}var q={...process.env,PI_OFFLINE:"1",PI_CODING_AGENT_DIR:x};function M(){let e=o("node_modules","@earendil-works","pi-coding-agent","dist","cli.js"),t=c;for(let n=0;n<10;n++){let s=o(t,e);if(p(s))return s;let r=f(t);if(r===t)break;t=r}return null}function H(){let e=process.env.REGNA_ENGINE;if(e)return{cmd:e,prefix:[],label:e};let t=M();return t?{cmd:process.execPath,prefix:[t],label:t}:{cmd:"pi",prefix:[],label:"runtime (PATH)"}}var{cmd:z,prefix:J,label:V}=H(),b=v(z,[...J,...i],{stdio:"inherit",env:q});b.on("error",e=>{e&&e.code==="ENOENT"&&(process.stderr.write(`[regna] Runtime executable not found (${V}). Reinstall (npm i -g @hyperez/regna-code) or set REGNA_ENGINE.
`),process.exit(127)),process.stderr.write(`[regna] Failed to start the runtime: ${e?.message??String(e)}
`),process.exit(1)});b.on("exit",(e,t)=>{if(t){process.kill(process.pid,t);return}process.exit(e??0)});
