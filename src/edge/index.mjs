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
		console.debug(regInfo);
		// Connect to all available peers
	});
	ws.addEventListener("close", () => {
		console.debug(`Connection to the registry of ${e.network} closed.`);
		setTimeout(() => {
			startSession(e);
		}, 3000);
	});
	e.ws = ws;
};

// Establish WebSocket connections
conf.forEach(startSession);

// Start heartbeat
let beatStr = JSON.stringify({t:"ping",d:"SYN"});
let heartbeat = setInterval(async function () {
	conf.forEach((e) => {
		e.send(beatStr);
	});
}, 20000);
