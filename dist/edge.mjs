var c={},h=new TextDecoder;c.show=async function(e){let n=await Deno.run({stdout:"piped",cmd:["wg","show",e]}).output(),o=h.decode(n).split(`

`),t=[],s;return o.forEach(function(r){let d=r.slice(0,r.indexOf(": ")),i={};d=="peer"?(i.type="peer",r.split(`
`).forEach(function(a){let l=a.indexOf(": "),p=a.slice(0,l),u=a.slice(l+2);p=="peer"?i.pub=u:p=="  endpoint"?i.end=u:p=="  allowed ips"&&(i.range=u.replaceAll(" ",""))})):d=="interface"&&(i.type="self",r.split(`
`).forEach(function(a){let l=a.indexOf(": "),p=a.slice(0,l),u=a.slice(l+2);p=="  public key"&&(i.pub=u)}),s=i),d?.length>2&&t.push(i)}),{ifname:e,peers:t,self:s}};c.setPeer=function(e,n,o=30){let t=["wg","set",e,"peer",n.pub,"persistent-keepalive",o.toString()],s;n.end&&(t.push("endpoint"),t.push(n.end)),n.range&&(t.push("allowed-ips"),t.push(n.range),n.range.indexOf(":")<0?s=`ip -4 route add ${n.range} dev ${e}`.split(" "):s=`ip -6 route add ${n.range} dev ${e}`.split(" ")),Deno.run({cmd:t}),Deno.run({cmd:s})};c.delPeer=function(e,n){Deno.run({cmd:["wg","set",e,"peer",n]})};var f=Deno.args[0]||"edge.json";console.info(`Reading configuration from: ${f}`);var g="{}";try{g=await Deno.readTextFile(f)}catch{}var b=JSON.parse(g),w=async function(e){let n=new WebSocket(`${e.registry}/messages`.replace("http","ws"));console.debug(`Connecting to the registry of ${e.network}...`),n.addEventListener("open",async function(){console.debug(`Connected to the registry of ${e.network}.`);let o=await(await fetch(`${e.registry}/get/${e.netreg||e.network}/${e.pubKey}`)).json();o.peers.forEach(t=>{if(t.pub!=e.pubKey){let s={pub:t.pub,range:t.range};if(!t.end){console.debug(`Ignored peer ${t.pub}.`);return}t.type=="self"?(s.end=t.end,console.debug(`Connected to root server ${t.pub}.`)):console.debug(`Accepted peer ${t.pub} for connection.`),c.setPeer(e.network,s,o.heartbeat)}}),setTimeout(()=>{fetch(`${e.registry}/update/${e.netreg||e.network}/${e.pubKey}`,{method:"post"}),console.debug(`Sent peer update message to the registry of ${e.network}.`)},1e4)}),n.addEventListener("message",async function(o){switch(JSON.parse(o.data).t){case"peerUpdate":{let s=await(await fetch(`${e.registry}/get/${e.netreg||e.network}/${e.pubKey}`)).json();s.peers.forEach(r=>{if(r.pub!=e.pubKey){let d={pub:r.pub,range:r.range};if(!r.end||r.type=="self"){console.debug(`Ignored peer ${r.pub}.`);return}else r.pub!=e.pubKey&&(console.debug(`Connected to peer ${r.pub}`),d.end=r.end);c.setPeer(e.network,d,s.heartbeat)}});break}}}),n.addEventListener("close",()=>{console.debug(`Connection to the registry of ${e.network} closed.`)}),e.ws=n};b.forEach(w);var y=JSON.stringify({t:"ping",d:"SYN"}),k=setInterval(async function(){b.forEach(e=>{e.ws.readyState==1?e.ws.send(y):(console.debug(`Network registry ${e.network} not ready. Restarting...`),w(e))})},2e4);
