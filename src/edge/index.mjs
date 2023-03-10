"use strict";

import {wgCmd} from "../wireguard/cmd.js";

// Read file content
let confPath = Deno.args[0] || "edge.json";
console.info(`Reading configuration from: ${confPath}`);
let confText = "{}";
try {
	confText = await Deno.readTextFile(confPath);
} catch (err) {};
let conf = JSON.parse(confText);

let startSession = async function (e) {
	let ws = new WebSocket(`${e.registry}/messages`.replace("http", "ws"));
	console.debug(`Connecting to the registry of ${e.network}...`);
	ws.addEventListener("open", async function () {
		console.debug(`Connected to the registry of ${e.network}.`);
		// Get all peers
		let regInfo = await(await fetch(`${e.registry}/get/${e.netreg || e.network}/${e.pubKey}`)).json();
		//console.debug(regInfo);
		// Connect to the root server, and add all peers
		regInfo.peers.forEach((e0) => {
			if (e0.pub != e.pubKey) {
				let target = {
					pub: e0.pub,
					range: e0.range
				};
				if (!e0.end) {
					console.debug(`Ignored peer ${e0.pub}.`);
					return;
				};
				if (e0.type == "self") {
					target.end = e0.end;
					console.debug(`Connected to root server ${e0.pub}.`);
				} else {
					console.debug(`Accepted peer ${e0.pub} for connection.`);
				};
				wgCmd.setPeer(e.network, target, regInfo.heartbeat);
			};
		});
		// Send a peer update message
		setTimeout(() => {
			fetch(`${e.registry}/update/${e.netreg || e.network}/${e.pubKey}`, {method: "post"});
			console.debug(`Sent peer update message to the registry of ${e.network}.`);
		}, 10000);
	});
	ws.addEventListener("message", async function (ev) {
		let msg = JSON.parse(ev.data);
		switch (msg.t) {
			case "peerUpdate": {
				let regInfo = await(await fetch(`${e.registry}/get/${e.netreg || e.network}/${e.pubKey}`)).json();
				regInfo.peers.forEach((e0) => {
					if (e0.pub != e.pubKey) {
						let target = {
							pub: e0.pub,
							range: e0.range
						};
						if (!e0.end || e0.type == "self") {
							console.debug(`Ignored peer ${e0.pub}.`);
							return;
						} else if (e0.pub != e.pubKey) {
							console.debug(`Connected to peer ${e0.pub}`);
							target.end = e0.end;
						};
						wgCmd.setPeer(e.network, target, regInfo.heartbeat);
					};
				});
				break;
			};
		};
	});
	ws.addEventListener("close", () => {
		console.debug(`Connection to the registry of ${e.network} closed.`);
	});
	e.ws = ws;
};

// Establish WebSocket connections
conf.forEach(startSession);

// Start heartbeat
let beatStr = JSON.stringify({t:"ping",d:"SYN"});
let heartbeat = setInterval(async function () {
	conf.forEach((e) => {
		if (e.ws.readyState == 1) {
			e.ws.send(beatStr);
		} else {
			console.debug(`Network registry ${e.network} not ready.`);
		};
	});
}, 20000);
