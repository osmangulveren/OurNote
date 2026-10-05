const env = (key: string, fallback: string) => process.env[key] || fallback;

export const config = {
  brandName: env("BRAND_NAME", "Anatolia Home"),
  company: {
    legalName: env("COMPANY_LEGAL_NAME", "Your Company SRL"),
    address: env("COMPANY_ADDRESS", "Bucharest, Romania"),
    vat: env("COMPANY_VAT", "RO00000000"),
    email: env("COMPANY_EMAIL", "orders@example.com"),
    iban: env("COMPANY_IBAN", ""),
    bank: env("COMPANY_BANK", ""),
  },
  appUrl: env("APP_URL", "http://localhost:3000"),
  vatRateRO: Number(env("VAT_RATE_RO", "21")),
  freightPerCbm: Number(env("FREIGHT_PER_CBM", "0")),
  truckCapacityCbm: Number(env("TRUCK_CAPACITY_CBM", "90")),
  stripeEnabled: Boolean(process.env.STRIPE_SECRET_KEY),
};

export const EU_COUNTRIES: Record<string, string> = {
  AT: "Austria", BE: "Belgium", BG: "Bulgaria", HR: "Croatia", CY: "Cyprus",
  CZ: "Czechia", DK: "Denmark", EE: "Estonia", FI: "Finland", FR: "France",
  DE: "Germany", GR: "Greece", HU: "Hungary", IE: "Ireland", IT: "Italy",
  LV: "Latvia", LT: "Lithuania", LU: "Luxembourg", MT: "Malta", NL: "Netherlands",
  PL: "Poland", PT: "Portugal", RO: "Romania", SK: "Slovakia", SI: "Slovenia",
  ES: "Spain", SE: "Sweden",
};

export const OTHER_COUNTRIES: Record<string, string> = {
  CH: "Switzerland", NO: "Norway", GB: "United Kingdom", MD: "Moldova", RS: "Serbia",
};

export const ALL_COUNTRIES = { ...EU_COUNTRIES, ...OTHER_COUNTRIES };

export const countryName = (code: string) =>
  (ALL_COUNTRIES as Record<string, string>)[code] ?? code;
