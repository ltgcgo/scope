# Scope

**Scope** is an easy-to-setup WireGuard meshing utility that serves WireGuard peer information via WebSockets (for connectivity checking) and web APIs, inspired by the now poorly-maintained [`wgsd`](https://github.com/jwhited/wgsd). This allows use cases like:
* Building a mesh of WireGuard peers from a central registry
* Dynamic discovery of WireGuard endpoints
* Announce IP changes whenever possible
* UDP hole punching if under full cone NAT

The name "Scope" is a reference to _Scope Lens_ in [Shifting Melodies](https://www.fimfiction.net/story/258497/shifting-melodies), a changeling with impressive hivemind abilities.

⚠️ Scope is a Deno program. Node.js support will not be considered.

⚠️ Scope is experimental software. Use at your own risk in production environments.

⚠️ Despite having been tested in a network with 40-ish peers, Scope isn't yet tested in very large orchestration of mesh networks.

## How does it work?
1. A registry server is set up on the root WireGuard server.
2. An edge client connects to the registry server, then requests peer information.
3. Upon receiving peer information, the edge client tries to connect to the root WireGuard server, and adds all peers as available for connection.
4. After 10 seconds, the edge client then broadcasts a peer update towards all peers, and waits all other peers to connect.

## Installation
1. Install [Deno](https://deno.land).
2. Download the respective script from either `/dist` or releases.
  * `registry.js` - Scope server for serving peer information.
  * `edge.js` - Scope client for automatically managing edge configurations.
  * `browser.js` - Allows debugging directly from the browser.
3. If the current user can modify WireGuard settings, execute the scripts via `deno run --allow-read --allow-net --allow-run`.

## Configuration Syntax
`browser.js` doesn't require any configuration file.
### Registry
```json
{
	"listen": "127.0.0.1",
	"listenPort": 8080,
	"networks": [
		"interface-1"
	],
	"self": {
		"interface-1": {
			"heartbeat": 20,
			"end": "192.0.2.1:51820",
			"range": "10.0.0.254/32"
		}
	}
}
```
### Edge
```json
[{
	"registry": "https://example.com/pathPrefix",
	"network": "local-interface-1",
	"netreg": "interface-1",
	"pubKey": "ThisIsAVeryAwesomeWireGuardPublicKey"
}]
```
## API
### `WS ${prefix}/messages`
Sends and receives WebSocket messages.
```json
{
	"t": "<type>",
	"d": "<data>"
}
```
#### `ping` message
Used to initiate observable pings. Data can either be "SYN" for outgoing messages, or "ACK" for incoming messages.
#### `peerUpdate` message
Used to notify the edges about peer updates.
### `GET ${prefix}/networks`
Gets all of the available interfaces.
```json
["interface-1", "interface-2", ...]
```
### `GET ${prefix}/get/<network>/<pubKey>`
Gets the registry. Will only reply config data if the provided `pubKey` is listed in the registry. Registry only.
```json
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
Fetches peer network information to the server. Not implemented.
### `PUT ${prefix}/detail/<network>/<peer ID>`
Uploads peer network information to the server. Not implemented.
```json
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
