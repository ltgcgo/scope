# Scope

**Scope** is an easy-to-setup WireGuard meshing utility that serves WireGuard peer information via WebSockets (for connectivity checking) and web APIs, inspired by the now poorly-maintained [`wgsd`](https://github.com/jwhited/wgsd). This allows use cases like:
* Building a mesh of WireGuard peers from a central registry
* Dynamic discovery of WireGuard endpoints
* Announce IP changes whenever possible
* UDP hole punching if under full cone NAT

The name "Scope" is a reference to _Scope Lens_ in [Shifting Melodies](https://www.fimfiction.net/story/258497/shifting-melodies), a changeling with impressive hivemind abilities.

⚠️ Scope is a Deno program. Node.js support will not be considered.

## Installation
1. Install [Deno](https://deno.land).
1. Download the respective script from either `/dist` or releases.
  * `registry.js` - Scope server for serving peer information.
  * `edge.js` - Scope client for automatically managing edge configurations.
  * `browser.js` - Allows debugging directly from the browser.
1. If the current user can modify WireGuard settings, execute the scripts via `deno run --allow-read --allow-net --allow-run`.

## Configuration Syntax
`edge.js` and `browser.js` doesn't require any configuration file.
### Registry
```
{
	"listen": "127.0.0.1:8080",
	"prefix": "",
	"heartbeat": 20,
	"serveMode": "whitelist", // or blacklist
	"networks": [ // acts accordingly with serveMode
		"interface-1"
	],
	"self": {
		"pub": "JeZl...",
		"end": "192.0.2.1:51820",
		"range": "10.0.0.254/32"
	}
}
```

## API
### `WS ${prefix}/messages`
Sends and receives WebSocket messages.
```
{
	"t": "<type>",
	"d": "<data>"
}
```
#### `ping` message
Used to initiate observable pings. Data can either be "SYN" for outgoing messages, or "ACK" for incoming messages.
#### `peerUpdate` message
Used to notify edges peer updates.
### `GET ${prefix}/networks`
Gets all of the available interfaces.
```
["interface-1", "interface-2", ...]
```
### `GET ${prefix}/get/<network>/<pubKey>`
Gets the registry. Will only reply config data if the provided `pubKey` is listed in the registry. Registry only.
```
{
	"ifname": "<network>",
	"heartbeat": 20, // Global PersistentKeepalive
	"self": {
		"type": "self",
		"pub": "JeZl...",
		"end": "192.0.2.1:51820",
		"range": "10.0.0.254/32"
	},
	"peer": [{
		"type": "edge",
		"pub": "xScV...",
		"end": "192.0.2.2:10362",
		"range": "10.0.0.1/32"
	}, {
		"type": "edge",
		"pub": "syKB...",
		"end": "192.0.2.3:51496",
		"range": "10.0.0.2/32"
	}, ...]
}
```
### `POST ${prefix}/update/<peer ID>`
Send a peer update message to the rest of the network.
### `GET ${prefix}/detail/<network>/<peer ID>`
Fetches peer network information to the server.
### `PUT ${prefix}/detail/<network>/<peer ID>`
Uploads peer network information to the server.
```
{
	"ifname": "<network>",
	"heartbeat": 20, // Global PersistentKeepalive
	"self": {
		"pub": "JeZl...",
		"end": "192.0.2.1:51820",
		"range": "10.0.0.254/32"
	},
	"peer": [{
		"type": "edge",
		"pub": "xScV...",
		"end": "192.0.2.2:10362",
		"range": "10.0.0.1/32",
		"sum": 200, // observable average latency
		"mode": "direct", // or leastSum
		"leastSource": "" // public key of the upstream
	}, {
		"type": "edge",
		"pub": "syKB...",
		"end": "192.0.2.3:51496",
		"range": "10.0.0.2/32",
		"sum": 200,
		"mode": "leastSum",
		"leastSource": "xScV..."
	}, ...]
}
```
