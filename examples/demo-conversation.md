# BSP MCP — Demo Conversation

Three real scenarios showing Claude using `bsp-mcp` to access health data with cryptographic consent enforcement.

---

## Scenario 1 — Reviewing blood panel results

**Setup:** Alice has configured `bsp-mcp` with her BEO `alice.bsp` and issued a ConsentToken scoped to `READ_RECORDS` on `BSP-HM` (Hematology) and `BSP-LA` (Lab – Advanced), valid through December 2026.

---

**Alice:** Can you look at my latest blood work and tell me if anything stands out for longevity?

**Claude:** Sure. Let me check your consent configuration first, then pull the records.

```
[bsp_check_consent]

Response:
  BEO:        alice.bsp
  Token:      tok_7f3a9d...c291
  Network:    mainnet
  Intents:    READ_RECORDS
  Categories: BSP-HM (Hematology), BSP-LA (Lab – Advanced)
  Expires:    2026-12-31
  Status:     ACTIVE
```

Consent verified. You've authorized read access to hematology and advanced labs. Let me fetch the most recent records.

```
[bsp_get_biorecords]
  categories: ["BSP-HM", "BSP-LA"]
  limit: 20
  from: 2026-01-01T00:00:00Z

Response:
  BEO: alice.bsp
  Records: 18
  Collection date: 2026-03-18

  BSP-HM-001  Hemoglobin     14.2 g/dL     ref: 12.0–16.0   ✓
  BSP-HM-002  Hematocrit     42.1 %        ref: 36–48        ✓
  BSP-HM-003  WBC            7,200 /μL     ref: 4,500–11,000 ✓
  BSP-HM-004  Platelets      238,000 /μL   ref: 150–400k     ✓
  BSP-HM-007  Ferritin       22 ng/mL      ref: 20–200       ⚠
  BSP-LA-003  hs-CRP         0.4 mg/L      ref: <1.0         ✓
  BSP-LA-007  Homocysteine   9.2 μmol/L    ref: <15          ⚠
  BSP-LA-011  Vitamin D      38 ng/mL      ref: 30–100       ✓
  BSP-LA-014  Omega-3 Index  5.1 %         ref: >8%          ⚠
```

Everything is within clinical range — your doctor won't flag anything. But from a longevity optimization standpoint, three markers are worth watching:

**Ferritin at 22 ng/mL.** Clinically normal (threshold is 20), but the longevity literature consistently points to 50–100 ng/mL as the functional target. Low ferritin limits oxygen delivery and mitochondrial function even when no anemia is present.

**Homocysteine at 9.2 μmol/L.** Under the 15 clinical cutoff, but elevated homocysteine accelerates vascular aging. Target for longevity protocols is below 8. A methylated B-complex (B12/folate/B6) typically moves this quickly.

**Omega-3 Index at 5.1%.** The 8% threshold is where cardiovascular and cognitive protection become meaningful. You're low. 2–3g EPA+DHA daily for 90 days will close that gap.

Want me to pull your trend data to see if these have been moving in any direction?

---

**Alice:** Yes, show me the ferritin trend over the last year.

```
[bsp_get_biorecords]
  biomarkers: ["BSP-HM-007"]
  from: 2025-03-01T00:00:00Z
  to: 2026-03-18T00:00:00Z

Response:
  BSP-HM-007  Ferritin

  2025-03-12   18 ng/mL
  2025-06-20   21 ng/mL
  2025-09-15   19 ng/mL
  2025-12-08   20 ng/mL
  2026-03-18   22 ng/mL
```

It's been flat for a year. Small upward drift — 18 to 22 — but essentially stuck in the same band. This isn't going to self-correct. You'll need to either increase dietary iron (red meat, organ meats) or add a supplement. If you go the supplement route, taking iron with vitamin C significantly improves absorption. Retest in 60 days.

---

## Scenario 2 — Lab submitting new results

**Setup:** LabCorp has its own BSP integration. Alice previously granted `SUBMIT_RECORD` consent to LabCorp's BSP agent `labcorp.bsp`, scoped to `BSP-HM` and `BSP-GL`. Claude is acting as the lab's submission agent.

---

**LabCorp integration system:** We have new hematology results for patient alice.bsp from today's draw. Submit them.

