const cheerio = require("cheerio");
const vars = require("./vars");

async function fetchPage(url, config = vars, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    signal: AbortSignal.timeout(config.requestTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(
      `Request failed for ${url}: ${response.status} ${response.statusText}`,
    );
  }

  return response.text();
}

async function fetchSummaryData() {
  const page = await fetchPage(vars.summaryUrl, vars);
  return cheerio.load(page);
}

async function fetchRealTimeData() {
  const page = await fetchPage(vars.realTimeDataURL, vars);
  return cheerio.load(page);
}

function toCamelCase(value) {
  return value
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, character) => character.toUpperCase())
    .replace(/^[A-Z]/, (character) => character.toLowerCase());
}

function parseInteger(value) {
  const parsedValue = Number.parseInt(
    String(value).replace(/[^0-9-]/g, ""),
    10,
  );
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
}

function parseFloatValue(value) {
  const parsedValue = Number.parseFloat(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
}

function parseTable($table) {
  const rows = $table.find("tr").toArray();

  if (rows.length === 0) {
    return [];
  }

  const headings = cheerio
    .load(rows[0])("th, td")
    .toArray()
    .map((cell) => toCamelCase(cheerio.load(cell).text().trim()));

  const colCount = headings.length;
  // carries[col] holds a value spanning multiple rows due to rowspan
  const carries = new Array(colCount).fill(null);

  return rows.slice(1).map((row) => {
    const cells = cheerio.load(row)("td, th").toArray();
    let cellIndex = 0;
    const values = [];

    for (let col = 0; col < colCount; col++) {
      if (carries[col] !== null) {
        values.push(carries[col].value);
        carries[col].remaining -= 1;
        if (carries[col].remaining === 0) {
          carries[col] = null;
        }
      } else {
        const cell = cells[cellIndex++];
        const value = cell ? cheerio.load(cell).text().trim() : "";
        const rowspan = cell
          ? Number.parseInt(cell.attribs?.rowspan || "1", 10)
          : 1;
        values.push(value);
        if (rowspan > 1) {
          carries[col] = { value, remaining: rowspan - 1 };
        }
      }
    }

    return headings.reduce((result, heading, index) => {
      if (heading) {
        result[heading] = values[index] || "";
      }

      return result;
    }, {});
  });
}

function parseResults(summaryMarkup, realtimeMarkup, siteName = vars.siteName) {
  const $summ = cheerio.load(summaryMarkup);
  const $rt = cheerio.load(realtimeMarkup);

  const ecuName = $summ("#ecu_title").text().trim();
  const totalGen = parseFloatValue(
    $summ(".panel-body table tbody tr:nth-child(2) td").text(),
  );
  const currentSystemPower = parseInteger(
    $summ(".panel-body table tbody tr:nth-child(3) td").text(),
  );
  const dailyGen = parseFloatValue(
    $summ(".panel-body table tbody tr:nth-child(4) td").text(),
  );
  const carbonOffset = parseInteger(
    $summ(".list-group > .list-group-item:nth-child(6) center").text(),
  );
  const treesPlanted = parseInteger(
    $summ(".list-group > .list-group-item:nth-child(5) center").text(),
  );
  const gallonsSaved = parseInteger(
    $summ(".list-group > .list-group-item:nth-child(4) center").text(),
  );
  const realtimeTable = $rt("table").first();
  const data = parseTable(realtimeTable).map((value) => ({
    inverterID: value.inverterID,
    currentPower: parseInteger(value.currentPower),
    gridFrequency: parseFloatValue(value.gridFrequency),
    gridVoltage: parseInteger(value.gridVoltage),
    temperature: parseInteger(value.temperature),
    reportingTime: value.reportingTime || "",
  }));

  return {
    totalGen,
    dailyGen,
    currentSystemPower,
    siteName,
    ecuName,
    carbonOffset,
    gallonsSaved,
    treesPlanted,
    data,
  };
}

function createScraper(config = vars, fetchImpl = fetch) {
  return async function getResults() {
    const [summaryMarkup, realtimeMarkup] = await Promise.all([
      fetchPage(config.summaryUrl, config, fetchImpl),
      fetchPage(config.realTimeDataURL, config, fetchImpl),
    ]);

    return parseResults(summaryMarkup, realtimeMarkup, config.siteName);
  };
}

const getResults = createScraper();

module.exports = getResults;
module.exports.createScraper = createScraper;
module.exports.fetchPage = fetchPage;
module.exports.parseResults = parseResults;
module.exports.parseTable = parseTable;
module.exports.parseInteger = parseInteger;
module.exports.parseFloatValue = parseFloatValue;
module.exports.toCamelCase = toCamelCase;
