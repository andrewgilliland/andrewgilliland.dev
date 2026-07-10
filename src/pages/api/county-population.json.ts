import type { APIRoute } from "astro";

export const prerender = true;

const CENSUS_COUNTY_TOTALS_CSV_URL =
  "https://www2.census.gov/programs-surveys/popest/datasets/2020-2023/counties/totals/co-est2023-alldata.csv";

const COUNTY_SUMMARY_LEVEL = "050";

function stripCsvCell(value: string): string {
  return value.trim().replace(/^"|"$/g, "");
}

export const GET: APIRoute = async () => {
  const response = await fetch(CENSUS_COUNTY_TOTALS_CSV_URL);

  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: "Failed to load Census county totals." }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const csvText = await response.text();
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return new Response(
      JSON.stringify({ error: "Unexpected Census county totals format." }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const headers = lines[0].split(",").map((header) => stripCsvCell(header));

  const indexByName = (name: string) => headers.indexOf(name);
  const sumlevIndex = indexByName("SUMLEV");
  const stateIndex = indexByName("STATE");
  const countyIndex = indexByName("COUNTY");
  const stateNameIndex = indexByName("STNAME");
  const countyNameIndex = indexByName("CTYNAME");
  const populationIndex = indexByName("POPESTIMATE2023");

  if (
    sumlevIndex < 0 ||
    stateIndex < 0 ||
    countyIndex < 0 ||
    stateNameIndex < 0 ||
    countyNameIndex < 0 ||
    populationIndex < 0
  ) {
    return new Response(
      JSON.stringify({ error: "Census columns were not found." }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const counties: Record<
    string,
    {
      stateId: string;
      name: string;
      population: number;
    }
  > = {};

  for (const line of lines.slice(1)) {
    const columns = line.split(",").map((value) => stripCsvCell(value));

    if (columns[sumlevIndex] !== COUNTY_SUMMARY_LEVEL) {
      continue;
    }

    const stateId = (columns[stateIndex] ?? "").padStart(2, "0");
    const countyCode = (columns[countyIndex] ?? "").padStart(3, "0");
    const countyId = `${stateId}${countyCode}`;
    const countyName = columns[countyNameIndex] ?? "";
    const stateName = columns[stateNameIndex] ?? "";
    const population = Number(columns[populationIndex]);

    if (
      !countyName ||
      !stateName ||
      !Number.isFinite(population) ||
      population <= 0
    ) {
      continue;
    }

    counties[countyId] = {
      stateId,
      name: `${countyName}, ${stateName}`,
      population,
    };
  }

  return new Response(
    JSON.stringify({
      source: "U.S. Census Bureau Population Estimates Program (2023)",
      counties,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
      },
    },
  );
};
