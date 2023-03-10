"use strict";

import {BinaryMatch} from "../../libs/lightfelt@ltgcgo/ext/binMatch.js";

let WebRouter = class extends BinaryMatch {
	async reply(prefix, ...args) {
		let rawSeq = [], trimStr = "";
		let errorResp = new Response("API Not Found", {status: 404});
		Array.from(prefix).forEach(function (e) {
			rawSeq.push(e.charCodeAt(0));
		});
		let actorIdx = this.point(rawSeq);
		if (actorIdx > -1) {
			rawSeq.slice(this.pool[actorIdx].length).forEach(function (e) {
				trimStr += String.fromCharCode(e);
			});
			return (await this.pool[actorIdx].data(trimStr, ...args)) || errorResp;
		} else {
			return errorResp;
		};
	};
	handle(path, data) {
		let prefix = [];
		Array.from(path).forEach(function (e) {
			prefix.push(e.charCodeAt(0));
		});
		return this.add(prefix, data);
	};
	constructor(...args) {
		super(...args);
	};
};

export {
	WebRouter
};
