# Cloudflare wildcard load balancer

Create one proxied Layer 7 load balancer for `*.apps.example.com` and one pool containing every host in the protected `RUNTIME_HOST` list. Configure an HTTPS monitor for `/healthz` with expected status `200`; set a Host override that routes through `kamal-proxy` if the origin requires one. Set an availability threshold appropriate to the configured pool and verify every endpoint before enabling wildcard traffic.

Origin firewalls should admit HTTP/HTTPS only from Cloudflare origin ranges (or Cloudflare Tunnel if adopted) and SSH only from trusted deployment egress. Keep origin certificates, zone, pool IDs, and API credentials in the platform administration boundary—not application repos.

Operational checks:

1. Confirm the Cloudflare pool and `RUNTIME_HOST` contain the same unique endpoints and each reports healthy.
2. Request two different app hostnames through the wildcard and verify correct Host routing.
3. Disable one endpoint and confirm traffic remains healthy on the remaining pool.
4. Re-enable it, wait for monitor quorum, then repeat one host at a time.
5. Review load-balancing event logs after changes.

There is no per-app DNS record, load balancer, placement registry, or routing database in the standard cell.
