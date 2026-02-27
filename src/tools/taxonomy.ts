import { BioLevel, BSPCategory } from '../types'

// All 25 BSP taxonomy categories
const CATEGORIES: BSPCategory[] = [
    // Level 1 — Core Longevity (9 categories)
    { code: 'BSP-LA', level: 'CORE', name: 'Longevity & Aging' },
    { code: 'BSP-RC', level: 'CORE', name: 'Regeneration & Cellular Health' },
    { code: 'BSP-CV', level: 'CORE', name: 'Cardiovascular Health' },
    { code: 'BSP-IM', level: 'CORE', name: 'Immune Function & Inflammation' },
    { code: 'BSP-ME', level: 'CORE', name: 'Metabolism & Cellular Energy' },
    { code: 'BSP-NR', level: 'CORE', name: 'Neurological Health' },
    { code: 'BSP-DH', level: 'CORE', name: 'Detoxification & Hepatic Function' },
    { code: 'BSP-LF', level: 'CORE', name: 'Lymphatic System & Clearance' },
    { code: 'BSP-BC', level: 'CORE', name: 'Biological Clock & Senescence' },
    // Level 2 — Standard Laboratory (9 categories)
    { code: 'BSP-HM', level: 'STANDARD', name: 'Hematology' },
    { code: 'BSP-VT', level: 'STANDARD', name: 'Vitamins' },
    { code: 'BSP-MN', level: 'STANDARD', name: 'Minerals & Electrolytes' },
    { code: 'BSP-HR', level: 'STANDARD', name: 'Hormones' },
    { code: 'BSP-RN', level: 'STANDARD', name: 'Renal Function' },
    { code: 'BSP-LP', level: 'STANDARD', name: 'Conventional Lipids' },
    { code: 'BSP-GL', level: 'STANDARD', name: 'Glycemia & Metabolic Markers' },
    { code: 'BSP-LV', level: 'STANDARD', name: 'Hepatic Function' },
    { code: 'BSP-IF', level: 'STANDARD', name: 'Inflammatory Markers' },
    // Level 3 — Extended / Specialized (6 categories)
    { code: 'BSP-GN', level: 'EXTENDED', name: 'Genomics & Epigenomics' },
    { code: 'BSP-MB', level: 'EXTENDED', name: 'Microbiome' },
    { code: 'BSP-PR', level: 'EXTENDED', name: 'Proteomics' },
    { code: 'BSP-MT', level: 'EXTENDED', name: 'Metabolomics' },
    { code: 'BSP-TX', level: 'EXTENDED', name: 'Toxicology' },
    { code: 'BSP-CL', level: 'EXTENDED', name: 'Clinical Assessment' },
    // Level 4 — Device (1 category)
    { code: 'BSP-DV', level: 'DEVICE', name: 'Device & Wearable Data' },
]

export function listCategories(levelFilter?: BioLevel): string {
    const cats = levelFilter
        ? CATEGORIES.filter(c => c.level === levelFilter)
        : CATEGORIES

    if (cats.length === 0) {
        return `No categories found for level "${levelFilter}".`
    }

    const grouped: Record<BioLevel, BSPCategory[]> = {
        CORE: [], STANDARD: [], EXTENDED: [], DEVICE: []
    }
    for (const cat of cats) grouped[cat.level].push(cat)

    const sections: string[] = []

    const levelMeta: Record<BioLevel, string> = {
        CORE: 'Level 1 — Core Longevity Biomarkers (required for certified institutions)',
        STANDARD: 'Level 2 — Standard Laboratory Biomarkers (performed worldwide)',
        EXTENDED: 'Level 3 — Extended / Specialized Biomarkers',
        DEVICE: 'Level 4 — Device & Wearable Continuous Data',
    }

    for (const level of ['CORE', 'STANDARD', 'EXTENDED', 'DEVICE'] as BioLevel[]) {
        if (!grouped[level].length) continue
        sections.push(`**${levelMeta[level]}**`)
        for (const cat of grouped[level]) {
            sections.push(`  • \`${cat.code}\` — ${cat.name}`)
        }
    }

    sections.push(`\nTotal: ${cats.length} categories across the BSP taxonomy.`)
    sections.push(`→ Full biomarker codes: https://github.com/Biological-Sovereignty-Protocol/bsp-spec/tree/main/spec/taxonomy`)

    return sections.join('\n')
}

export function resolveBiomarker(code: string): string {
    // Validate format
    const match = code.match(/^(BSP-[A-Z]{2})-(\d{3})$/)
    if (!match) {
        return (
            `❌ Invalid BSP biomarker code format: "${code}"\n\n` +
            `Expected format: \`BSP-XX-NNN\` where XX is a 2-letter category code and NNN is a 3-digit number.\n` +
            `Examples: \`BSP-GL-001\`, \`BSP-LA-003\`, \`BSP-HM-001\``
        )
    }

    const categoryCode = match[1]
    const cat = CATEGORIES.find(c => c.code === categoryCode)

    if (!cat) {
        return (
            `❌ Unknown BSP category: "${categoryCode}"\n\n` +
            `Use \`bsp_list_categories\` to see all valid category codes.`
        )
    }

    return [
        `**BSP Biomarker: \`${code}\`**`,
        ``,
        `| Field | Value |`,
        `|-------|-------|`,
        `| Category | \`${cat.code}\` — ${cat.name} |`,
        `| Level | ${cat.level} |`,
        `| Code format | Valid ✓ |`,
        ``,
        `> **Note:** Individual biomarker definitions (name, clinical significance, reference ranges, measurement methods)` +
        ` are defined in the \`bsp-spec\` taxonomy.`,
        `→ https://github.com/Biological-Sovereignty-Protocol/bsp-spec/tree/main/spec/taxonomy`,
    ].join('\n')
}
