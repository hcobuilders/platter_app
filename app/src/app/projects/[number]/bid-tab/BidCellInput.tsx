"use client";

import { useRef, useState, useTransition } from "react";
import { updateBidLineAmount } from "./actions";

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

function digitsFromCents(cents: bigint): string {
  const abs = cents < 0n ? -cents : cents;
  return abs.toString();
}

function formatDigits(digits: string): string {
  const n = Number(digits || "0");
  return currencyFormatter.format(n / 100);
}

// Spreadsheet-style editable price cell for the Bid Tab grid — formats live
// as digits are typed (a cents-buffer mask, like a POS terminal: typing
// "12345" progressively shows $0.01 → $0.12 → $1.23 → $12.34 → $123.45,
// same pattern as most finance-app amount fields), selects its full value
// on focus, and supports arrow-key navigation to adjacent cells addressed
// by row/col position in the grid.
export function BidCellInput({
  bidLineId,
  projectNumber,
  defaultAmountCents,
  row,
  col,
}: {
  bidLineId: string;
  projectNumber: string;
  defaultAmountCents: bigint;
  row: number;
  col: number;
}) {
  const [digits, setDigits] = useState(digitsFromCents(defaultAmountCents));
  const [negative, setNegative] = useState(defaultAmountCents < 0n);
  const saved = useRef({ digits: digitsFromCents(defaultAmountCents), negative: defaultAmountCents < 0n });
  const [, startTransition] = useTransition();

  function commit() {
    if (digits === saved.current.digits && negative === saved.current.negative) return;
    saved.current = { digits, negative };
    const cents = BigInt(digits || "0") * (negative ? -1n : 1n);
    startTransition(() => updateBidLineAmount(projectNumber, bidLineId, cents));
  }

  function moveFocus(dr: number, dc: number) {
    commit();
    const target = document.getElementById(`bidcell-${row + dr}-${col + dc}`);
    target?.focus();
  }

  return (
    <input
      id={`bidcell-${row}-${col}`}
      className="tfld n"
      inputMode="decimal"
      value={`${negative ? "-" : ""}${formatDigits(digits)}`}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const raw = e.target.value;
        setNegative(raw.trim().startsWith("-"));
        setDigits(raw.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, ""));
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        const input = e.currentTarget;
        if (e.key === "ArrowUp") {
          e.preventDefault();
          moveFocus(-1, 0);
        } else if (e.key === "ArrowDown" || e.key === "Enter") {
          e.preventDefault();
          moveFocus(1, 0);
        } else if (e.key === "ArrowLeft" && input.selectionStart === 0) {
          e.preventDefault();
          moveFocus(0, -1);
        } else if (e.key === "ArrowRight" && input.selectionStart === input.value.length) {
          e.preventDefault();
          moveFocus(0, 1);
        } else if (e.key === "-") {
          e.preventDefault();
          setNegative((v) => !v);
        }
      }}
    />
  );
}
