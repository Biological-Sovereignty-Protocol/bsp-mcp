# bsp-mcp — Examples

Per-tool examples showing JSON payload, input schema, and expected responses (including error cases).

## Tool index

| Tool | File | Consent |
|---|---|---|
| `bsp_check_consent` | [bsp_check_consent.md](./bsp_check_consent.md) | Not required |
| `bsp_get_biorecords` | [bsp_get_biorecords.md](./bsp_get_biorecords.md) | `READ_RECORDS` |
| `bsp_get_beo_summary` | [bsp_get_beo_summary.md](./bsp_get_beo_summary.md) | `READ_RECORDS` |
| `bsp_resolve_biomarker` | [bsp_resolve_biomarker.md](./bsp_resolve_biomarker.md) | Not required |
| `bsp_list_categories` | [bsp_list_categories.md](./bsp_list_categories.md) | Not required |
| `bsp_lock_beo` / `bsp_unlock_beo` | [bsp_lock_unlock_beo.md](./bsp_lock_unlock_beo.md) | Holder private key |
| `bsp_destroy_beo` | [bsp_destroy_beo.md](./bsp_destroy_beo.md) | Holder private key + `confirm` |
| `bsp_revoke_all_tokens` | [bsp_revoke_all_tokens.md](./bsp_revoke_all_tokens.md) | Holder private key |

See also [`demo-conversation.md`](./demo-conversation.md) — end-to-end conversation flow with Claude.
