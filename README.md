# Scope: The Fabric Weaver
> **Warning**
> 
> - The current README.md is written for the fully functioning product, thus does not reflect the current progress of the project. Read [`ROADMAP.md`](./ROADMAP.md) for the current state of the project.
> - Scope is currently experimental. Despite being tested in real environments, use at your own risk in production.

**Scope** is an overlay network orchestration utility for WireGuard, designed to be a more capable version of the poorly-maintained [`wgsd`](https://github.com/jwhited/wgsd), catering both simple and complex use cases. Unlike to similar solutions like Headscale, the central registry is advisory, providing the peers information regarding endpoints and capabilities, and it's up to the peers to decide the final connectivity topology.

When constrained to specific environments, Scope is easily configured without much need for understanding of the network, however more advanced setups will require network knowledge. It's flexible, partially-decentralized yet explicit design makes it attractive to people who want control of the overall networking topology, or simpler multi-site connectivity without SD-WAN, both over an unpredictable network. When other solutions fail, give Scope a try.

The name "Scope" is a reference to _Scope Lens_ in [_Shifting Melodies_](https://www.fimfiction.net/story/258497/), a changeling with impressive hivemind abilities.

## Overall design
### Use cases
- Layer post-quantum key deriviation on top, with or without taking control of the network.
- Manage simple star networks with dynamic peers without constant manual configuration.
- UDP hole punch if under open UDP NAT (endpoint independent mapping).
- Build a resilient mesh-like network, preferring direct connections with relay fallbacks.
- Maintain connectivity with dynamic peer joins, migrations and leaves.
- Connect to various private networks behind NAT (e.g. homelabs, VLAN, SD-WAN-like backbones).
- Experiment with various network topologies.

### Goals
- Adaptive against changes
- Failure resilience
- Partial decentralization with control
- Post-quantum resistance
...

### Non-goals
- Censorship circumvention: Scope only orchestrates networks, it doesn't try to defeat traffic fingerprinting.
- Full mesh (Headscale): Registry does not decide network topology, only peers themselves do. Network admins decide how their networks should look like.
- Simple direct mesh (`wgsd` & Scope 0.0.x): It is a supported use case if all peers are relays, just that relayed connectivity is supported alongside direct connectivity and central relay fallback, marking Scope as a superset of simple direct meshes.
- Fully distributed overlay network (Yggdrasil): Routing has no protocol guarantees, it's only determined by local peers.
- SD-WAN: While capable of acting as an SD-WAN replacement under certain conditions, Scope is never centralized, and does not try to be deterministic or compliant to enterprise standards.
- Plug-and-Play anywhere: Out of simplified cases (all predictable relays, or all edges with a master relay), Scope expects network admins to have explicit understanding of their own networks.

### Levels
- Registry: The network advisor. Apart from the signed kill switch, it stays advisory for metadata like peer discovery, updates, ephemeral key exchanges and latency listing. Mostly does not directly control the network apart from indirect influencing, and it can sit behind reverse proxies. Information from registries apart from security-related features (e.g. cryptograhic identities of peers, kill switches) is always trusted, so that a compromised registry only allows degrading the network without a key leak. Especially important during peer joins.
- Relays: Must be trusted. Network nodes having full TUN capabilities, as well as an open UDP NAT. These relays will always attempt direct connections between each other, as well as reporting probed endpoint latencies. One or few of them may be configured as master relay for fallbacks, with their public IP addresses and ports already known. Relays run Kademlia-adjacent event exchanges to both reduce registry load and improve failure resilience.
- Pipes: If a relay does not directly connect to at least `ceil(N/2)` other relays after 2 minutes of joining (reported via successful KEX on both non-PQ and PQ), and does not report 90% reachability with peers reported to registry directly within the last 150 seconds (`1` for through other relays, `2` for through the master relay), registry will mark it as a `pipe` instead of a `relay` until the threshold is reached. Edges try to avoid pipes whenever possible. Pipes also run event exchanges.
- Edges: Can be untrusted. Do not participate in the overall routing, only letting the connected relay node(s). No requirement on the UDP NAT type, and may have a WireProxy fallback when TUN isn't available. If direct connection to other peers is desired, they may initialize with pre-defined STUN servers when no relays are available. Edges select a primary relay minimizing latency with a reasonable uptime, and largely rely on the connected primary relay for routing. But if the connected primary relay cannot reach certain peers, they will attempt connection to other relays and pipes for those unreachable peers.

### Workflow
When a peer tries to join the network, it will contact the registry first to fetch a list of available peers to connect to. If the peer is an edge, it will attempt to try finding a certain amount of relays with least latency and good uptime, which it will connect to, allowing the relays to control its routing. Edge peers may attempt direct connections between each other, however it is not guaranteed. If the peer is a relay, it will probe out-of-tunnel latency with reachable addresses first, then attempt direct connections with the address with the least latency of each peer.

### Full comparison table
|                | Scope     | Yggdrasil | Headscale | SD-WAN     | `wgsd`    |
| -------------- | --------- | --------- | --------- | ---------- | --------- |
| Design         | Partially decentralized overlay | Fully distributed route mesh | Distributed clients with centralized control | Policy-driven centralized overlay | Semi-dynamic P2P tunnels |
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

## FAQ
### How can I help ensure Scope's progress?
Scope's development is currently voluntary. If you want to let us fasttrack the release of a feature on the roadmap or align with Scope's vision, consider donating to the lead developers directly.

### How does Scope converge connectivity?
Edges mostly rely on relays for routing. Regardless of relays or pipes (denoted relays), they will always attempt direct connections with each other, only failing over to other relays or even the master relay when unavailable. This results in a resilient network due to dynamic adaptation, and except for connectivity loss invoking immediate adaptation, changes are dampened over 5 minutes.

### How does Scope mitigate problems caused by delayed info?
Scope employs active health and capability reporting, as well as key versioning for ephemeral key exchanges.

### How does Scope prevent unneeded PQ key encapsulation?
Scope peers decide on encapsulation/decapsultion based on apparent public key values. If the value is higher, the peer is the decapsulator between the pair.
