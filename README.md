# bsp-mcp — Official BSP MCP Server

> Connects AI agents to the Biological Sovereignty Protocol via the Model Context Protocol
> Published by the Ambrósio Institute · [ambrosio.health](https://ambrosio.health) · [bsp.dev](https://bsp.dev)

---

## What is bsp-mcp?

The `bsp-mcp` server connects any MCP-compatible AI assistant (Claude, GPT, or any other) to the Biological Sovereignty Protocol — with **consent enforced on-chain**.

Without `bsp-mcp`, every AI platform would invent its own BSP integration. With it, there is one auditable, sovereign standard.

> "Ask your AI: *what does my blood test from last week mean for my longevity?*
> The AI reads your BioRecords — but only because you said yes."

---

## How It Works

```
User ──► AI Assistant (Claude, etc.)
              │
              │  MCP protocol
              ▼
         bsp-mcp server
              │
              │  AccessControl verification (Arweave)
              ▼
         User's BEO ──► BioRecords
```

1. User configures `bsp-mcp` in their AI assistant
2. AI requests access to BioRecords for a specific query
3. `bsp-mcp` verifies consent via the AccessControl smart contract
4. If consent is valid: BioRecords are returned to the AI in BSP format
5. AI generates contextual health insights from standardized data

**The user is always in control.** No consent = no access. Period.

---

## Installation

```bash
npx @bsp/mcp
```

Or add to your Claude Desktop / AI assistant MCP config:

```json
{
  "mcpServers": {
    "bsp": {
      "command": "npx",
      "args": ["@bsp/mcp"],
      "env": {
        "BSP_BEO_DOMAIN": "andre.bsp"
      }
    }
  }
}
```

---

## Available Tools

Once configured, the AI assistant gains access to these tools:

| Tool | Description | Consent Required |
|---|---|---|
| `bsp_get_biorecords` | Read BioRecords from the user's BEO | Yes — active session |
| `bsp_get_beo_summary` | Get a summary of the user's biological profile | Yes — active session |
| `bsp_resolve_biomarker` | Look up a BSP biomarker code | No — public taxonomy |
| `bsp_list_categories` | List available BSP taxonomy categories | No — public data |
| `bsp_check_consent` | Check current consent status | Yes — own BEO only |

---

## Security Model

The BSP MCP server follows the same consent philosophy as the BSP protocol itself:

- **No passive access** — the server only reads data when the user initiates a conversation that requires it
- **Consent verified on-chain** — every read operation checks the AccessControl smart contract
- **Scoped access** — the AI can only read categories explicitly authorized by the user
- **Session-limited** — by default, consent expires when the conversation ends
- **Auditable** — every access is recorded permanently on Arweave

This follows the exact same model as the Anthropic MCP protocol itself: anyone can build an MCP server, and what protects the user is their explicit consent — not institutional gatekeeping.

---

## Protocol Specification

→ [bsp-spec](https://github.com/Biological-Sovereignty-Protocol/bsp-spec) · Full BSP specification
→ [bsp-sdk-typescript](https://github.com/Biological-Sovereignty-Protocol/bsp-sdk-typescript) · TypeScript SDK
→ [bsp.dev](https://bsp.dev) · Documentation

---

## License

Apache 2.0 — Ambrósio Institute
