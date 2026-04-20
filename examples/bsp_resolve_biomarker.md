# Example — `bsp_resolve_biomarker`

**Consent required:** No — public taxonomy.

**What it does:** Returns name, category, level, and clinical context for a BSP biomarker code.

---

## Input schema

```json
{
  "type": "object",
  "properties": {
    "code": { "type": "string", "description": "BSP biomarker code (e.g. BSP-HM-HGB)" }
  },
  "required": ["code"]
}
```

## Request — resolve hemoglobin

```json
{
  "name": "bsp_resolve_biomarker",
  "arguments": { "code": "BSP-HM-HGB" }
}
```

## Response

```json
{
  "content": [{
    "type": "text",
    "text": "Biomarker: BSP-HM-HGB\nName:      Hemoglobin\nCategory:  BSP-HM (Hematology)\nLevel:     STANDARD\nUnit:      g/dL (primary), g/L (alt)\nRef range: 12.0–16.0 (adult female), 13.5–17.5 (adult male)\n\nClinical context:\nHemoglobin is the oxygen-carrying protein in red blood cells. Low values suggest anemia (iron deficiency, chronic disease, blood loss). High values suggest dehydration or polycythemia."
  }]
}
```

## Response — unknown code

```json
{
  "content": [{
    "type": "text",
    "text": "⛔ Error [BIOMARKER_CODE_UNKNOWN]\n\nBSP-XX-YZ is not in the BSP taxonomy.\nUse bsp_list_categories to see all known categories."
  }],
  "isError": true
}
```
