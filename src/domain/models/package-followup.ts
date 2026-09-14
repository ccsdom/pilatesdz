import type { CreditPackage } from "./package";

export type FollowupPackage = CreditPackage & { subscriptionId?: string };
export function summarizePackages(packages: FollowupPackage[], subscriptionEnds: Record<string, number>, at: number) {
  const current = packages.filter(p => p.validFrom <= at && at < p.expiresAt);
  const remaining = current.reduce((sum, p) => sum + p.remaining, 0);
  const future = packages.filter(p => p.validFrom > at).reduce((sum, p) => sum + p.remaining, 0);
  const endings = new Map<string, { label: string; expiresAt: number }>();
  for (const pack of current) {
    const end = pack.subscriptionId ? subscriptionEnds[pack.subscriptionId] : pack.expiresAt;
    if (!Number.isSafeInteger(end)) throw new Error("Missing subscription expiry");
    if (end > at && end <= at + 7 * 86400000) endings.set(pack.subscriptionId ? `subscription:${pack.subscriptionId}` : `package:${pack.id}`, { label: pack.subscriptionId ? "Abonnement" : pack.label, expiresAt: end });
  }
  return { remaining, future, low: current.length > 0 && remaining <= 1, endings: [...endings.values()].sort((a, b) => a.expiresAt - b.expiresAt) };
}
export type PackageFollowup = ReturnType<typeof summarizePackages> & { clientId: string; name: string };
export type PackageFollowupPage = { at: number; scanned: number; rows: PackageFollowup[]; next: string | null };
