export interface CoinPackage {
  label: string;
  amount: number;
  price: number; // USD
  currency: string;
  description?: string;
}

export interface GemPackage {
  label: string;
  amount: number;
  price: number; // USD
  currency: string;
  description?: string;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { label: "Starter",    amount: 1000,  price: 9.99,  currency: "$", description: "Entry-level coin pack for testing and light engagement" },
  { label: "Growth",     amount: 5000,  price: 44.99, currency: "$", description: "Higher-volume pack suitable for small teams" },
  { label: "Pro",        amount: 10000, price: 79.99, currency: "$", description: "Professional-grade pack with meaningful per-coin savings" },
  { label: "Enterprise", amount: 50000, price: 349.99, currency: "$", description: "Maximum-volume pack with the best overall value" },
];

export const GEM_PACKAGES: GemPackage[] = [
  { label: "Starter",    amount: 10,   price: 9.99,   currency: "$", description: "Entry-level gem pack for quick engagement and small rewards" },
  { label: "Growth",     amount: 50,   price: 44.99,  currency: "$", description: "Mid-volume pack with improved value per gem" },
  { label: "Pro",        amount: 100,  price: 79.99,  currency: "$", description: "Premium reward pack with full purchasing power unlocks" },
  { label: "Enterprise", amount: 500,  price: 349.99, currency: "$", description: "Enterprise-scale grant pack with maximum efficiency" },
];

export function getCoinPackage(amountOrLabel: number | string): CoinPackage | undefined {
  if (typeof amountOrLabel === "number") {
    return COIN_PACKAGES.find((p) => p.amount === amountOrLabel);
  }
  return COIN_PACKAGES.find((p) => p.label === amountOrLabel);
}

export function getGemPackage(amountOrLabel: number | string): GemPackage | undefined {
  if (typeof amountOrLabel === "number") {
    return GEM_PACKAGES.find((p) => p.amount === amountOrLabel);
  }
  return GEM_PACKAGES.find((p) => p.label === amountOrLabel);
}

export function getCoinPrice(amount: number): number {
  if (amount <= 0) return 0;
  const sorted = [...COIN_PACKAGES].sort((a, b) => a.amount - b.amount);
  if (amount <= sorted[0].amount) {
    return (amount / sorted[0].amount) * sorted[0].price;
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    const low = sorted[i];
    const high = sorted[i + 1];
    if (amount >= low.amount && amount <= high.amount) {
      const t = (amount - low.amount) / (high.amount - low.amount);
      return low.price + t * (high.price - low.price);
    }
  }
  const last = sorted[sorted.length - 1];
  return (amount / last.amount) * last.price;
}

export function getGemPrice(amount: number): number {
  if (amount <= 0) return 0;
  const sorted = [...GEM_PACKAGES].sort((a, b) => a.amount - b.amount);
  if (amount <= sorted[0].amount) {
    return (amount / sorted[0].amount) * sorted[0].price;
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    const low = sorted[i];
    const high = sorted[i + 1];
    if (amount >= low.amount && amount <= high.amount) {
      const t = (amount - low.amount) / (high.amount - low.amount);
      return low.price + t * (high.price - low.price);
    }
  }
  const last = sorted[sorted.length - 1];
  return (amount / last.amount) * last.price;
}

export function formatCoinValue(amount: number): string {
  const price = getCoinPrice(amount);
  return `$${price.toFixed(2)}`;
}

export function formatGemValue(amount: number): string {
  const price = getGemPrice(amount);
  return `$${price.toFixed(2)}`;
}

export function getCoinUnitPrice(amount: number): number {
  if (amount <= 0) return 0;
  return getCoinPrice(amount) / amount;
}

export function getGemUnitPrice(amount: number): number {
  if (amount <= 0) return 0;
  return getGemPrice(amount) / amount;
}
