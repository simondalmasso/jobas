# Public MCP

JOBAS exposes a public, stateless, read-only Model Context Protocol surface for agents that need source-backed opportunity data.

## Endpoint

```text
POST https://jobas.simondalmasso44.workers.dev/mcp
```

No login or JOBAS account is required.

Protocol version:

```text
2025-06-18
```

Server:

```text
JOBAS Public MCP / 1.0.0
```

## Bootstrap

Agents should initialize the MCP and call `agent_bootstrap` first.

Typical flow:

```text
initialize
  -> tools/list
  -> agent_bootstrap
  -> search_jobs / list_jobs
  -> inspect_job
  -> rank_jobs (optional generic public quality ordering)
```

`rank_jobs` does not compute candidate fit. It orders by generic public quality signals such as source/risk evidence, freshness, compensation transparency and Argentina/LatAm compatibility. Candidate relevance belongs to the browser-local profile.

## Core tools

| Tool | Purpose |
| --- | --- |
| `agent_bootstrap` | Current counts, a small opportunity sample, microjobs and suggested next calls |
| `jobas_status` | Feed version, generation time and public counts |
| `list_jobs` | Paginated opportunity listing with public filters |
| `search_jobs` | Free-text search over public opportunity fields |
| `inspect_job` | Inspect one opportunity by stable job id |
| `rank_jobs` | Order results by generic public quality signals |
| `list_microjobs` | Direct-contact/platform opportunities that do not use the traditional CV flow |
| `list_sources` | Public source registry, source health and curated data surfaces |
| `mcp_status` | Protocol, cost posture, tool list and safety status |

The server also exposes bounded public GitHub research helpers and install-free skill routing. `tools/list` is the source of truth for the complete current tool set.

## Read-only guarantee

The MCP does not expose tools that:

- create, update or delete JOBAS user state;
- submit applications;
- send outreach or messages;
- write to profile, favorites, folders or application tracking;
- store provider credentials;
- start background browsers or crawlers;
- run model inference.

User workspace state is browser-local and is outside the MCP.

## Error behavior

JSON-RPC errors follow these conventions:

- `-32700` — invalid JSON / parse error;
- `-32600` — invalid JSON-RPC request;
- `-32601` — unsupported method;
- `-32602` — invalid tool or parameters;
- `-32603` — internal tool execution error.

HTTP `GET /mcp` is rejected with `405`. MCP notifications are accepted with `202`.

## Cost and rate boundary

MCP calls are on-demand. JOBAS does not add an MCP polling loop or an hourly trigger.

The MCP itself does not invoke paid AI. Public GitHub reads and JOBAS feed reads may be subject to upstream or platform rate limits. Clients should cache sensibly and avoid tight polling loops.

## Example JSON-RPC call

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_jobs",
    "arguments": {
      "query": "customer success",
      "argentina_only": true,
      "limit": 10
    }
  }
}
```

## Security

The MCP is intentionally public and returns public opportunity/source data only. It is not an authenticated gateway into browser-local JOBAS data.
