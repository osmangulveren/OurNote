import { runWeeklyReportJob } from "../lib/accounting/weeklyReportJob";

runWeeklyReportJob()
  .then((r) => {
    console.log("✓ Weekly report finished:", r.logId);
    process.exit(0);
  })
  .catch((e) => {
    console.error("✗ Weekly report failed:", e);
    process.exit(1);
  });
