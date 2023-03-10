function L(r,e={}){let{signal:t}=e;return t?.aborted?Promise.reject(new DOMException("Delay was aborted.","AbortError")):new Promise((n,s)=>{let o=()=>{clearTimeout(a),s(new DOMException("Delay was aborted.","AbortError"))},a=setTimeout(()=>{t?.removeEventListener("abort",o),n()},r);t?.addEventListener("abort",o,{once:!0})})}var w="Server closed",S=5,x=1e3,m=class{#r;#s;#i;#e=!1;#t=new Set;#n=new Set;#a;constructor(e){this.#r=e.port,this.#s=e.hostname,this.#i=e.handler,this.#a=e.onError??function(t){return console.error(t),new Response("Internal Server Error",{status:500})}}async serve(e){if(this.#e)throw new Deno.errors.Http(w);this.#d(e);try{return await this.#h(e)}finally{this.#f(e);try{e.close()}catch{}}}async listenAndServe(){if(this.#e)throw new Deno.errors.Http(w);let e=Deno.listen({port:this.#r??80,hostname:this.#s??"0.0.0.0",transport:"tcp"});return await this.serve(e)}async listenAndServeTls(e,t){if(this.#e)throw new Deno.errors.Http(w);let n=Deno.listenTls({port:this.#r??443,hostname:this.#s??"0.0.0.0",certFile:e,keyFile:t,transport:"tcp"});return await this.serve(n)}close(){if(this.#e)throw new Deno.errors.Http(w);this.#e=!0;for(let e of this.#t)try{e.close()}catch{}this.#t.clear();for(let e of this.#n)this.#o(e);this.#n.clear()}get closed(){return this.#e}get addrs(){return Array.from(this.#t).map(e=>e.addr)}async#l(e,t,n){let s;try{s=await this.#i(e.request,n)}catch(o){s=await this.#a(o)}try{await e.respondWith(s)}catch{return this.#o(t)}}async#c(e,t){for(;!this.#e;){let n;try{n=await e.nextRequest()}catch{break}if(n===null)break;this.#l(n,e,t)}this.#o(e)}async#h(e){let t;for(;!this.#e;){let n;try{n=await e.accept()}catch(i){if(i instanceof Deno.errors.BadResource||i instanceof Deno.errors.InvalidData||i instanceof Deno.errors.UnexpectedEof||i instanceof Deno.errors.ConnectionReset||i instanceof Deno.errors.NotConnected){t?t*=2:t=S,t>=1e3&&(t=x),await L(t);continue}throw i}t=void 0;let s;try{s=Deno.serveHttp(n)}catch{continue}this.#u(s);let o={localAddr:n.localAddr,remoteAddr:n.remoteAddr};this.#c(s,o)}}#o(e){this.#p(e);try{e.close()}catch{}}#d(e){this.#t.add(e)}#f(e){this.#t.delete(e)}#u(e){this.#n.add(e)}#p(e){this.#n.delete(e)}};function R(r){return r==="0.0.0.0"?"localhost":r}async function y(r,e={}){let t=e.port??8e3,n=e.hostname??"0.0.0.0",s=new m({port:t,hostname:n,handler:r,onError:e.onError});e?.signal?.addEventListener("abort",()=>s.close(),{once:!0});let o=s.listenAndServe();return t=s.addrs[0].port,"onListen"in e?e.onListen?.({port:t,hostname:n}):console.log(`Listening on http://${R(n)}:${t}/`),await o}var u={},C=new TextDecoder;u.show=async function(r){let e=await Deno.run({stdout:"piped",cmd:["wg","show",r]}).output(),t=C.decode(e).split(`

`),n=[],s;return t.forEach(function(o){let i=o.slice(0,o.indexOf(": ")),a={};i=="peer"?(a.type="peer",o.split(`
`).forEach(function(l){let c=l.indexOf(": "),h=l.slice(0,c),f=l.slice(c+2);h=="peer"?a.pub=f:h=="  endpoint"?a.end=f:h=="  allowed ips"&&(a.range=f.replaceAll(" ",""))})):i=="interface"&&(a.type="self",o.split(`
`).forEach(function(l){let c=l.indexOf(": "),h=l.slice(0,c),f=l.slice(c+2);h=="  public key"&&(a.pub=f)}),s=a),i?.length>2&&n.push(a)}),{ifname:r,peers:n,self:s}};u.setPeer=function(r,e,t=30){let n=["wg","set",r,"peer",e.pub,"persistent-keepalive",t.toString()];e.end&&(n.push("endpoint"),n.push(e.end)),e.range&&(n.push("allowed-ips"),n.push(e.range)),Deno.run({cmd:n})};u.delPeer=function(r,e){Deno.run({cmd:["wg","set",r,"peer",e]})};var E=function(r,e){let t=Math.min(r.length,e.length),n=r.slice(0,t),s=e.slice(0,t),o=0,i=0;for(;i<t&&o==0;)o=Math.sign(n[i]-s[i]),i++;return o},v=function(){this.pool=[],this.point=function(r,e=!1){if(this.pool.length>0){let t=this.pool.length,n=1<<Math.floor(Math.log2(t)),s=n,o=64;for(;n>=1&&o>=0;){if(o<=0)throw new Error("TTL reached.");if(s==t)s-=n;else{let a=E(r,this.pool[s]);switch(a){case 0:{o=0;break}case 1:{s+n<=t&&(s+=n);break}case-1:{s!=0&&(s-=n);break}default:console.warn(`Unexpected result ${a}.`)}}n=n>>1,o--}let i=!0;if(s>=this.pool.length)i=!1;else{let a=this;this.pool[s].forEach(function(l,c,h){i&&l!=r[c]&&(i=!1)}),!i&&E(r,this.pool[s])>0&&s++}return i||e?s:-1}else return e?0:-1},this.add=function(r,e){return r.data=e,this.pool.splice(this.point(r,!0),0,r),this},this.default=function(r){console.warn(`No match for "${r}". Default action not defined.`)},this.get=function(r){let e=this.point(r);if(e>-1)return this.pool[e].data;this.default(r)},this.run=function(r,...e){let t=this.point(r);t>-1?this.pool[t].data(r.slice(this.pool[t].length),...e):this.default(r,...e)}};var b=class extends v{reply(r,...e){let t=[],n="",s=new Response("API Not Found",{status:404});Array.from(r).forEach(function(i){t.push(i.charCodeAt(0))});let o=this.point(t);return o>-1?(t.slice(this.pool[o].length).forEach(function(i){n+=String.fromCharCode(i)}),this.pool[o].data(n,...e)||s):s}handle(r,e){let t=[];return Array.from(r).forEach(function(n){t.push(n.charCodeAt(0))}),this.add(t,e)}constructor(...r){super(...r)}};var p,g=[],d=new b;d.handle("/networks",function(r){return request.method!="GET"?p:new Response(conf.networks,{headers:{"Content-Type":"application/json"}})});d.handle("/messages",function(r,e,t){if(e.method!="GET")return p;let{socket:n,response:s}=Deno.upgradeWebSocket(e);return n.addEventListener("open",()=>{g.push(n)}),n.addEventListener("message",o=>{switch(JSON.parse(o.data).t){case"ping":{n.send(JSON.stringify({t:"ping",d:"ACK"}));break}default:n.send(JSON.stringify({t:"error",d:"unknownType"}))}}),n.addEventListener("close",()=>{g.splice(g.indexOf(n),1)}),s});d.handle("/update/",function(r,e){if(e.method!="POST")return p});d.handle("/detail/",function(r,e){e.method=="GET"||e.method=="PUT"});d.handle("/get/",async function(r,e){let t=r.split("/");if(e.method!="GET")return p;if(conf.networks.indexOf(t[0])<0)return new Response(`{"ifname":"${t[0]}", "error": "noPermission"}`,{status:403});let n=await u.show(t[0]);if(conf?.self[t[0]]){let o=conf?.self[t[0]];o?.end&&(n.self.end=o.end),o?.range&&(n.self.range=o.range),n.heartbeat=o.heartbeat||30}let s=JSON.stringify(n);return n.peers.length>0?new Response(s,{headers:{"Content-Type":"application/json"}}):new Response(`{"ifname":"${t[0]}", "error": "notFound"}`,{status:404})});var A=async function(r,e){let t=new URL(r.url);return p=new Response("Bad request",{status:400}),d.reply(`${t.pathname}${t.search}${t.hash}`,r,e)};var D=Deno.args[0]||"registry.json";console.info(`Reading configuration from: ${D}`);var T="{}";try{T=await Deno.readTextFile(D)}catch{}self.conf=JSON.parse(T);y(async function(r,e){let t=e.remoteAddr.hostname;return await A(r,t)},{hostname:conf.listen||"127.0.0.1",port:conf.listenPort||8e3});
