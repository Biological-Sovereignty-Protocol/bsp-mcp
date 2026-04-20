# Example — `bsp_list_categories`

**Consent required:** No — public taxonomy.

**What it does:** Returns all 25 BSP taxonomy categories. Optional level filter.

---

## Input schema

```json
{
  "type": "object",
  "properties": {
    "level": {
      "type": "string",
      "enum": ["CORE", "STANDARD", "EXTENDED", "DEVICE"],
      "description": "Filter by taxonomy level"
    }
  },
  "required": []
}
```

## Request — all categories

```json
{
  "name": "bsp_list_categories",
  "arguments": {}
}
```

## Response

```json
{
  "content": [{
    "type": "text",
    "text": "BSP Taxonomy — 25 categories\n────────────────────────────\n\nLevel 1 — CORE (9 categories — advanced longevity):\n  BSP-EP  Epigenetic Aging\n  BSP-MT  Mitochondrial Health\n  BSP-IN  Inflammatory Age\n  BSP-OX  Oxidative Stress\n  ...\n\nLevel 2 — STANDARD (9 categories — routine labs):\n  BSP-HM  Hematology\n  BSP-LA  Lab Advanced\n  BSP-CV  Cardiovascular\n  BSP-ME  Metabolic\n  BSP-HR  Hormones\n  ...\n\nLevel 3 — EXTENDED (6 categories — specialized):\n  BSP-GL  Genomics Light\n  BSP-MC  Microbiome\n  ...\n\nLevel 4 — DEVICE (1 category — continuous wearable):\n  BSP-WR  Wearable\n\nTotal: 210+ biomarker codes across 25 categories."
  }]
}
```
