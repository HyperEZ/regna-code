#!/usr/bin/env node
import{spawn as x}from"node:child_process";import{fileURLToPath as D}from"node:url";import{dirname as R,join as i}from"node:path";import{existsSync as m,readFileSync as I,writeFileSync as F,mkdirSync as $,unlinkSync as M,chmodSync as j}from"node:fs";import{homedir as B}from"node:os";import{createInterface as K}from"node:readline";var Y=R(D(import.meta.url)),u=R(Y),E=i(u,"extensions"),_=i(u,"themes","regna.json"),A=i(u,"APPEND_SYSTEM.md"),k="https://regnax.ai/v1",q="regna/regna-pro",v=i(B(),".regna"),y=i(v,"auth.json"),P=i(v,"engine"),l=process.argv.slice(2),h=(...e)=>l.some(t=>e.some(n=>!!(t===n||t.startsWith(`${n}=`)||/^-[a-z]$/i.test(n)&&t.startsWith(n)&&t.length>n.length)));function N(){for(let e of[i(u,"package.json"),i(u,"..","package.json")])try{let t=JSON.parse(I(e,"utf8")).version;if(t)return`v${t}`}catch{}return""}var z=`Regna Code ${N()} - a terminal coding agent on Regna

Usage:
  regna [message...]                 start interactive, optionally with a first message
  regna "explain this repo"          run with a prompt
  regna -p "summarize changes" < /dev/null   headless/scripted (close stdin)

Auth:
  regna login                        choose Online/Offline and store credentials
  regna login online                 set up Online (Regna cloud) directly
  regna login offline                set up Offline (air-gapped gateway) directly
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
`;function H(){try{let e=JSON.parse(I(y,"utf8"));return e&&typeof e.apiKey=="string"?e:null}catch{return null}}function J(e){$(v,{recursive:!0}),F(y,`${JSON.stringify(e,null,2)}
`);try{j(y,384)}catch{}}function V(){try{return M(y),!0}catch{return!1}}function W(e){try{return`${new URL(e).origin}/console`}catch{return"https://regnax.ai/console"}}function Z(e){try{let[t,n]=process.platform==="darwin"?["open",[e]]:process.platform==="win32"?["cmd",["/c","start","",e]]:["xdg-open",[e]];x(t,n,{stdio:"ignore",detached:!0}).unref()}catch{}}async function b(e,t){try{let n=new AbortController,r=setTimeout(()=>n.abort(),8e3),s=await fetch(`${e.replace(/\/+$/,"")}/models`,{headers:{Authorization:`Bearer ${t}`},signal:n.signal});if(clearTimeout(r),s.status===401||s.status===403)return{status:"invalid",ids:[]};if(!s.ok)return{status:"unknown",ids:[]};let o=await s.json().catch(()=>({}));return{status:"ok",ids:Array.isArray(o?.data)?o.data.map(p=>p&&typeof p.id=="string"?p.id:"").filter(Boolean):[]}}catch{return{status:"unknown",ids:[]}}}function Q(e){let t=(e||"").trim();if(!t)return"";/^https?:\/\//i.test(t)||(t=`http://${t}`);try{let n=new URL(t),r=`${n.origin}${n.pathname}`.replace(/\/+$/,"");return/\/v\d+$/.test(r)||(r=`${r}/v1`),r}catch{return""}}function X(){let e=K({input:process.stdin}),t=[],n=[],r=!1;return e.on("line",o=>{n.length?n.shift()(o):t.push(o)}),e.on("close",()=>{for(r=!0;n.length;)n.shift()(null)}),{ask:o=>(process.stdout.write(o),new Promise(a=>{t.length?a(t.shift()):r?a(null):n.push(a)})),close:()=>e.close()}}async function ee(e){return process.stdout.write(`
  Regna Code ${N()}
  Choose how to connect:

    1) Online   - Regna cloud (regnax.ai)
    2) Offline  - air-gapped / self-hosted gateway

`),(await e("  Select [1]: ")||"").trim()==="2"?"offline":"online"}async function te(e){let t=k,n=W(t);process.stdout.write(`
  Online mode (Regna cloud).
  1) Get an API key at ${n}
  2) Paste it below.

`),Z(n);let r=(await e("  API key: ")||"").trim();r||(process.stderr.write(`  No key entered. Aborting.
`),process.exit(1));let{status:s}=await b(t,r);return s==="invalid"&&(process.stderr.write(`  That key was rejected. Run: regna login
`),process.exit(1)),{mode:"online",baseUrl:t,apiKey:r}}async function ne(e){process.stdout.write(`
  Offline mode (air-gapped).
  Point Regna Code at your internal gateway (OpenAI-compatible /v1).

