"use strict";

import {serve} from "../../libs/std@deno/http/server.ts";
import {handleRequest} from "../core/webApi.js";

let confPath = Deno.args[0] || "registry.json";
console.info(`Reading configuration from: ${confPath}`);
let confText = "{}";
try {
	confText = await Deno.readTextFile(confPath);
} catch (err) {};
self.conf = JSON.parse(confText);

serve(async function (request, connInfo) {
	let clientIp = connInfo.remoteAddr.hostname;
	return await handleRequest(request, clientIp);
}, {hostname: conf.listen || "127.0.0.1", port: conf.listenPort || 8000});
