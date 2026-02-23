# Azure Pricing Data

This directory contains Azure pricing data for the Australia East region.

## Files

- **azure-pricing-lookup.json** (341KB) - Optimized lookup structure with 1,971 SKU entries
  - Used by the Azure Calculator template
  - Safe to commit to git
  - Format: `{ pricing: { "ServiceName|SkuName": { price, unit, family, sku } }, services: {...} }`

- **azure-pricing.ts** - TypeScript helper functions and types for working with pricing data

## Excluded Files (in .gitignore)

The following large files are excluded from version control:

- `azure-pricing-aud.json` (9MB) - Complete pricing data with all 12,367 items
- `azure-pricing-aud-subset.json` (3.8MB) - Filtered subset
- `azure-pricing-aud-compact.json` (2.9MB) - Compact version

## Regenerating Pricing Data

To fetch the latest pricing data:

1. Create a script to fetch from Azure Retail Prices API:
   ```bash
   curl "https://prices.azure.com/api/retail/prices?currencyCode=AUD&\$filter=priceType eq 'Consumption' and armRegionName eq 'australiaeast'"
   ```

2. Process and filter to create the lookup file
3. Keep only `azure-pricing-lookup.json` in version control

## Memory Considerations

⚠️ **Important**: Only the lookup file should be imported in the application code. The large JSON files (>2MB) cause excessive memory usage during Next.js compilation and should be excluded from the build.

The current setup:
- Build time: ~3s
- Dev server startup: <1s
- Memory usage: Normal

If you import the large files, expect:
- Build time: >60s
- Dev server startup: >30s
- Memory usage: >5GB
