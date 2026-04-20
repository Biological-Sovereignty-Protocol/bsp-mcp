# Contributing to bsp-mcp

`bsp-mcp` is the bridge between AI assistants and the Biological Sovereignty Protocol. Every tool you add or change here changes what AI can do with sovereign health data. That is a serious surface. This document keeps it tight.

---

## Before you start

- **Read the spec** — `bsp-spec` defines the protocol. Tools must align with `spec/exchange.md` and `spec/beo.md`.
- **Read the consent model** — `bsp-spec/docs/GLOSSARY.md` (ConsentToken, Intent, Scope).
- **Check existing issues** — someone may already be on it.

---

## Development setup

```bash
git clone https://github.com/Biological-Sovereignty-Protocol/bsp-mcp
cd bsp-mcp
npm install
npm run build
```

Requires Node.js >= 18.

### Run locally

```bash
# Start the MCP server directly (stdio)
node dist/index.js

# Or hook into Claude Desktop by pointing claude_desktop_config.json at:
{
  "mcpServers": {
    "bsp-dev": {
      "command": "node",
      "args": ["/absolute/path/to/bsp-mcp/dist/index.js"],
      "env": {
        "BSP_BEO_DOMAIN": "testuser.bsp",
        "BSP_CONSENT_TOKEN_ID": "tok_...",
        "BSP_NETWORK": "testnet"
      }
    }
  }
}
```

Restart Claude Desktop after config changes.

### Testing tools

Use the MCP inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

Or write an automated harness that pipes JSON-RPC to stdin and asserts on stdout.

---

## Adding a new tool

1. **Define the tool shape** in `src/index.ts`:

   ```ts
   {
     name: 'bsp_my_new_tool',
     description: 'One-sentence what-it-does that an LLM will read.',
     inputSchema: {
       type: 'object',
       properties: { /* JSON Schema */ },
       required: []
     }
   }
   ```

2. **Add a case in the CallToolRequestSchema handler**:

   ```ts
   case 'bsp_my_new_tool': {
     // REQUIRED if tool touches user data:
     const consentError = guard.check('REQUIRED_INTENT')
     if (consentError) return consentError

     // Your logic — delegate writes to bsp-sdk ExchangeClient
   }
   ```

3. **Create an example** at `examples/bsp_my_new_tool.md` with:
   - Input JSON Schema
   - Request payload
   - Success response
   - Error response(s) — include relevant codes from `bsp-spec/docs/ERROR_CODES.md`

4. **Register in README** — add a row to the "Available Tools" table.

5. **Register in `examples/README.md`** — add to the tool index.

6. **Changelog entry** — under `[Unreleased]`.

---

## Pull request checklist

- [ ] `npm run build` passes with no TypeScript errors
- [ ] New tool has an entry in `README.md` (table) + `examples/` (markdown)
- [ ] `ConsentGuard.check(...)` wraps every tool that touches user data
- [ ] Error paths emit a stable code from `bsp-spec/docs/ERROR_CODES.md` (add one if needed)
- [ ] Destructive tools require `confirm: true` in `inputSchema` + runtime check
- [ ] No secrets or real tokens in commit history
- [ ] `CHANGELOG.md` updated under `[Unreleased]`
- [ ] PR description explains **why** the change is needed

---

## Consent policy (hard rules)

1. **No data leaves the BEO without a valid ConsentToken.** Not one byte.
2. **Every data-access tool starts with `guard.check(intent)`.** No exceptions.
3. **Scope is enforced on-chain.** Do not re-implement scope checks locally — delegate to the AccessControl contract via `bsp-sdk`.
4. **Token expiry and revocation are checked at call time**, not cached.
5. **No fallback path on consent failure.** If the guard rejects, the tool returns an error and the AI stops.

Violating any of these rules is an automatic PR rejection.

---

## Coding style

- TypeScript strict mode — no `any` without a comment
- Error messages: human-readable, prefix with `⛔`, include stable code in brackets `[CODE]`
- Success output: optional `✓` prefix for readability in Claude's rendering
- No `console.log` from tool handlers — return `MCPResult` only
- Never log the ConsentToken ID at error severity — it is sensitive

---

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/):

```
feat(tool): add bsp_search_biomarkers
fix(guard): handle TOKEN_EXPIRED gracefully
docs(readme): add JSON schema for each tool
chore(deps): bump @bsp/sdk to 0.4.0
```

---

## Security

- Report vulnerabilities privately — see `SECURITY.md`
- Never commit real ConsentToken IDs, BEO private keys, or production env files
- All dependencies are audited — `npm audit` must return 0 high/critical issues before release

---

## License

By contributing you agree that your contributions are licensed under Apache 2.0.

## Related

- **Protocol spec:** [bsp-spec](https://github.com/Biological-Sovereignty-Protocol/bsp-spec)
- **SDK:** [bsp-sdk-typescript](https://github.com/Biological-Sovereignty-Protocol/bsp-sdk-typescript)
- **Security policy:** [`SECURITY.md`](./SECURITY.md)
