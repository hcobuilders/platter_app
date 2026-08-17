// Computed display status for the Work Packages anchor screen (S-batch
// #69) — deliberately derived from real data rather than trusting the
// free-text BidPackage.status field, which seed data uses inconsistently
// (draft/scoping/bidding/leveling/submitted/awarded/lost, mixing package-
// and project-level vocabulary). Priority order: a real data problem
// (error) outranks everything else, self-perform is a distinct package
// type rather than a point on the bid-status spectrum, then the actual
// bid lifecycle.
//
// "Error" here only covers what the schema can actually detect today
// (zero scope line items — a major scope gap). Email-delivery and
// AI-parse failures aren't modeled anywhere yet, so those two conditions
// from the owner's spec aren't wired up — noted rather than faked.
export type PackageStatusKind = "error" | "self_perform" | "complete" | "no_response" | "out_for_bid" | "draft";

export type PackageStatusInput = {
  status: string;
  selfPerform: boolean;
  dueAt: Date | null;
  scopeLineCount: number;
  invitations: { sentAt: Date | null; hasBid: boolean }[];
  hasAward: boolean;
};

export const STATUS_META: Record<PackageStatusKind, { label: string; color: string }> = {
  error: { label: "Scope gap", color: "var(--danger-fill)" },
  self_perform: { label: "Self-perform", color: "var(--text-faint)" },
  complete: { label: "Complete", color: "var(--success-fill)" },
  no_response: { label: "No response", color: "var(--danger-fill)" },
  out_for_bid: { label: "Out for bid", color: "var(--info-fill)" },
  draft: { label: "Draft", color: "var(--text-faint)" },
};

export function computePackageStatus(pkg: PackageStatusInput): PackageStatusKind {
  if (pkg.scopeLineCount === 0) return "error";
  if (pkg.selfPerform) return "self_perform";
  if (pkg.hasAward || pkg.status === "awarded") return "complete";

  const sent = pkg.invitations.filter((i) => i.sentAt);
  const anyBid = pkg.invitations.some((i) => i.hasBid);
  const overdue = pkg.dueAt ? pkg.dueAt.getTime() < Date.now() : false;

  if (sent.length > 0 && !anyBid && overdue) return "no_response";
  if (sent.length > 0) return "out_for_bid";
  return "draft";
}
