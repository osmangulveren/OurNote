/**
 * Haftalık ön muhasebe raporu job'u.
 *
 * MVP'de:
 *   - Raporu oluşturur.
 *   - CSV içeriğini console'a yazar (gerçek email/SMTP yok).
 *   - AccountingReportLog tablosuna kayıt atar.
 *
 * İleride:
 *   - SMTP veya transactional email (Resend, SES) bağlanabilir.
 *   - CSV/Excel attachment ile muhasebeciye gönderilir.
 *   - Cron / scheduler'dan tetiklenir (README'ye bakın).
 */

import { prisma } from "@/lib/prisma";
import { buildAccountingReport, getDefaultWeeklyRange } from "./report";
import { reportToCsv } from "./csv";

export interface WeeklyJobResult {
  start: Date;
  end: Date;
  recipient: string;
  totalOrders: number;
  totalGrand: string;
  logId: string;
}

export async function runWeeklyReportJob(now: Date = new Date()): Promise<WeeklyJobResult> {
  const recipient = process.env.ACCOUNTANT_EMAIL ?? "accountant@example.com";
  const { start, end } = getDefaultWeeklyRange(now);

  console.log("============================================================");
  console.log(`[weekly-report] ${start.toISOString()} → ${end.toISOString()}`);
  console.log(`[weekly-report] recipient: ${recipient}`);

  const report = await buildAccountingReport(start, end);
  const csv = reportToCsv(report);

  // SIMULATION: Gerçek email yerine console'a yaz.
  console.log("------------------ CSV PAYLOAD ------------------");
  console.log(csv);
  console.log("-------------------------------------------------");
  console.log(`[weekly-report] orders=${report.totalOrders} totalGrand=${report.totalGrand}`);

  const log = await prisma.accountingReportLog.create({
    data: {
      periodStart: start,
      periodEnd: end,
      totalOrders: report.totalOrders,
      totalSales: report.totalSales,
      totalVat: report.totalVat,
      recipient,
      status: "SIMULATED",
      payload: report as any,
    },
  });

  console.log(`[weekly-report] log id: ${log.id}`);
  console.log("============================================================");

  return {
    start,
    end,
    recipient,
    totalOrders: report.totalOrders,
    totalGrand: report.totalGrand,
    logId: log.id,
  };
}
