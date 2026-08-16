const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatCents(cents: bigint | number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
  return moneyFormatter.format(Number(cents) / 100);
}

export function dollarsToCents(dollars: number): bigint {
  return BigInt(Math.round(dollars * 100));
}
