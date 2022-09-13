"use strict";

import {wgCmd} from "../wireguard/cmd.js";
import {WebRouter} from "./router.js";

let badReq;

let api = new WebRouter();
api.handle("/networks", function (path) {
	if (request.method != "GET") {
		return badReq;
	};
	return new Response(conf.networks, {headers: {"Content-Type": "application/json"}});
});
api.handle("/messages", function (path, request, clientIp) {
	if (request.method != "GET") {
		return badReq;
	};
});
api.handle("/update/", function (path, request) {
	if (request.method != "POST") {
		return badReq;
	};
});
api.handle("/detail/", function (path, request) {
	if (request.method == "GET") {
	} else if (request.method == "PUT") {
	};
});
api.handle("/get/", async function (path, request) {
	let segs = path.split("/");
	if (request.method != "GET") {
		return badReq;
	};
	if (conf.networks.indexOf(segs[0]) < 0) {
		return new Response(`{"ifname":"${segs[0]}", "error": "noPermission"}`, {status: 403});
	};
	let obj = await wgCmd.show(segs[0]);
	if (conf?.self[segs[0]]) {
		let selfInfo = conf?.self[segs[0]];
		if (selfInfo?.end) {
			obj.self.end = selfInfo.end;
		};
		if (selfInfo?.range) {
			obj.self.range = selfInfo.range;
		};
		// Add heartbeat
		obj.heartbeat = selfInfo.heartbeat || 30;
	};
	let objText = JSON.stringify(obj);
	if (obj.peers.length > 0) {
		return new Response(objText, {headers: {"Content-Type": "application/json"}});
	} else {
		return new Response(`{"ifname":"${segs[0]}", "error": "notFound"}`, {status: 404});
	};
});

let handleRequest = async function (request, clientIp) {
	let url = new URL(request.url);
	badReq = new Response(`Bad request`, {status: 400});
	return api.reply(`${url.pathname}${url.search}${url.hash}`, request, clientIp);
};

export {
	handleRequest
};
