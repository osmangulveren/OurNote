// Usage: npm run catalog:import -- data/catalog.json
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { importCatalog } from "../lib/catalog-import";

const file = process.argv[2] ?? "data/catalog.json";
const db = new PrismaClient();

importCatalog(db, JSON.parse(readFileSync(file, "utf8")))
  .then((r) => console.log(`Imported ${file}: ${r.created} created, ${r.updated} updated`))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
