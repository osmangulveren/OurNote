// Approximate positions (lon, lat) used by the stylised route map.
export const CITIES: Record<string, [number, number]> = {
  Istanbul: [28.97, 41.01],
  "Kapıkule": [26.55, 41.72],
  Sofia: [23.32, 42.7],
  Bucharest: [26.1, 44.43],
  Budapest: [19.04, 47.5],
  Vienna: [16.37, 48.21],
};

export const COUNTRY_POINT: Record<string, [number, number]> = {
  AT: [16.37, 48.21], BE: [4.35, 50.85], BG: [23.32, 42.7], HR: [15.98, 45.81], CY: [33.38, 35.17],
  CZ: [14.42, 50.08], DK: [12.57, 55.68], EE: [24.75, 59.44], FI: [24.94, 60.17], FR: [2.35, 48.86],
  DE: [11.58, 48.14], GR: [23.73, 37.98], HU: [19.04, 47.5], IE: [-6.26, 53.35], IT: [9.19, 45.46],
  LV: [24.11, 56.95], LT: [25.28, 54.69], LU: [6.13, 49.61], MT: [14.51, 35.9], NL: [4.9, 52.37],
  PL: [21.01, 52.23], PT: [-9.14, 38.72], RO: [26.1, 44.43], SK: [17.11, 48.15], SI: [14.51, 46.06],
  ES: [-3.7, 40.42], SE: [18.07, 59.33], CH: [8.54, 47.37], NO: [10.75, 59.91], GB: [-0.13, 51.51],
  MD: [28.86, 47.01], RS: [20.46, 44.79],
};

/** Waypoints Istanbul → destination country (lon, lat). */
export function routeTo(country: string): { name: string; at: [number, number] }[] {
  const dest = COUNTRY_POINT[country] ?? COUNTRY_POINT.DE;
  const pts = [
    { name: "Istanbul", at: CITIES.Istanbul },
    { name: "Kapıkule", at: CITIES["Kapıkule"] },
  ];
  if (["RO", "MD"].includes(country)) pts.push({ name: "Bucharest", at: CITIES.Bucharest });
  else if (!["BG", "GR", "CY"].includes(country)) {
    pts.push({ name: "Sofia", at: CITIES.Sofia });
    if (dest[0] < 20) pts.push({ name: "Budapest", at: CITIES.Budapest });
  }
  pts.push({ name: "Your store", at: dest });
  return pts;
}

// Simple equirectangular projection into a 1000×700 box covering Europe.
export function project([lon, lat]: [number, number]) {
  const x = ((lon + 11) / (36 + 11)) * 1000;
  const y = ((62 - lat) / (62 - 34)) * 700;
  return [x, y] as const;
}
