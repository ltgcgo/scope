var d={},y=new TextDecoder;d.show=async function(e){let t=await Deno.run({stdout:"piped",cmd:["wg","show",e]}).output(),i=y.decode(t).split(`

`),n=[],u;return i.forEach(function(a){let f=a.slice(0,a.indexOf(": ")),s={};f=="peer"?(s.type="peer",a.split(`
`).forEach(function(o){let r=o.indexOf(": "),l=o.slice(0,r),c=o.slice(r+2);l=="peer"?s.pub=c:l=="  endpoint"?s.end=c:l=="  allowed ips"&&(s.range=c.replaceAll(" ",""))})):f=="interface"&&(s.type="self",a.split(`
`).forEach(function(o){let r=o.indexOf(": "),l=o.slice(0,r),c=o.slice(r+2);l=="  public key"&&(s.pub=c)}),u=s),f?.length>2&&n.push(s)}),{ifname:e,peers:n,self:u}};d.setPeer=function(e,t,i=30){let n=["wg","set",e,"peer",t.pub,"persistent-keepalive",i.toString()];t.end&&(n.push("endpoint"),n.push(t.end)),t.range&&(n.push("allowed-ips"),n.push(t.range)),Deno.run({cmd:n})};d.delPeer=function(e,t){Deno.run({cmd:["wg","set",e,"peer",t]})};var p=Deno.args[0]||"edge.json";console.info(`Reading configuration from: ${p}`);var g="{}";try{g=await Deno.readTextFile(p)}catch{}var h=JSON.parse(g),w=async function(e){let t=new WebSocket(`${e.registry}/messages`.replace("http","ws"));console.debug(`Connecting to the registry of ${e.network}...`),t.addEventListener("open",async function(){console.debug(`Connected to the registry of ${e.network}.`);let i=await(await fetch(`${e.registry}/get/${e.netreg||e.network}/${e.pubKey}`)).json();console.debug(i)}),t.addEventListener("close",()=>{console.debug(`Connection to the registry of ${e.network} closed.`),setTimeout(()=>{w(e)},3e3)}),e.ws=t};h.forEach(w);var b=JSON.stringify({t:"ping",d:"SYN"}),$=setInterval(async function(){h.forEach(e=>{e.send(b)})},2e4);