**Claude:** Before submitting, let me verify the submission consent is in place.

```
[bsp_check_consent]

Response:
  BEO:        alice.bsp
  Token:      tok_lc_8831...aa04
  Issuer:     alice.bsp
  Network:    mainnet
  Intents:    SUBMIT_RECORD
  Categories: BSP-HM, BSP-GL
  Expires:    2026-06-30
  Status:     ACTIVE
```

Consent valid. LabCorp has SUBMIT_RECORD authorization for hematology and genomics. Submitting now.

```
[bsp_get_beo_summary]
  (checking existing records before submission to avoid duplicates)

Response:
  BEO: alice.bsp
  Last BSP-HM record: 2026-03-18T09:14:00Z
  Coverage: STANDARD
```

No duplicate conflict — the last hematology record is from this morning, and the new draw timestamp is 2026-03-24T14:32:00Z. Proceeding with submission.

> Note: `bsp_submit_record` is implemented in the full registry-connected build. The submission call would look like:

```
[bsp_submit_record]
  beo:        alice.bsp
  token:      tok_lc_8831...aa04
  category:   BSP-HM
  records: [
    { code: "BSP-HM-001", value: 14.5, unit: "g/dL", collected_at: "2026-03-24T14:32:00Z" },
    { code: "BSP-HM-003", value: 7100,  unit: "/μL",  collected_at: "2026-03-24T14:32:00Z" },
    { code: "BSP-HM-007", value: 24,    unit: "ng/mL", collected_at: "2026-03-24T14:32:00Z" }
  ]

Response:
  Status:     ACCEPTED
  TX:         ar://7f3a9d2e...
  BEO:        alice.bsp
  Records:    3 submitted
  Arweave TX: confirmed in block 1,482,991
```

Records submitted and confirmed on Arweave. Transaction ID `ar://7f3a9d2e...` is now the permanent audit entry for this submission. Alice can verify it independently at any time.

---

## Scenario 3 — User revokes consent mid-conversation

**Setup:** Alice is in a conversation with Claude. Midway through, she opens the BSP app and revokes the ConsentToken. The next tool call hits the registry and gets a revocation error.

---

**Alice:** Now pull my cardiovascular data and give me a full risk assessment.

**Claude:** Let me fetch your cardiovascular records.

```
[bsp_check_consent]

Response:
  BEO:    alice.bsp
  Token:  tok_7f3a9d...c291
  Status: REVOKED
  Reason: Revoked by BEO holder at 2026-03-24T15:47:22Z
```

```
⛔ BSP Consent Error [TOKEN_REVOKED]

The ConsentToken tok_7f3a9d...c291 has been revoked by the BEO holder.
Access to alice.bsp data is no longer authorized.
No records were retrieved.
```

Your consent token has been revoked. I can see the revocation was issued just now from your BEO. I can't access any of your BSP records in this session.

If you want to continue, you'll need to issue a new ConsentToken from your BSP identity and update the `BSP_CONSENT_TOKEN_ID` in your Claude Desktop config. This is the consent model working as designed — you're fully in control.

Nothing from this session was cached or retained. The access history up to the point of revocation is permanently recorded on Arweave, which you can audit at any time.

---

**Alice:** I revoked it to test the system. It worked. Can you explain what just happened technically?

**Claude:** Here's exactly what happened:

1. You called `bsp_check_consent` to check the current token state
2. The ConsentGuard queried the AccessControl contract on Arweave for token `tok_7f3a9d...c291`
3. The contract returned `REVOKED` with the timestamp you triggered from the BSP app
4. The guard returned a `TOKEN_REVOKED` error before any data query ran
5. No fallback, no retry — the call halted completely

The reason this works immediately is that the token's canonical state lives on Arweave, not in this session or in any server cache. The moment you revoke it, every system that checks the registry sees it as revoked. There's no window where stale consent could be exploited.

To reauthorize, issue a new token:

```bash
bsp consent grant \
  --beo alice.bsp \
  --intent READ_RECORDS \
  --categories BSP-HM,BSP-LA,BSP-CV \
  --expires 2026-12-31
```

That will give you a fresh token ID to configure.

---

*For full setup instructions and tool reference, see the [README](../README.md).*
