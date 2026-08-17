// Minimal Primavera P6 .xer parser (S-batch #63/#64) — "so it can import
// a p6 xer and display a selection box to add only specific items and
// columns to the schedule table" / "right click list item to select
// predecessor successor/logic. allow fs and ss. break existing
// relationships in xer import that are not that." XER is plain
// tab-delimited text: a %T line starts a table section, the next %F
// line lists that table's column names, and %R lines are data rows
// (tab-delimited, positional against %F). Only TASK, PROJWBS, CALENDAR,
// and TASKPRED are read — resources and everything else in a real
// export are ignored.

export type ParsedActivity = {
  activityId: string;
  name: string;
  wbsCategory: string | null;
  startAt: string | null; // ISO string, or null if unparseable/missing
  finishAt: string | null;
  durationDays: number | null;
  calendarType: string | null;
};

export type ParsedRelationship = {
  predecessorActivityId: string;
  successorActivityId: string;
  type: "FS" | "SS";
};

export type ParsedSchedule = {
  activities: ParsedActivity[];
  relationships: ParsedRelationship[];
};

function parseXerDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const d = new Date(raw.trim().replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// P6's pred_type codes: PR_FS/PR_SS are what we keep; PR_FF/PR_SF (and
// anything unrecognized) are dropped per the owner's explicit
// instruction rather than approximated to the nearest supported type.
function mapRelType(predType: string | undefined): "FS" | "SS" | null {
  if (predType === "PR_FS") return "FS";
  if (predType === "PR_SS") return "SS";
  return null;
}

export function parseXer(text: string): ParsedSchedule {
  const lines = text.split(/\r?\n/);

  let currentTable: string | null = null;
  let currentFields: string[] = [];
  const tables: Record<string, Record<string, string>[]> = {};

  for (const line of lines) {
    if (!line) continue;
    const cells = line.split("\t");
    const marker = cells[0];

    if (marker === "%T") {
      currentTable = cells[1]?.trim() ?? null;
      currentFields = [];
      if (currentTable && !tables[currentTable]) tables[currentTable] = [];
    } else if (marker === "%F") {
      currentFields = cells.slice(1);
    } else if (marker === "%R" && currentTable) {
      const row: Record<string, string> = {};
      currentFields.forEach((field, i) => {
        row[field] = cells[i + 1] ?? "";
      });
      tables[currentTable].push(row);
    }
  }

  const wbsNameById = new Map<string, string>();
  for (const row of tables.PROJWBS ?? []) {
    if (row.wbs_id) wbsNameById.set(row.wbs_id, row.wbs_short_name || row.wbs_name || row.wbs_id);
  }

  const calendarNameById = new Map<string, string>();
  for (const row of tables.CALENDAR ?? []) {
    if (row.clndr_id) calendarNameById.set(row.clndr_id, row.clndr_name || row.clndr_id);
  }

  // XER's internal numeric task_id -> our activityId (task_code), so
  // TASKPRED rows (which reference task_id) can be re-expressed in
  // terms of the activity IDs the selection UI and commit step use.
  const activityIdByTaskId = new Map<string, string>();

  const activities: ParsedActivity[] = [];
  for (const row of tables.TASK ?? []) {
    const activityId = row.task_code?.trim();
    const name = row.task_name?.trim();
    if (!activityId || !name) continue;
    if (row.task_id) activityIdByTaskId.set(row.task_id, activityId);

    const hours = Number(row.target_drtn_hr_cnt);
    const durationDays = Number.isFinite(hours) && hours > 0 ? Math.round((hours / 8) * 10) / 10 : null;

    activities.push({
      activityId,
      name,
      wbsCategory: row.wbs_id ? (wbsNameById.get(row.wbs_id) ?? null) : null,
      startAt: parseXerDate(row.target_start_date),
      finishAt: parseXerDate(row.target_end_date),
      durationDays,
      calendarType: row.clndr_id ? (calendarNameById.get(row.clndr_id) ?? row.clndr_id) : null,
    });
  }

  const relationships: ParsedRelationship[] = [];
  for (const row of tables.TASKPRED ?? []) {
    const type = mapRelType(row.pred_type);
    if (!type) continue;
    const predecessorActivityId = row.pred_task_id ? activityIdByTaskId.get(row.pred_task_id) : undefined;
    const successorActivityId = row.task_id ? activityIdByTaskId.get(row.task_id) : undefined;
    if (!predecessorActivityId || !successorActivityId) continue;
    relationships.push({ predecessorActivityId, successorActivityId, type });
  }

  return { activities, relationships };
}
