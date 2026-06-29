#!/usr/bin/env node
import{spawn as $}from"node:child_process";import{fileURLToPath as M}from"node:url";import{dirname as v,join as a}from"node:path";import{existsSync as m,readFileSync as I,writeFileSync as j,mkdirSync as b,unlinkSync as B,chmodSync as K}from"node:fs";import{homedir as Y}from"node:os";import{createInterface as q}from"node:readline";var z=v(M(import.meta.url)),g=v(z),A=a(g,"extensions"),x=a(g,"themes","regna.json"),R=a(g,"APPEND_SYSTEM.md"),k="https://regnax.ai/v1",H="regna/regna-1",N=a(Y(),".regna"),E=a(N,"auth.json"),P=a(N,"engine"),u=process.argv.slice(2),h=(...e)=>u.some(t=>e.some(n=>!!(t===n||t.startsWith(`${n}=`)||/^-[a-z]$/i.test(n)&&t.startsWith(n)&&t.length>n.length)));function _(){for(let e of[a(g,"package.json"),a(g,"..","package.json")])try{let t=JSON.parse(I(e,"utf8")).version;if(t)return`v${t}`}catch{}return""}var J=`Regna Code ${_()} - a terminal coding agent on Regna

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
  /regna-brand        toggle the Regna Code branding
  /regna-docs <q>     document-grounded query (requires REGNA_DOCS_ENABLED=1)
  /exit               exit Regna Code
  /compact            compact the session context

Environment:
  REGNA_API_KEY       Regna API key (optional once logged in)
  REGNA_BASE_URL      Regna API base URL (default https://regnax.ai/v1)
  REGNA_MODEL         starting model (overrides the auto-detected gateway model)
  REGNA_POLICY        network egress guard: off | warn | enforce

Docs: https://github.com/HyperEZ/regna-code
`;function V(){try{let e=JSON.parse(I(E,"utf8"));return e&&typeof e.apiKey=="string"?e:null}catch{return null}}function W(e){b(N,{recursive:!0}),j(E,`${JSON.stringify(e,null,2)}
`);try{K(E,384)}catch{}}function Z(){try{return B(E),!0}catch{return!1}}function Q(e){try{return`${new URL(e).origin}/console`}catch{return"https://regnax.ai/console"}}function X(e){try{let[t,n]=process.platform==="darwin"?["open",[e]]:process.platform==="win32"?["cmd",["/c","start","",e]]:["xdg-open",[e]];$(t,n,{stdio:"ignore",detached:!0}).unref()}catch{}}async function G(e,t){try{let n=new AbortController,r=setTimeout(()=>n.abort(),8e3),s=await fetch(`${e.replace(/\/+$/,"")}/models`,{headers:{Authorization:`Bearer ${t}`},signal:n.signal});if(clearTimeout(r),s.status===401||s.status===403)return{status:"invalid",ids:[]};if(!s.ok)return{status:"unknown",ids:[]};let o=await s.json().catch(()=>({}));return{status:"ok",ids:Array.isArray(o?.data)?o.data.map(d=>d&&typeof d.id=="string"?d.id:"").filter(Boolean):[]}}catch{return{status:"unknown",ids:[]}}}function ee(e){let t=(e||"").trim();if(!t)return"";/^https?:\/\//i.test(t)||(t=`http://${t}`);try{let n=new URL(t),r=`${n.origin}${n.pathname}`.replace(/\/+$/,"");return/\/v\d+$/.test(r)||(r=`${r}/v1`),r}catch{return""}}function te(){let e=q({input:process.stdin}),t=[],n=[],r=!1;return e.on("line",o=>{n.length?n.shift()(o):t.push(o)}),e.on("close",()=>{for(r=!0;n.length;)n.shift()(null)}),{ask:o=>(process.stdout.write(o),new Promise(i=>{t.length?i(t.shift()):r?i(null):n.push(i)})),close:()=>e.close()}}async function ne(e){return process.stdout.write(`
  Regna Code ${_()}
  Choose how to connect:

    1) Online   - Regna cloud (regnax.ai)
    2) Offline  - air-gapped / self-hosted gateway

`),(await e("  Select [1]: ")||"").trim()==="2"?"offline":"online"}async function se(e){let t=k,n=Q(t);process.stdout.write(`
  Online mode (Regna cloud).
  1) Get an API key at ${n}
  2) Paste it below.

`),X(n);let r=(await e("  API key: ")||"").trim();r||(process.stderr.write(`  No key entered. Aborting.
`),process.exit(1));let{status:s}=await G(t,r);return s==="invalid"&&(process.stderr.write(`  That key was rejected. Run: regna login
`),process.exit(1)),{mode:"online",baseUrl:t,apiKey:r}}async function re(e){process.stdout.write(`
  Offline mode (air-gapped).
  Point Regna Code at your internal gateway (OpenAI-compatible /v1).

`);let t=(await e("  Gateway URL [http://localhost:8077/v1]: ")||"").trim(),n=ee(t)||"http://localhost:8077/v1",r=(await e("  API key: ")||"").trim();r||(process.stderr.write(`  No key entered. Aborting.
`),process.exit(1));let{status:s,ids:o}=await G(n,r);s==="invalid"&&(process.stderr.write(`  That key was rejected by the gateway. Run: regna login
`),process.exit(1));let i="regna/default";if(s==="ok"&&o.length>0){let d=o.filter(y=>y==="default"||!y.includes("/")),c=d.length?d:o;if(c.length===1)i=`regna/${c[0]}`;else{process.stdout.write(`
  Models served by the gateway:
