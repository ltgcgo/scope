# Scope: The Fabric Weaver
> **Warning**
> 
> - The current README.md is written for the fully functioning product, thus does not reflect the current progress of the project. Read [`ROADMAP.md`](./ROADMAP.md) for the current state of the project.
> - Scope is currently experimental. Despite being tested in real environments, use at your own risk in production.

**Scope** is an overlay network orchestration utility for WireGuard, designed to be a more capable version of the poorly-maintained [`wgsd`](https://github.com/jwhited/wgsd). Unlike to similar solutions like Headscale, the central registry being the source of truth is only informative, providing the peers information regarding endpoints and capabilities, and it's up to the peers to decide the final connectivity topology.

When constrained to specific environments, Scope is easily configured without much need for understanding of the network, however any advanced setup will require network knowledge. It's flexible, partially-decentralized yet explicit design makes it attractive to people who want control of the overall networking topology over an unpredictable network. When other solutions fail, give Scope a try.

The name "Scope" is a reference to _Scope Lens_ in [_Shifting Melodies_](https://www.fimfiction.net/story/258497/), a changeling with impressive hivemind abilities.

## Overall design
### Use cases
- Layer post-quantum key deriviation on top, with or without taking control of the network.
- Manage simple star networks with dynamic peers without constant manual configuration.
- UDP hole punch if under open UDP NAT (endpoint independent mapping).
- Build a resilient mesh-like network, preferring direct connections with relay fallbacks.
- Maintain connectivity with dynamic peer joins, migrations and leaves.
- Connect to various private networks behind NAT (e.g. homelabs, VLAN).
- Experiment with various network topologies.

### Non-goals
- Full mesh (Headscale): Registry does not decide network topology, only peers themselves do. Network admins decide how their networks should look like.
- Direct mesh (`wgsd` & Scope 0.0.x): Relayed connectivity is supported alongside direct connectivity and central relay fallback. It can operate like that however if all peers are relays, as Scope's current operation is its superset.
- Fully distributed overlay network (Yggdrasil): Routing has no protocol guarantees, it's only determined by local peers.
- SD-WAN: While capable of acting as an SD-WAN replacement under certain conditions, Scope is never centralized, and does not try to be deterministic or compliant to enterprise standards.
- Plug-and-Play: Out of simplified cases (all predictable relays, or all edges with a master relay), Scope expects network admins to have explicit understanding of their own networks.
- Censorship circumvention: Scope only orchestrate networks, it doesn't try to defeat traffic analysis.

### Levels
- Registry: The single source of truth. Only informative for peer discovery, updates, ephemeral key exchanges and latency listing. Does not directly control the network, but it can sit behind reverse proxies.
- Relays: Network nodes having full TUN capabilities, as well as an open UDP NAT. These relays will always attempt direct connections between each other, as well as reporting probed endpoint latencies. One or few of them may be configured as master relay for fallbacks, with their public IP addresses and ports already known.
- Edges: Do not participate in the overall routing, only try to connect to the closest relay node(s). No requirement on the UDP NAT type, and may have a WireProxy fallback when TUN isn't available. If direct connection to other peers is desired, they may initialize with pre-defined STUN servers when no relays are available.

### Workflow
When a peer tries to join the network, it will contact the registry first to fetch a list of available peers to connect to. If the peer is an edge, it will attempt to try finding a certain amount of relays with least latency and good uptime, which it will connect to, allowing the relays to control its routing. Edge peers may attempt direct connections between each other, however it is not guaranteed. If the peer is a relay, it will probe out-of-tunnel latency with reachable addresses first, then attempt direct connections with the address with the least latency of each peer.

### Full comparison table
|                | Scope     | Yggdrasil | Headscale | SD-WAN     | `wgsd`    |
| -------------- | --------- | --------- | --------- | ---------- | --------- |
| Design         | Locally inferred decentralized overlay | Fully distributed route mesh | Distributed clients with centralized control | Policy-driven centralized overlay | Semi-dynamic P2P tunnels |
| Authority      | Registry (informative) | DHT | Registry | Policy | Registry |
| Peer autonomy  | High      | High      | Medium    | Low        | High      |
| NAT traversal  | Tiered    | N/A       | DERP      | Policy     | Open-only |
| Relaying       | Emergent  | All     | Coordinated | Gateway    | Manual    |
| Multi-hop      | Relays    | Peers     | Optional  | Policy     | None      |
| Abstraction    | Medium    | High      | High      | High       | Low       |
| Recovery       | Local     | Self-heal | Control   | Control    | Manual    |
| Predictability | Medium    | High      | High      | High       | High      |
| Observability  | Distributed | Distributed | Central | Central  | None      |
| Proxy fallback | WireProxy | YggStack  | gVisor    | Unknown    | None      |