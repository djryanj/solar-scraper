const test = require("node:test");
const assert = require("node:assert/strict");

const scraper = require("../../components/scraper");
const { summaryHtml, realtimeHtml } = require("../fixtures/ecu-pages");

test("parseResults extracts system and panel metrics from ECU pages", () => {
  const result = scraper.parseResults(summaryHtml, realtimeHtml, "Roof Site");

  assert.equal(result.ecuName, "Garage ECU");
  assert.equal(result.siteName, "Roof Site");
  assert.equal(result.totalGen, 1234.5);
  assert.equal(result.dailyGen, 12.34);
  assert.equal(result.currentSystemPower, 456);
  assert.equal(result.gallonsSaved, 789);
  assert.equal(result.treesPlanted, 321);
  assert.equal(result.carbonOffset, 654);
  assert.deepEqual(result.data, [
    {
      inverterID: "Z-2",
      currentPower: 98,
      gridFrequency: 59.9,
      gridVoltage: 239,
      temperature: 44,
      reportingTime: "2026-03-20 10:00:00",
    },
    {
      inverterID: "A-1",
      currentPower: 101,
      gridFrequency: 60.1,
      gridVoltage: 240,
      temperature: 45,
      reportingTime: "2026-03-20 10:00:00",
    },
  ]);
});

test("parseTable normalizes heading names to camelCase", () => {
  const table = scraper.parseTable(require("cheerio").load(realtimeHtml)("table"));

  assert.equal(table[0].inverterID, "Z-2");
  assert.equal(table[0].gridFrequency, "59.9 Hz");
});

test("createScraper fetches both ECU endpoints and parses the responses", async () => {
  const fetchCalls = [];
  const getResults = scraper.createScraper(
    {
      summaryUrl: "http://ecu.local/index.php/home",
      realTimeDataURL: "http://ecu.local/index.php/realtimedata",
      requestTimeoutMs: 500,
      siteName: "Roof Site",
    },
    async (url) => {
      fetchCalls.push(url);
      return {
        ok: true,
        async text() {
          return url.includes("home") ? summaryHtml : realtimeHtml;
        },
      };
    },
  );

  const result = await getResults();

  assert.deepEqual(fetchCalls, [
    "http://ecu.local/index.php/home",
    "http://ecu.local/index.php/realtimedata",
  ]);
  assert.equal(result.siteName, "Roof Site");
  assert.equal(result.data.length, 2);
});

test("fetchPage surfaces HTTP failures with context", async () => {
  await assert.rejects(
    scraper.fetchPage(
      "http://ecu.local/index.php/home",
      { requestTimeoutMs: 1000 },
      async () => ({ ok: false, status: 503, statusText: "Unavailable" }),
    ),
    /Request failed for http:\/\/ecu.local\/index.php\/home: 503 Unavailable/,
  );
});