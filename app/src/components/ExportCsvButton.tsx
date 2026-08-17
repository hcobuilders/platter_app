"use client";

// "create a new dynamic table style with export that we can use
// globally" (S-batch #67) — DataTable's body is caller-authored JSX, not
// a data array it owns, so it can't build a CSV itself; this is the
// reusable piece any table's caller-owned header can drop in instead,
// passing the same rows it already rendered. Client-side blob download,
// no server round-trip needed.
export function ExportCsvButton({
  filename,
  headers,
  rows,
}: {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  function download() {
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button className="btn btn--sm btn--gh" type="button" onClick={download}>
      Export CSV
    </button>
  );
}

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
