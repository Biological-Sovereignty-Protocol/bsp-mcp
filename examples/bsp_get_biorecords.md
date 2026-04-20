# Example — `bsp_get_biorecords`

**Consent required:** Yes — `READ_RECORDS` intent.

**What it does:** Returns biological measurements in BSP format. Filterable by category, biomarker codes, and date range. Only returns records inside the authorized categories on the ConsentToken.

---

## Input schema

```json
{
  "type": "object",
  "properties": {
    "category":   { "type": "string",  "description": "BSP category code (e.g. BSP-HM)" },
    "codes":      { "type": "array",   "items": { "type": "string" }, "description": "Specific biomarker codes" },
    "fromDate":   { "type": "string",  "format": "date-time", "description": "ISO 8601 start (inclusive)" },
    "toDate":     { "type": "string",  "format": "date-time", "description": "ISO 8601 end (inclusive)" },
    "limit":      { "type": "integer", "minimum": 1, "maximum": 500, "default": 50 }
  },
  "required": []
}
```

## Request — hematology records, last 90 days

```json
{
  "name": "bsp_get_biorecords",
  "arguments": {
    "category": "BSP-HM",
    "fromDate": "2026-01-15T00:00:00Z",
    "toDate":   "2026-04-15T23:59:59Z",
    "limit":    50
  }
}
```

## Response — records returned

```json
{
  "content": [{
    "type": "text",
    "text": "BioRecords for alice.bsp — BSP-HM (2026-01-15 to 2026-04-15)\n────────────────────────────────────────────────────────────\n12 records returned\n\n2026-03-18  BSP-HM-HGB   Hemoglobin     14.2 g/dL     ✓ normal (ref 12.0-16.0)\n2026-03-18  BSP-HM-HCT   Hematocrit     42.1 %        ✓ normal (ref 36-48)\n2026-03-18  BSP-HM-WBC   WBC            7200  /μL     ✓ normal (ref 4500-11000)\n2026-03-18  BSP-HM-PLT   Platelets      238000 /μL    ✓ normal (ref 150000-400000)\n2026-03-18  BSP-HM-MCV   MCV            88 fL         ✓ normal (ref 80-100)\n2026-03-18  BSP-HM-FER   Ferritin       22 ng/mL      ⚠ low-normal (ref 20-200)\n...\n\nSource: Arweave TX bundle ar://xyz789... (chain verified)"
  }]
}
```

## Response — scope violation

```json
{
  "content": [{
    "type": "text",
    "text": "⛔ BSP Consent Error [SCOPE_VIOLATION]\n\nCategory BSP-CV is outside the authorized scope of this token.\nToken tok_7f3a...c291 authorizes: BSP-HM, BSP-GL, BSP-LA\n\nThe BEO holder must issue a new token that includes BSP-CV."
  }],
  "isError": true
}
```

## Response — token expired

```json
{
  "content": [{
    "type": "text",
    "text": "⛔ BSP Consent Error [TOKEN_EXPIRED]\n\nThe ConsentToken tok_7f3a...c291 expired on 2026-06-01.\nThe BEO holder must issue a new token to continue.\n→ https://biologicalsovereigntyprotocol.com/getting-started/quickstart"
  }],
  "isError": true
}
```
