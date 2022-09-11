"use strict";

import {wgCmd} from "../wireguard/cmd.js";

let handleRequest = async function (request, clientIp) {
	return new Response(clientIp);
};

export {
	handleRequest
};