`);let t=(await e("  Gateway URL [http://localhost:8077/v1]: ")||"").trim(),n=Q(t)||"http://localhost:8077/v1",r=(await e("  API key: ")||"").trim();r||(process.stderr.write(`  No key entered. Aborting.
`),process.exit(1));let{status:s,ids:o}=await b(n,r);s==="invalid"&&(process.stderr.write(`  That key was rejected by the gateway. Run: regna login
`),process.exit(1));let a="regna/default";if(s==="ok"&&o.length>0){let p=o.filter(w=>w==="default"||!w.includes("/")),f=p.length?p:o;if(f.length===1)a=`regna/${f[0]}`;else{process.stdout.write(`
  Models served by the gateway:
`),f.forEach((T,U)=>process.stdout.write(`    ${U+1}) ${T}
`));let w=(await e(`
  Default model [1]: `)||"").trim(),C=Math.max(1,Math.min(f.length,parseInt(w||"1",10)||1))-1;a=`regna/${f[C]}`}}else process.stdout.write(`  (Could not list models now; will use the gateway's active model.)
`);return{mode:"offline",baseUrl:n,apiKey:r,model:a}}async function G(e){let{ask:t,close:n}=X();try{let s=(e||await ee(t))==="offline"?await ne(t):await te(t);return J(s),process.stdout.write(`
  Saved. Mode: ${s.mode}${s.model?`, default model: ${s.model}`:""}.

`),s}finally{n()}}(h("--help","-h")||l[0]==="help")&&(process.stdout.write(z),process.exit(0));(h("--version")||l[0]==="version")&&(process.stdout.write(`Regna Code ${N()}
`),process.exit(0));if(l[0]==="login"){let e=l[1]==="online"||l[1]==="offline"?l[1]:void 0;await G(e),process.exit(0)}l[0]==="logout"&&(process.stdout.write(V()?`Logged out.
`:`Not logged in.
`),process.exit(0));var c=null,g=(process.env.REGNA_API_KEY||"").trim();g?c={mode:process.env.REGNA_OFFLINE==="1"?"offline":"online",apiKey:g}:(c=H(),c?.apiKey?g=c.apiKey.trim():process.stdin.isTTY&&process.stdout.isTTY?(c=await G(),g=c.apiKey.trim()):(process.stderr.write(`[regna] Not logged in. Run: regna login
`),process.exit(1)));var O=process.env.REGNA_OFFLINE==="1"||c?.mode==="offline",se=(process.env.REGNA_BASE_URL||"").trim()||c?.baseUrl||k,re=(process.env.REGNA_MODEL||"").trim()||c?.model||(O?"regna/default":q);process.env.REGNA_API_KEY=g;process.env.REGNA_BASE_URL=se;O&&(process.env.REGNA_OFFLINE||(process.env.REGNA_OFFLINE="1"),process.env.REGNA_POLICY||(process.env.REGNA_POLICY="enforce"));var d=[],oe=process.env.REGNA_DISCOVER==="1";if(!oe){d.push("--no-extensions");let e=["provider","policy","branding","model","context","exit","docs-search","docs-analysis"],t=s=>{let o=i(E,`${s}.js`);if(m(o))return o;let a=i(E,`${s}.ts`);return m(a)?a:null},n=e.map(s=>[s,t(s)]),r=n.filter(([,s])=>!s).map(([s])=>s);r.length>0&&(process.stderr.write(`[regna] Missing required extensions: ${r.join(", ")} (in ${E}). Install is corrupted. Aborting.
`),process.exit(1));for(let[,s]of n)d.push("-e",s)}!h("--theme")&&m(_)&&d.push("--theme",_);h("--system-prompt")||(m(A)||(process.stderr.write(`[regna] Missing required prompt: APPEND_SYSTEM.md (${A}). Install is corrupted. Aborting.
  (To set the prompt yourself on purpose, run with --system-prompt.)
`),process.exit(1)),d.push("--append-system-prompt",`@${A}`));h("--model","-m")||d.push("--model",re);d.push(...l);try{$(P,{recursive:!0})}catch{}var L={...process.env,PI_CODING_AGENT_DIR:P};process.env.REGNA_OFFLINE==="1"&&(L.PI_OFFLINE="1");function ie(){let e=i("node_modules","@earendil-works","pi-coding-agent","dist","cli.js"),t=u;for(let n=0;n<10;n++){let r=i(t,e);if(m(r))return r;let s=R(t);if(s===t)break;t=s}return null}function ae(){let e=process.env.REGNA_ENGINE;if(e)return{cmd:e,prefix:[],label:e};let t=ie();return t?{cmd:process.execPath,prefix:[t],label:t}:{cmd:"pi",prefix:[],label:"runtime (PATH)"}}var{cmd:ce,prefix:le,label:de}=ae(),S=x(ce,[...le,...d],{stdio:"inherit",env:L});S.on("error",e=>{e&&e.code==="ENOENT"&&(process.stderr.write(`[regna] Runtime executable not found (${de}). Reinstall (npm i -g @hyperez/regna-code) or set REGNA_ENGINE.
`),process.exit(127)),process.stderr.write(`[regna] Failed to start the runtime: ${e?.message??String(e)}
`),process.exit(1)});S.on("exit",(e,t)=>{if(t){process.kill(process.pid,t);return}process.exit(e??0)});
