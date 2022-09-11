"use strict";

import {serve} from "../../libs/std@deno/http/server.ts";
import {handleRequest} from "../core/webApi.js";

serve(async function (request, connInfo) {
	let clientIp = connInfo.remoteAddr.hostname;
	return await handleRequest(request, clientIp);
}, {port: 8362});
