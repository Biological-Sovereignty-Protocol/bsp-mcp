/**
 * ConsentGuard — Verifies consent before every tool call that accesses BEO data.
 *
 * All BSP data operations require explicit consent from the BEO holder,
 * enforced on-chain by the AccessControl Move module on Aptos.
 *
 * The ConsentGuard reads token status from environment or session context
 * and enforces scope before passing the call to the tool.
 */

import { ConsentStatus, MCPResult } from '../types'

export type ConsentRequired = boolean

export class ConsentGuard {
    private beo_domain: string
    private token_id: string | undefined

    constructor() {
        this.beo_domain = process.env.BSP_BEO_DOMAIN || ''
        this.token_id = process.env.BSP_CONSENT_TOKEN_ID
    }

    /**
     * Verify consent is present and configured.
     * Returns an error MCPResult if not configured, or null if OK.
     */
    check(intent: string, category?: string): MCPResult | null {
        if (!this.beo_domain) {
            return this.error(
                'NO_BEO_CONFIGURED',
                'No BEO domain configured. Set BSP_BEO_DOMAIN in your environment.'
            )
        }
        if (!this.token_id) {
            return this.error(
                'NO_CONSENT_TOKEN',
                `No consent token configured for BEO "${this.beo_domain}". ` +
                `The user must grant a ConsentToken with intent "${intent}" before this tool can be used.`
            )
        }
        // Full on-chain verification happens when @biological-sovereignty-protocol/sdk is connected.
        // For now, this guard checks that token is configured.
        return null
    }

    getBEODomain(): string {
        return this.beo_domain
    }

    getTokenId(): string | undefined {
        return this.token_id
    }

    private error(code: string, message: string): MCPResult {
        return {
            content: [{ type: 'text', text: `⛔ BSP Consent Error [${code}]\n\n${message}` }],
            isError: true,
        }
    }
}
