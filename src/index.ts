/**
 * BSP MCP Server — Official Model Context Protocol server for the Biological Sovereignty Protocol
 * Version 0.2.0 | Ambrósio Institute
 *
 * Connects AI agents to BSP BioRecords with on-chain consent enforcement.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js'

const server = new Server(
  { name: 'bsp-mcp', version: '0.2.0' },
  { capabilities: { tools: {} } }
)

const tools: Tool[] = [
  {
    name: 'bsp_get_biorecords',
    description:
      'Read BioRecords from the user\'s BEO. Requires active session consent from the BEO holder. ' +
      'Returns biological measurements in BSP format.',
    inputSchema: {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'BSP category codes to filter by (e.g. ["BSP-GL", "BSP-LA"]). Omit for all authorized categories.',
        },
        biomarkers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific BSP biomarker codes (e.g. ["BSP-GL-001", "BSP-LA-004"]).',
        },
        from: {
          type: 'string',
          description: 'ISO8601 timestamp — return records after this date.',
        },
        to: {
          type: 'string',
          description: 'ISO8601 timestamp — return records before this date.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of records to return (default: 50, max: 200).',
        },
      },
    },
  },
  {
    name: 'bsp_get_beo_summary',
    description:
      'Get a structured summary of the user\'s biological profile — available biomarker categories, ' +
      'most recent measurement dates, and data completeness. Requires active session consent.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'bsp_resolve_biomarker',
    description:
      'Look up information about a BSP biomarker code — name, category, level, and clinical description. ' +
      'Public taxonomy — no consent required.',
    inputSchema: {
      type: 'object',
      required: ['code'],
      properties: {
        code: {
          type: 'string',
          description: 'BSP biomarker code (e.g. "BSP-GL-001" or "BSP-LA-004").',
        },
      },
    },
  },
  {
    name: 'bsp_list_categories',
    description:
      'List all available BSP taxonomy categories with descriptions. ' +
      'Public data — no consent required.',
    inputSchema: {
      type: 'object',
      properties: {
        level: {
          type: 'string',
          enum: ['CORE', 'STANDARD', 'EXTENDED', 'DEVICE'],
          description: 'Filter by taxonomy level. Omit to list all categories.',
        },
      },
    },
  },
  {
    name: 'bsp_check_consent',
    description:
      'Check the current consent status for the configured BEO — which categories and intents are authorized.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
]

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  // All tool implementations require @bsp/sdk (published separately)
  // This scaffold defines the MCP interface — connect to BSP SDK for execution

  switch (name) {
    case 'bsp_get_biorecords':
      return {
        content: [{
          type: 'text',
          text: 'BSP MCP Server: bsp-sdk connection required. See https://biologicalsovereigntyprotocol.com/docs/mcp',
        }],
      }

    case 'bsp_get_beo_summary':
      return {
        content: [{
          type: 'text',
          text: 'BSP MCP Server: bsp-sdk connection required. See https://biologicalsovereigntyprotocol.com/docs/mcp',
        }],
      }

    case 'bsp_resolve_biomarker': {
      const code = (args as { code: string }).code
      return {
        content: [{
          type: 'text',
          text: `BSP Taxonomy lookup for ${code}: See https://github.com/Biological-Sovereignty-Protocol/bsp-spec/tree/main/spec/taxonomy`,
        }],
      }
    }

    case 'bsp_list_categories':
      return {
        content: [{
          type: 'text',
          text: 'Full taxonomy: https://github.com/Biological-Sovereignty-Protocol/bsp-spec/tree/main/spec/taxonomy',
        }],
      }

    case 'bsp_check_consent':
      return {
        content: [{
          type: 'text',
          text: 'BSP MCP Server: bsp-sdk connection required. See https://biologicalsovereigntyprotocol.com/docs/mcp',
        }],
      }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('BSP MCP Server running — ambrosioinstitute.org | biologicalsovereigntyprotocol.com')
}

main().catch(console.error)
