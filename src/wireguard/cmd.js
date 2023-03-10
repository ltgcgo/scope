"use strict";

let wgCmd = {},
utf8Dec = new TextDecoder();

wgCmd.show = async function (network) {
	let outRaw = await(Deno.run({
		stdout: "piped",
		cmd: ["wg", "show", network]
	})).output();
	let outChunks = utf8Dec.decode(outRaw).split("\n\n");
	let peerList = [], selfInfo;
	outChunks.forEach(function (e) {
		let type = e.slice(0, e.indexOf(": ")),
		peerDesc = {};
		if (type == "peer") {
			// Peer info
			peerDesc.type = "peer";
			e.split("\n").forEach(function (e1) {
				let spIdx = e1.indexOf(": "),
				field = e1.slice(0, spIdx),
				value = e1.slice(spIdx + 2);
				if (field == "peer") {
					peerDesc.pub = value;
				} else if (field == "  endpoint") {
					peerDesc.end = value;
				} else if (field == "  allowed ips") {
					peerDesc.range = value.replaceAll(" ", "");
				};
			});
		} else if (type == "interface") {
			// Own info
			peerDesc.type = "self";
			e.split("\n").forEach(function (e1) {
				let spIdx = e1.indexOf(": "),
				field = e1.slice(0, spIdx),
				value = e1.slice(spIdx + 2);
				if (field == "  public key") {
					peerDesc.pub = value;
				};
			});
			// Finish
			selfInfo = peerDesc;
		};
		if (type?.length > 2) {
			peerList.push(peerDesc);
		};
	});
	return {
		ifname: network,
		peers: peerList,
		self: selfInfo
	};
};
wgCmd.setPeer = function (network, peerInfo, heartbeat = 30) {
	let assembledCmd = ["wg", "set", network, "peer", peerInfo.pub, "persistent-keepalive", heartbeat.toString()];
	let ipRouteCmd;
	if (peerInfo.end) {
		assembledCmd.push("endpoint");
		assembledCmd.push(peerInfo.end);
	};
	if (peerInfo.range) {
		assembledCmd.push("allowed-ips");
		assembledCmd.push(peerInfo.range);
		if (peerInfo.range.indexOf(":") < 0) {
			ipRouteCmd = `ip -4 route add ${peerInfo.range} dev ${network}`.split(" ");
		} else {
			ipRouteCmd = `ip -6 route add ${peerInfo.range} dev ${network}`.split(" ");
		};
	};
	Deno.run({cmd: assembledCmd});
	Deno.run({cmd: ipRouteCmd});
};
wgCmd.delPeer = function (network, pubKey) {
	Deno.run({cmd: ["wg", "set", network, "peer", pubKey]});
};

export {
	wgCmd
};
