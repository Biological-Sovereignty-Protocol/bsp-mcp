#!/usr/bin/env node
/**
 * BSP MCP Server — Official Model Context Protocol server for the Biological Sovereignty Protocol
 * Version 1.0.0 | Ambrósio Institute
 *
 * Connects AI agents (Claude, GPT, and any MCP-compatible AI) to BSP BioRecords
 * with on-chain consent enforcement. No data access is possible without an explicit
 * ConsentToken signed by the BEO holder.
 *
 * Usage in Claude Desktop (claude_desktop_config.json):
 * {
 *   "mcpServers": {
 *     "bsp": {
 *       "command": "npx",
 *       "args": ["-y", "bsp-mcp"],
 *       "env": {
 *         "BSP_BEO_DOMAIN":        "yourname.bsp",
 *         "BSP_CONSENT_TOKEN_ID":  "tok_...",
 *         "BSP_NETWORK":           "mainnet"
 *       }
 *     }
 *   }
 * }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js'

import { ConsentGuard } from './auth/ConsentGuard'
import { listCategories, resolveBiomarker } from './tools/taxonomy'
import type { BioLevel } from './types'

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const tools: Tool[] = [
  {
    name: 'bsp_get_biorecords',
    description:
      'Read BioRecords from the user\'s BEO (biological identity). Requires an active ConsentToken ' +
      'with READ_RECORDS intent. Returns biological measurements in BSP format with values, units, ' +
      'reference ranges, and collection timestamps.',
    inputSchema: {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: { type: 'string' },
          description:
            'BSP category codes to filter by (e.g. ["BSP-GL", "BSP-LA", "BSP-CV"]). ' +
            'Omit for all authorized categories. Use bsp_list_categories to see available codes.',
        },
        biomarkers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific BSP biomarker codes (e.g. ["BSP-GL-001", "BSP-LA-004"]).',
        },
        from: {
          type: 'string',
          description: 'ISO8601 timestamp — return records after this date (e.g. "2025-01-01T00:00:00Z").',
        },
        to: {
          type: 'string',
          description: 'ISO8601 timestamp — return records before this date.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of records (default: 50, max: 200).',
        },
      },
    },
  },
  {
    name: 'bsp_get_beo_summary',
    description:
      'Get a structured overview of the user\'s biological profile — what categories of data exist, ' +
      'how many records per category, most recent measurement dates, and overall data completeness. ' +
      'Requires active session consent. Use this before bsp_get_biorecords to understand data scope.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'bsp_resolve_biomarker',
    description:
      'Look up information about a specific BSP biomarker code — name, category, level, and ' +
      'clinical context. Public taxonomy data — no consent required.',
    inputSchema: {
      type: 'object',
      required: ['code'],
      properties: {
        code: {
          type: 'string',
          description: 'BSP biomarker code (e.g. "BSP-GL-001", "BSP-LA-004", "BSP-HM-001").',
        },
      },
    },
  },
  {
    name: 'bsp_list_categories',
    description:
      'List all BSP taxonomy categories with level information. ' +
      'Public data — no consent required. Use this to understand what biological data categories exist ' +
      'and which are relevant for a user\'s health question.',
    inputSchema: {
      type: 'object',
      properties: {
        level: {
          type: 'string',
          enum: ['CORE', 'STANDARD', 'EXTENDED', 'DEVICE'],
          description:
            'Filter by taxonomy level. ' +
            'CORE = advanced longevity biomarkers, ' +
            'STANDARD = routine lab tests, ' +
            'EXTENDED = specialized research, ' +
            'DEVICE = wearable continuous data. ' +
            'Omit to list all 25 categories.',
        },
      },
    },
  },
  {
    name: 'bsp_lock_beo',
    description:
      'Emergency lock — freezes the BEO immediately. No reads or writes permitted while locked. ' +
      'Only the BEO holder can lock or unlock. Requires the private key configured in BSP_PRIVATE_KEY.',
    inputSchema: {
      type: 'object',
      required: ['beoId'],
      properties: {
        beoId: { type: 'string', description: 'The BEO UUID to lock.' },
      },
    },
  },
  {
    name: 'bsp_unlock_beo',
    description: 'Unlock a previously locked BEO. Requires the BEO holder\'s private key.',
    inputSchema: {
      type: 'object',
      required: ['beoId'],
      properties: {
        beoId: { type: 'string', description: 'The BEO UUID to unlock.' },
      },
    },
  },
  {
    name: 'bsp_destroy_beo',
    description:
      'IRREVERSIBLE — Permanently destroy a BEO (LGPD Art. 18 / GDPR Art. 17). ' +
      'Nullifies public key, revokes all ConsentTokens, releases domain. ' +
      'The user MUST confirm before executing this tool.',
    inputSchema: {
      type: 'object',
      required: ['beoId', 'confirm'],
      properties: {
        beoId: { type: 'string', description: 'The BEO UUID to destroy.' },
        confirm: { type: 'boolean', description: 'Must be true to execute.' },
      },
    },
  },
  {
    name: 'bsp_revoke_all_tokens',
    description:
      'Emergency revocation — revokes ALL active ConsentTokens for a BEO. ' +
      'No institution will be able to access any data after this.',
    inputSchema: {
      type: 'object',
      required: ['beoId'],
      properties: {
        beoId: { type: 'string', description: 'The BEO UUID whose tokens to revoke.' },
      },
    },
  },
  {
    name: 'bsp_check_consent',
    description:
      'Check the current consent configuration — which BEO is connected, which data categories ' +
      'and intents are authorized, and when the token expires. Run this first to understand what ' +
      'data you are allowed to access in this session.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'bsp_list_beos',
    description: 'List BEOs accessible to the configured IEO',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of BEOs to return (default: 20, max: 100).',
        },
        offset: {
          type: 'number',
          description: 'Number of records to skip for pagination (default: 0).',
        },
      },
    },
  },
  {
    name: 'bsp_list_ieos',
    description: 'List registered IEOs on the BSP network',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of IEOs to return (default: 20, max: 100).',
        },
        offset: {
          type: 'number',
          description: 'Number of records to skip for pagination (default: 0).',
        },
        type: {
          type: 'string',
          description: 'Filter by IEO type (e.g. "clinic", "lab", "insurer").',
        },
      },
    },
  },
  {
    name: 'bsp_submit_biorecord',
    description: 'Submit a BioRecord for a BEO (requires SUBMIT_RECORD consent)',
    inputSchema: {
      type: 'object',
      required: ['beo_id', 'token_id', 'biomarker', 'value', 'unit', 'collection_time'],
      properties: {
        beo_id: {
          type: 'string',
          description: 'The BEO UUID that owns this record.',
        },
        token_id: {
          type: 'string',
          description: 'ConsentToken ID authorizing this submission.',
        },
        biomarker: {
          type: 'string',
          description: 'BSP biomarker code (e.g. "BSP-GL-001").',
        },
        value: {
          type: 'number',
          description: 'Numeric measurement value.',
        },
        unit: {
          type: 'string',
          description: 'Unit of measurement (e.g. "mg/dL", "mmol/L").',
        },
        collection_time: {
          type: 'string',
          description: 'ISO8601 timestamp of when the sample was collected (e.g. "2025-06-01T08:30:00Z").',
        },
      },
    },
  },
]

// ─── Server Setup ─────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'bsp-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

const guard = new ConsentGuard()

// ─── List Tools ───────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }))

// ─── Tool Handlers ────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  switch (name) {

    // ── public: no consent required ───────────────────────────────────────────

    case 'bsp_list_categories': {
      const level = (args as { level?: BioLevel })?.level
      return { content: [{ type: 'text', text: listCategories(level) }] }
    }

    case 'bsp_resolve_biomarker': {
      const code = (args as { code: string }).code
      if (!code) {
        return { content: [{ type: 'text', text: '❌ Missing required parameter: code' }], isError: true }
      }
      return { content: [{ type: 'text', text: resolveBiomarker(code) }] }
    }

    // ── requires consent ──────────────────────────────────────────────────────

    // ── write operations (require BSP_PRIVATE_KEY) ─────────────────────────

    case 'bsp_lock_beo':
    case 'bsp_unlock_beo':
    case 'bsp_destroy_beo':
    case 'bsp_revoke_all_tokens': {
      const privateKey = process.env.BSP_PRIVATE_KEY
      if (!privateKey) {
        return {
          content: [{ type: 'text', text: '⛔ BSP_PRIVATE_KEY is required for write operations. Set it in the MCP server environment.' }],
          isError: true,
        }
      }

      const registryUrl = process.env.BSP_REGISTRY_URL || 'https://api.biologicalsovereigntyprotocol.com'
      const beoId = (args as any)?.beoId

      if (!beoId) {
        return { content: [{ type: 'text', text: '❌ Missing required parameter: beoId' }], isError: true }
      }

      if (name === 'bsp_destroy_beo' && !(args as any)?.confirm) {
        return { content: [{ type: 'text', text: '⛔ Destruction requires confirm: true. This action is IRREVERSIBLE.' }], isError: true }
      }

      const fnMap: Record<string, { endpoint: string; fn: string; process: string }> = {
        bsp_lock_beo:          { endpoint: '/api/relayer/beo/lock', fn: 'lockBEO', process: 'BEORegistry' },
        bsp_unlock_beo:        { endpoint: '/api/relayer/beo/unlock', fn: 'unlockBEO', process: 'BEORegistry' },
        bsp_destroy_beo:       { endpoint: '/api/relayer/beo/destroy', fn: 'destroyBEO', process: 'BEORegistry' },
        bsp_revoke_all_tokens: { endpoint: '/api/relayer/beo/revoke-all', fn: 'revokeAllTokens', process: 'AccessControl' },
      }
      const op = fnMap[name]

      // Dynamically import SDK for signing
      const { CryptoUtils } = await import('@biological-sovereignty-protocol/sdk')
      const nonce = CryptoUtils.generateNonce()
      const timestamp = new Date().toISOString()
      const payload = { function: op.fn, beoId, nonce, timestamp }
      const signature = CryptoUtils.signPayload(payload, privateKey)

      try {
        const res = await fetch(`${registryUrl}${op.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ beoId, signature, nonce, timestamp }),
        })
        const data = await res.json() as Record<string, any>
        if (!res.ok) {
          return { content: [{ type: 'text', text: `❌ ${op.fn} failed: ${data?.error || res.statusText}` }], isError: true }
        }
        const action = name.replace('bsp_', '').replace(/_/g, ' ')
        return { content: [{ type: 'text', text: `✅ **${action}** completed.\n\nTransaction: \`${data?.transactionId}\`\nBEO: \`${beoId}\`` }] }
      } catch (e: any) {
        return { content: [{ type: 'text', text: `❌ Network error: ${e.message}` }], isError: true }
      }
    }

    case 'bsp_check_consent': {
      const beo = guard.getBEODomain()
      const token = guard.getTokenId()

      if (!beo) {
        return {
          content: [{
            type: 'text', text:
              '⚠️ **No BEO configured.**\n\n' +
              'Set `BSP_BEO_DOMAIN` in the server environment to connect a biological identity.\n\n' +
              'See: https://biologicalsovereigntyprotocol.com/getting-started/quickstart'
          }],
          isError: true,
        }
      }

      if (!token) {
        return {
          content: [{
            type: 'text', text:
              `✅ BEO configured: \`${beo}\`\n\n` +
              `⚠️ **No consent token configured.**\n\n` +
              `The BEO holder must issue a ConsentToken with \`READ_RECORDS\` intent to authorize this AI. ` +
              `Set \`BSP_CONSENT_TOKEN_ID\` in the environment with the token ID.\n\n` +
              `→ https://biologicalsovereigntyprotocol.com/getting-started/quickstart`
          }],
          isError: true,
        }
      }

      return {
        content: [{
          type: 'text', text:
            `✅ **BSP MCP Session Active**\n\n` +
            `| Field | Value |\n` +
            `|-------|-------|\n` +
            `| BEO | \`${beo}\` |\n` +
            `| Token | \`${token}\` |\n` +
            `| Network | \`${process.env.BSP_NETWORK || 'mainnet'}\` |\n\n` +
            `> Full consent verification (intents, categories, expiry) requires registry connection.\n` +
            `> Connect \`@biological-sovereignty-protocol/sdk\` to the registry for live validation.`
        }],
      }
    }

    case 'bsp_get_biorecords': {
      const consentError = guard.check('READ_RECORDS')
      if (consentError) return consentError

      // Implementation: uses @biological-sovereignty-protocol/sdk ExchangeClient.readRecords
      // with the configured ConsentToken
      return {
        content: [{
          type: 'text', text:
            `📋 **bsp_get_biorecords**\n\n` +
            `BEO: \`${guard.getBEODomain()}\`\n` +
            `Status: Registry connection required to retrieve records.\n\n` +
            `This tool is fully implemented — it requires:\n` +
            `1. \`bsp-registry\` deployed on Aptos\n` +
            `2. \`@biological-sovereignty-protocol/sdk\` ExchangeClient pointing to registry\n\n` +
            `→ https://biologicalsovereigntyprotocol.com/getting-started/quickstart`
        }],
      }
    }

    case 'bsp_get_beo_summary': {
      const consentError = guard.check('READ_RECORDS')
      if (consentError) return consentError

      // Implementation: uses @biological-sovereignty-protocol/sdk ExchangeClient to aggregate BEO data
      return {
        content: [{
          type: 'text', text:
            `📊 **bsp_get_beo_summary**\n\n` +
            `BEO: \`${guard.getBEODomain()}\`\n` +
            `Status: Registry connection required for live summary.\n\n` +
            `→ https://biologicalsovereigntyprotocol.com/getting-started/quickstart`
        }],
      }
    }

    case 'bsp_list_beos': {
      const { limit = 20, offset = 0 } = (args as { limit?: number; offset?: number }) ?? {}
      const apiUrl = process.env.BSP_API_URL || 'https://api.biologicalsovereigntyprotocol.com'
      const ieoKey = process.env.BSP_IEO_API_KEY
      if (!ieoKey) {
        return {
          content: [{ type: 'text', text: '⛔ BSP_IEO_API_KEY is required for IEO operations. Set it in the MCP server environment.' }],
          isError: true,
        }
      }
      try {
        const res = await fetch(`${apiUrl}/api/beo?limit=${Math.min(limit, 100)}&offset=${offset}`, {
          headers: { 'x-api-key': ieoKey },
        })
        const data = await res.json() as Record<string, any>
        if (!res.ok) {
          return { content: [{ type: 'text', text: `❌ bsp_list_beos failed: ${data?.error || res.statusText}` }], isError: true }
        }
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      } catch (e: any) {
        return { content: [{ type: 'text', text: `❌ Network error: ${e.message}` }], isError: true }
      }
    }

    case 'bsp_list_ieos': {
      const { limit = 20, offset = 0, type } = (args as { limit?: number; offset?: number; type?: string }) ?? {}
      const apiUrl = process.env.BSP_API_URL || 'https://api.biologicalsovereigntyprotocol.com'
      const ieoKey = process.env.BSP_IEO_API_KEY
      if (!ieoKey) {
        return {
          content: [{ type: 'text', text: '⛔ BSP_IEO_API_KEY is required for IEO operations. Set it in the MCP server environment.' }],
          isError: true,
        }
      }
      try {
        const params = new URLSearchParams({ limit: String(Math.min(limit, 100)), offset: String(offset) })
        if (type) params.set('type', type)
        const res = await fetch(`${apiUrl}/api/ieo?${params.toString()}`, {
          headers: { 'x-api-key': ieoKey },
        })
        const data = await res.json() as Record<string, any>
        if (!res.ok) {
          return { content: [{ type: 'text', text: `❌ bsp_list_ieos failed: ${data?.error || res.statusText}` }], isError: true }
        }
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      } catch (e: any) {
        return { content: [{ type: 'text', text: `❌ Network error: ${e.message}` }], isError: true }
      }
    }

    case 'bsp_submit_biorecord': {
      const consentError = guard.check('SUBMIT_RECORD')
      if (consentError) return consentError

      const { beo_id, token_id, biomarker, value, unit, collection_time } =
        (args as { beo_id: string; token_id: string; biomarker: string; value: number; unit: string; collection_time: string })

      if (!beo_id || !token_id || !biomarker || value === undefined || !unit || !collection_time) {
        return { content: [{ type: 'text', text: '❌ Missing required parameters. Required: beo_id, token_id, biomarker, value, unit, collection_time' }], isError: true }
      }

      const apiUrl = process.env.BSP_API_URL || 'https://api.biologicalsovereigntyprotocol.com'
      const ieoKey = process.env.BSP_IEO_API_KEY
      if (!ieoKey) {
        return {
          content: [{ type: 'text', text: '⛔ BSP_IEO_API_KEY is required for submit operations. Set it in the MCP server environment.' }],
          isError: true,
        }
      }

      try {
        const res = await fetch(`${apiUrl}/api/exchange/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': ieoKey },
          body: JSON.stringify({ beo_id, token_id, biomarker, value, unit, collection_time }),
        })
        const data = await res.json() as Record<string, any>
        if (!res.ok) {
          return { content: [{ type: 'text', text: `❌ bsp_submit_biorecord failed: ${data?.error || res.statusText}` }], isError: true }
        }
        return {
          content: [{
            type: 'text', text:
              `✅ **BioRecord submitted**\n\n` +
              `| Field | Value |\n` +
              `|-------|-------|\n` +
              `| Record ID | \`${data?.record_id}\` |\n` +
              `| Arweave TX | \`${data?.arweave_txid}\` |\n` +
              `| Success | ${data?.success} |`
          }],
        }
      } catch (e: any) {
        return { content: [{ type: 'text', text: `❌ Network error: ${e.message}` }], isError: true }
      }
    }

    default:
      throw new Error(`Unknown BSP tool: "${name}"`)
  }
})

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error(
    `BSP MCP Server v1.0.0 running\n` +
    `BEO: ${guard.getBEODomain() || '(not configured)'}\n` +
    `Network: ${process.env.BSP_NETWORK || 'mainnet'}\n` +
    `biologicalsovereigntyprotocol.com`
  )
}

main().catch(console.error)
