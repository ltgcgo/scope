"use strict";

import {wgCmd} from "../wireguard/cmd.js";
import {WebRouter} from "./router.js";

let api = new WebRouter();
api.handle("/get/", async function (path, request, clientIp) {
	let segs = path.split("/");
	let obj = JSON.stringify(await wgCmd.show(segs[0]));
	if (obj.length > 2) {
		return new Response(obj);
	} else {
		return new Response(`Unknown interface "${segs[0]}".`, {status: 400});
	};
});

let handleRequest = async function (request, clientIp) {
	let url = new URL(request.url);
	return api.reply(`${url.pathname}${url.search}${url.hash}`, request, clientIp);
};

export {
	handleRequest
};
