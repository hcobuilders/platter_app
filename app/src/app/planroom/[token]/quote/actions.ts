"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { dollarsToCents } from "@/lib/format";

export async function submitQuote(token: string, formData: FormData) {
  const invitation = await prisma.invitation.findUniqueOrThrow({
    where: { token },
    include: {
      bidPackage: { include: { scopeLineItems: true } },
      bids: { orderBy: { submittedAt: "desc" }, take: 1 },
    },
  });

  let bid = invitation.bids[0];
  if (!bid) {
    bid = await prisma.bid.create({
      data: { invitationId: invitation.id, source: "portal" },
    });
  }

  let total = 0n;

  for (const line of invitation.bidPackage.scopeLineItems) {
    const raw = String(formData.get(`amount-${line.id}`) ?? "").trim();
    const included = formData.get(`included-${line.id}`) === "on";
    if (raw === "") continue;
    const amount = dollarsToCents(Number(raw));
    if (included && line.kind !== "alternate") total += amount;

    const existing = await prisma.bidLine.findFirst({
      where: { bidId: bid.id, scopeLineItemId: line.id },
    });
    if (existing) {
      await prisma.bidLine.update({ where: { id: existing.id }, data: { amount, included, source: "sub" } });
    } else {
      await prisma.bidLine.create({
        data: { bidId: bid.id, scopeLineItemId: line.id, amount, included, source: "sub" },
      });
    }
  }

  const extraDesc = String(formData.get("extraDescription") ?? "").trim();
  const extraAmount = String(formData.get("extraAmount") ?? "").trim();
  if (extraDesc && extraAmount !== "") {
    await prisma.bidLine.create({
      data: {
        bidId: bid.id,
        amount: dollarsToCents(Number(extraAmount)),
        included: true,
        source: "sub",
        note: extraDesc,
      },
    });
  }

  await prisma.bid.update({
    where: { id: bid.id },
    data: { total, submittedAt: new Date() },
  });

  await prisma.invitation.update({ where: { id: invitation.id }, data: { intent: "bidding" } });

  revalidatePath(`/planroom/${token}`);
  revalidatePath(`/planroom/${token}/quote`);
}

export async function declineToBid(token: string) {
  await prisma.invitation.update({ where: { token }, data: { intent: "no_bid" } });
  revalidatePath(`/planroom/${token}`);
}