`),c.forEach((D,F)=>process.stdout.write(`    ${F+1}) ${D}
`));let y=(await e(`
  Default model [1]: `)||"").trim(),U=Math.max(1,Math.min(c.length,parseInt(y||"1",10)||1))-1;i=`regna/${c[U]}`}}else process.stdout.write(`  (Could not list models now; will use the gateway's active model.)
`);return{mode:"offline",baseUrl:n,apiKey:r,model:i}}async function O(e){let{ask:t,close:n}=te();try{let s=(e||await ne(t))==="offline"?await re(t):await se(t);return W(s),process.stdout.write(`
  Saved. Mode: ${s.mode}${s.model?`, default model: ${s.model}`:""}.

`),s}finally{n()}}(h("--help","-h")||u[0]==="help")&&(process.stdout.write(J),process.exit(0));(h("--version")||u[0]==="version")&&(process.stdout.write(`Regna Code ${_()}
`),process.exit(0));if(u[0]==="login"){let e=u[1]==="online"||u[1]==="offline"?u[1]:void 0;await O(e),process.exit(0)}u[0]==="logout"&&(process.stdout.write(Z()?`Logged out.
`:`Not logged in.
`),process.exit(0));var l=null,f=(process.env.REGNA_API_KEY||"").trim();f?l={mode:process.env.REGNA_OFFLINE==="1"?"offline":"online",apiKey:f}:(l=V(),l?.apiKey?f=l.apiKey.trim():process.stdin.isTTY&&process.stdout.isTTY?(l=await O(),f=l.apiKey.trim()):(process.stderr.write(`[regna] Not logged in. Run: regna login
`),process.exit(1)));async function oe(e,t){try{let n=new AbortController,r=setTimeout(()=>n.abort(),4e3),s;try{s=await fetch(`${e.replace(/\/+$/,"")}/models`,{headers:{Authorization:`Bearer ${t}`},signal:n.signal})}finally{clearTimeout(r)}if(!s.ok)return null;let o=await s.json(),d=(Array.isArray(o?.data)?o.data:[]).map(c=>c&&typeof c.id=="string"?c.id:"").filter(c=>/^regna-\d+$/.test(c)).sort();return d.length>0?`regna/${d[0]}`:null}catch{return null}}var L=process.env.REGNA_OFFLINE==="1"||l?.mode==="offline",S=(process.env.REGNA_BASE_URL||"").trim()||l?.baseUrl||k,w=(process.env.REGNA_MODEL||"").trim();w||(L?w=l?.model||"regna/default":w=await oe(S,f)||l?.model||H);process.env.REGNA_API_KEY=f;process.env.REGNA_BASE_URL=S;L&&(process.env.REGNA_OFFLINE||(process.env.REGNA_OFFLINE="1"),process.env.REGNA_POLICY||(process.env.REGNA_POLICY="enforce"));var p=[],ie=process.env.REGNA_DISCOVER==="1";if(!ie){p.push("--no-extensions");let e=["provider","policy","branding","context","exit","docs-search","docs-analysis"],t=s=>{let o=a(A,`${s}.js`);if(m(o))return o;let i=a(A,`${s}.ts`);return m(i)?i:null},n=e.map(s=>[s,t(s)]),r=n.filter(([,s])=>!s).map(([s])=>s);r.length>0&&(process.stderr.write(`[regna] Missing required extensions: ${r.join(", ")} (in ${A}). Install is corrupted. Aborting.
`),process.exit(1));for(let[,s]of n)p.push("-e",s)}!h("--theme")&&m(x)&&p.push("--theme",x);h("--system-prompt")||(m(R)||(process.stderr.write(`[regna] Missing required prompt: APPEND_SYSTEM.md (${R}). Install is corrupted. Aborting.
  (To set the prompt yourself on purpose, run with --system-prompt.)
`),process.exit(1)),p.push("--append-system-prompt",`@${R}`));h("--model","-m")||p.push("--model",w);p.push(...u);try{b(P,{recursive:!0})}catch{}var C={...process.env,PI_CODING_AGENT_DIR:P};process.env.REGNA_OFFLINE==="1"&&(C.PI_OFFLINE="1");function ae(){let e=a("node_modules","@earendil-works","pi-coding-agent","dist","cli.js"),t=g;for(let n=0;n<10;n++){let r=a(t,e);if(m(r))return r;let s=v(t);if(s===t)break;t=s}return null}function ce(){let e=process.env.REGNA_ENGINE;if(e)return{cmd:e,prefix:[],label:e};let t=ae();return t?{cmd:process.execPath,prefix:[t],label:t}:{cmd:"pi",prefix:[],label:"runtime (PATH)"}}var{cmd:le,prefix:de,label:ue}=ce(),T=$(le,[...de,...p],{stdio:"inherit",env:C});T.on("error",e=>{e&&e.code==="ENOENT"&&(process.stderr.write(`[regna] Runtime executable not found (${ue}). Reinstall (npm i -g @hyperez/regna-code) or set REGNA_ENGINE.
`),process.exit(127)),process.stderr.write(`[regna] Failed to start the runtime: ${e?.message??String(e)}
`),process.exit(1)});T.on("exit",(e,t)=>{if(t){process.kill(process.pid,t);return}process.exit(e??0)});
