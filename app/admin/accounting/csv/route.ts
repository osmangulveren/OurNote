import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildAccountingReport, getDefaultWeeklyRange } from "@/lib/accounting/report";
import { reportToCsv } from "@/lib/accounting/csv";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role === "CUSTOMER" || !(session.user as any).role) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const def = getDefaultWeeklyRange();

  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  const start = fromStr ? new Date(fromStr) : def.start;
  const end = toStr ? new Date(toStr) : def.end;
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const report = await buildAccountingReport(start, end);
  const csv = reportToCsv(report);

  const filename = `on-muhasebe-${start.toISOString().slice(0,10)}_${end.toISOString().slice(0,10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
