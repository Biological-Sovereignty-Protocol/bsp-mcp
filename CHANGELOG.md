# Changelog

All notable changes to `bsp-mcp` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [2.1.0] — 2026-04

### Changed

- Sync version with `@biological-sovereignty-protocol/sdk` v2.1.0 so the
  entire BSP client stack shares a single major.minor line.
- `.env.example` now documents every env var read by the server
  (`BSP_BEO_DOMAIN`, `BSP_CONSENT_TOKEN_ID`, `BSP_PRIVATE_KEY`,
  `BSP_REGISTRY_URL`, `BSP_NETWORK`) and removes the stale
  `BSP_APTOS_NETWORK` that was never consumed by code.

### Added

- `examples/` — per-tool examples with JSON payloads, input schemas, and expected responses (including error cases)
- `CONTRIBUTING.md` with dev setup, tool-authoring guide, and PR checklist
- Expanded README with detailed JSON input schema for each of the 9 tools
- Cross-links to `bsp-spec/docs/ERROR_CODES.md`, `docs/GLOSSARY.md`, `docs/ARCHITECTURE.md`

---

## [1.0.0] — 2026-04

### Added
- Initial release with 9 tools:
  - **Read (5):** `bsp_get_biorecords`, `bsp_get_beo_summary`, `bsp_resolve_biomarker`, `bsp_list_categories`, `bsp_check_consent`
  - **Write (4):** `bsp_lock_beo`, `bsp_unlock_beo`, `bsp_destroy_beo`, `bsp_revoke_all_tokens`
- `ConsentGuard` — intent + BEO domain validation before every data-access tool call
- Full BSP taxonomy: 25 categories, CORE / STANDARD / EXTENDED / DEVICE levels
- stdio transport via `@modelcontextprotocol/sdk`
- Environment-driven config: `BSP_BEO_DOMAIN`, `BSP_CONSENT_TOKEN_ID`, `BSP_RELAYER_URL`, `BSP_NETWORK`
- On-chain consent verification via `bsp-sdk` ExchangeClient

### Security
- Every data-access tool gated by ConsentGuard
- Token expiry and revocation checked against Aptos AccessControl contract at call time
- Scope enforcement delegated to on-chain contract — categories outside token are rejected
- `confirm: true` required for destructive operations (`bsp_destroy_beo`, `bsp_revoke_all_tokens`)

---

## Links

- **Protocol spec:** [bsp-spec](https://github.com/Biological-Sovereignty-Protocol/bsp-spec)
- **SDK:** [bsp-sdk-typescript](https://github.com/Biological-Sovereignty-Protocol/bsp-sdk-typescript)
- **Error catalog:** [bsp-spec/docs/ERROR_CODES.md](https://github.com/Biological-Sovereignty-Protocol/bsp-spec/blob/main/docs/ERROR_CODES.md)
- **Issues:** [github.com/.../bsp-mcp/issues](https://github.com/Biological-Sovereignty-Protocol/bsp-mcp/issues)
