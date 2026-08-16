import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { submitQuote, declineToBid } from "./actions";
import { CurrencyInput } from "@/components/CurrencyInput";

export const dynamic = "force-dynamic";

async function getInvitation(token: string) {
  return prisma.invitation.findUnique({
    where: { token },
    include: {
      bidPackage: { include: { scopeLineItems: { orderBy: { seq: "asc" } } } },
      bids: { include: { bidLines: true }, orderBy: { submittedAt: "desc" }, take: 1 },
    },
  });
}

const KIND_LABEL: Record<string, string> = {
  inclusion: "Inc",
  exclusion: "Exc",
  alternate: "Alt",
  allowance: "Allow",
  unit_price: "Unit $",
  clarification: "Clar",
  va_option: "VA",
};

export default async function QuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await getInvitation(token);
  if (!invitation) notFound();

  const bid = invitation.bids[0];
  const lineById = new Map(bid?.bidLines.filter((l) => l.scopeLineItemId).map((l) => [l.scopeLineItemId as string, l]));

  const baseBidLines = invitation.bidPackage.scopeLineItems.filter(
    (l) => l.kind !== "alternate" && l.kind !== "va_option"
  );
  const alternateLines = invitation.bidPackage.scopeLineItems.filter(
    (l) => l.kind === "alternate" || l.kind === "va_option"
  );

  function renderRow(line: (typeof baseBidLines)[number]) {
    const existing = lineById.get(line.id);
    return (
      <tr key={line.id}>
        <td>{line.description}</td>
        <td>
          <span className={`kb kb--${line.kind}`}>{KIND_LABEL[line.kind]}</span>
        </td>
        <td>
          <input
            type="checkbox"
            name={`included-${line.id}`}
            defaultChecked={existing ? existing.included : line.kind !== "alternate"}
          />
        </td>
        <td className="n">
          <CurrencyInput
            className="tfld n"
            name={`amount-${line.id}`}
            defaultValue={existing ? Number(existing.amount) / 100 : ""}
            style={{ width: 130 }}
          />
        </td>
      </tr>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="lbl">Submit your quote</div>
        <div style={{ font: "var(--t-h2)", marginTop: 6 }}>
          {invitation.bidPackage.code} {invitation.bidPackage.name}
        </div>
      </div>

      <form
        action={async (fd) => {
          "use server";
          await submitQuote(token, fd);
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <div className="lbl" style={{ marginBottom: 8 }}>
            Base bid
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Description</th>
                <th>Kind</th>
                <th>Include</th>
                <th className="n">Your price</th>
              </tr>
            </thead>
            <tbody>
              {baseBidLines.map(renderRow)}
              {baseBidLines.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: "var(--text-faint)" }}>
                    No base bid lines.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {alternateLines.length > 0 && (
          <div>
            <div className="lbl" style={{ marginBottom: 8 }}>
              Alternates &amp; VE options
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Kind</th>
                  <th>Include</th>
                  <th className="n">Your price</th>
                </tr>
              </thead>
              <tbody>{alternateLines.map(renderRow)}</tbody>
            </table>
          </div>
        )}

        <div className="card" style={{ maxWidth: 520 }}>
          <div className="lbl" style={{ marginBottom: 8 }}>
            Add a line not listed above{" "}
            <span style={{ textTransform: "none", letterSpacing: 0 }}>(sub-added, flagged separately)</span>
          </div>
          <div className="cf">
            <input className="fld" name="extraDescription" placeholder="Description" />
            <input className="fld" name="extraAmount" type="number" step="0.01" placeholder="Amount" />
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn btn--acc" type="submit">
            Submit quote
          </button>
        </div>
      </form>

      <form
        action={async () => {
          "use server";
          await declineToBid(token);
        }}
      >
        <button className="btn btn--gh" type="submit" style={{ color: "var(--danger-text)" }}>
          Decline to bid this package
        </button>
      </form>
    </div>
  );
}
