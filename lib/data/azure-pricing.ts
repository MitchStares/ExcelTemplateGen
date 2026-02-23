/**
 * Azure Retail Pricing Data for Australia East
 * Fetched from: https://prices.azure.com/api/retail/prices
 * Currency: AUD
 * Region: australiaeast
 * Last Updated: 2026-02-23
 */

export interface AzurePriceEntry {
  price: number;
  unit: string;
  family: string;
  sku: string;
}

export interface AzureServiceInfo {
  family: string;
  skus: string[];
}

export interface AzurePricingLookup {
  currency: string;
  region: string;
  generatedAt: string;
  pricing: Record<string, AzurePriceEntry>;
  services: Record<string, AzureServiceInfo>;
}

// Lazy-load pricing data to avoid Turbopack issues in dev mode
let _pricingLookupCache: AzurePricingLookup | undefined;

function getPricingLookup(): AzurePricingLookup {
  if (!_pricingLookupCache) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _pricingLookupCache = require('./azure-pricing-lookup.json') as AzurePricingLookup;
  }
  return _pricingLookupCache;
}

// Export as a getter to ensure lazy loading
export function getAzurePricingLookup(): AzurePricingLookup {
  return getPricingLookup();
}

// For backwards compatibility, export a constant that gets initialized on first access
export const azurePricingLookup = getPricingLookup();

/**
 * Helper function to find pricing by service name and SKU
 */
export function findPricing(serviceName: string, skuName: string): AzurePriceEntry | undefined {
  const lookup = getPricingLookup();
  const key = `${serviceName}|${skuName}`;
  return lookup.pricing[key];
}

/**
 * Helper function to get all SKUs for a service
 */
export function getServiceSkus(serviceName: string): string[] {
  const lookup = getPricingLookup();
  return lookup.services[serviceName]?.skus || [];
}

/**
 * Helper function to get all available services
 */
export function getAllServices(): string[] {
  const lookup = getPricingLookup();
  return Object.keys(lookup.services);
}

/**
 * Helper function to get services by family
 */
export function getServicesByFamily(family: string): string[] {
  const lookup = getPricingLookup();
  return Object.keys(lookup.services).filter(
    serviceName => lookup.services[serviceName].family === family
  );
}

/**
 * Get monthly cost from hourly price
 */
export function getMonthlyFromHourly(hourlyPrice: number): number {
  return hourlyPrice * 730; // Average hours per month
}

/**
 * Get annual cost from monthly price
 */
export function getAnnualFromMonthly(monthlyPrice: number): number {
  return monthlyPrice * 12;
}

/**
 * Get monthly cost for a service/SKU combination with quantity
 */
export function getMonthlyTotalCost(serviceName: string, skuName: string, quantity: number = 1): number {
  const pricing = findPricing(serviceName, skuName);
  if (!pricing) return 0;

  // Convert hourly to monthly if needed
  if (pricing.unit.includes('Hour')) {
    return getMonthlyFromHourly(pricing.price) * quantity;
  }

  // Monthly or per-unit pricing
  return pricing.price * quantity;
}
