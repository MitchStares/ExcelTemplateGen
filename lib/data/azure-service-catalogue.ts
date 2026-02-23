import { getAzurePricingLookup } from './azure-pricing';

// Max SKUs to list per service in the AI prompt (keeps prompt manageable)
const MAX_SKUS_PER_SERVICE = 8;

let _catalogueText: string | undefined;

/**
 * Returns a compact plain-text service catalogue for use in AI system prompts.
 * Format: "ServiceName (Family): sku1, sku2, sku3..."
 * Cached after first call.
 */
export function getServiceCatalogueText(): string {
  if (_catalogueText) return _catalogueText;

  const lookup = getAzurePricingLookup();
  const lines: string[] = [];

  for (const [serviceName, info] of Object.entries(lookup.services)) {
    const skus = info.skus.slice(0, MAX_SKUS_PER_SERVICE);
    const skuList = skus.join(', ');
    const overflow = info.skus.length > MAX_SKUS_PER_SERVICE
      ? ` (+${info.skus.length - MAX_SKUS_PER_SERVICE} more)`
      : '';
    lines.push(`${serviceName} (${info.family}): ${skuList}${overflow}`);
  }

  _catalogueText = lines.join('\n');
  return _catalogueText;
}
