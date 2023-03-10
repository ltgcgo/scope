"use strict";

import {wgCmd} from "../wireguard/cmd.js";
import {WebRouter} from "./router.js";

let badReq;

let wsPool = [];

let api = new WebRouter();
api.handle("/networks", async function (path) {
	if (request.method != "GET") {
		return badReq;
	};
	return new Response(conf.networks, {headers: {"Content-Type": "application/json"}});
});
api.handle("/messages", async function (path, request, clientIp) {
	if (request.method != "GET") {
		return badReq;
	};
	let {socket, response} = Deno.upgradeWebSocket(request);
	socket.addEventListener("open", () => {
		wsPool.push(socket);
		console.info(`New WS connection is up.`);
	});
	socket.addEventListener("message", (ev) => {
		let json = JSON.parse(ev.data);
		switch (json.t) {
			case "ping": {
				socket.send(JSON.stringify({t:"ping",d:"ACK"}));
				break;
			};
			default: {
				socket.send(JSON.stringify({t:"error",d:"unknownType"}));
			};
		};
		console.info(ev.data);
	});
	socket.addEventListener("close", () => {
		wsPool.splice(wsPool.indexOf(socket), 1);
		console.info(`One WS connection is down.`);
	});
	return response;
});
api.handle("/update/", async function (path, request) {
	if (request.method != "POST") {
		return badReq;
	};
	let segs = path.split("/");
	let peers = [];
	(await wgCmd.show(segs[0])).peers.forEach((e) => {
		peers.push(e.pub);
	});
	if (peers.indexOf(segs[0]) < 0) {
		return new Response(`{"ifname":"${segs[0]}", "error": "noPermission"}`, {status: 403});
	};
	let msg = JSON.stringify({t:"peerUpdate",d:segs[0]});
	wsPool.forEach(async function(e) {
		e.send(msg);
	});
	return new Response(`OK`);
});
api.handle("/detail/", async function (path, request) {
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
	return await api.reply(`${url.pathname}${url.search}${url.hash}`, request, clientIp);
};

export {
	handleRequest
};
