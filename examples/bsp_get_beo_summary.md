# Example — `bsp_get_beo_summary`

**Consent required:** Yes — `READ_RECORDS` intent.

**What it does:** Returns an overview of the user's biological profile — categories present, record counts, last measurement dates, and data coverage level.

---

## Input schema

```json
{
  "type": "object",
  "properties": {},
  "required": []
}
```

## Request payload

```json
{
  "name": "bsp_get_beo_summary",
  "arguments": {}
}
```

## Response

```json
{
  "content": [{
    "type": "text",
    "text": "BEO Summary — alice.bsp\n─────────────────────────\nTotal records:    437\nData coverage:    EXTENDED\nFirst record:     2024-06-12\nLast record:      2026-04-15\n\nCategories present (within authorized scope):\n  BSP-HM  Hematology          178 records   last: 2026-04-15\n  BSP-LA  Lab Advanced         92 records   last: 2026-03-22\n  BSP-GL  Genomics Light        1 record    last: 2024-11-08\n\nCategories not authorized on current token:\n  BSP-CV  Cardiovascular\n  BSP-WR  Wearable\n  (request a new ConsentToken to access)"
  }]
}
```
