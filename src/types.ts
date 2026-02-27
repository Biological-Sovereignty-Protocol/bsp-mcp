/**
 * BSP MCP Server — Type definitions
 */

export type BioLevel = 'CORE' | 'STANDARD' | 'EXTENDED' | 'DEVICE'

export interface BSPCategory {
    code: string
    level: BioLevel
    name: string
}

export interface ConsentStatus {
    beo_domain: string
    token_id: string
    valid: boolean
    expires_at: string | null
    intents: string[]
    categories: string[]
    reason?: string
}

export interface BioRecordSummary {
    beo_domain: string
    categories: Array<{ code: string; name: string; record_count: number; last_updated: string }>
    total_records: number
    first_record: string
    last_record: string
    coverage_level: 'MINIMAL' | 'STANDARD' | 'COMPREHENSIVE' | 'FULL'
}

export interface MCPError {
    code: string
    message: string
}

export type MCPContent = { type: 'text'; text: string }
export type MCPResult = { content: MCPContent[]; isError?: boolean }
