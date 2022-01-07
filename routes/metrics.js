const client = require("prom-client");
const express = require("express");
const router = express.Router();
const getResults = require("../components/scraper");
const register = new client.Registry();
const cache = require("../components/cache");
const vars = require("../components/vars");

// might as well collect some stuff about this server
const collectDefaultMetrics = client.collectDefaultMetrics;

// Probe every 5th second and set to the registry we're using
collectDefaultMetrics({ timeout: 5000 });
collectDefaultMetrics({ register });

// register all the guages
const totalGen = new client.Gauge({
  name: "solar_total_generated",
  help: "Total generated solar as reported by the ECU in kWh",
});

const dailyGen = new client.Gauge({
  name: "solar_daily_generated",
  help: "Solar generated today as reported by the ECU in kWh",
});

const currentSystemPower = new client.Gauge({
  name: "solar_current_total_power",
  help: "Current solar generation as reported by the ECU in Watts (W)",
});

const carbonOffset = new client.Gauge({
  name: "solar_carbon_offset",
  help: "Estimated carbon offset in KG of CO2",
});

const gallonsOffset = new client.Gauge({
  name: "solar_gallons_offset",
  help: "Estimated carbon offset in gallons of gasoline",
});

const treesPlanted = new client.Gauge({
  name: "solar_trees_planted",
  help: "Estimated carbon offset in trees planted",
});

const panelVoltage = new client.Gauge({
  name: "solar_inverter_grid_voltage",
  help: "Current grid voltage for panel in Volts AC (V)",
  labelNames: ["inverterId"],
});

const panelPower = new client.Gauge({
  name: "solar_panel_power",
  help: "Current power generation for panel in Watts (W)",
  labelNames: ["inverterId"],
});

const panelTemp = new client.Gauge({
  name: "solar_inverter_temperature",
  help: "Current inverter temperature for panel in degrees C",
  labelNames: ["inverterId"],
});

const panelHz = new client.Gauge({
  name: "solar_panel_grid_frequency",
  help: "Current grid frequency for panel in Hertz (Hz)",
  labelNames: ["inverterId"],
});

const scraperVersion = new client.Gauge({
  name: "solar_scraper_info",
  help: "Solar scraper version information",
  labelNames: ["version", "hostname", "buildId", "ecuHost"],
});

register.registerMetric(totalGen);
register.registerMetric(dailyGen);
register.registerMetric(currentSystemPower);
register.registerMetric(carbonOffset);
register.registerMetric(treesPlanted);
register.registerMetric(gallonsOffset);
register.registerMetric(panelPower);
register.registerMetric(panelHz);
register.registerMetric(panelTemp);
register.registerMetric(panelVoltage);
register.registerMetric(scraperVersion);

/* GET metrics page. */
router.get("/", cache(vars.cacheLength), async function (req, res, next) {
  try {
    const result = await getResults();

    dailyGen.set(result.dailyGen);
    totalGen.set(result.totalGen);
    currentSystemPower.set(result.currentSystemPower);
    treesPlanted.set(result.treesPlanted);
    gallonsOffset.set(result.gallonsSaved);
    carbonOffset.set(result.carbonOffset);
    scraperVersion
      .labels(vars.vers, vars.hostname, vars.azureBuildNumber, vars.ecuHost)
      .set(1);

    result.data.forEach((element, index) => {
      panelPower.labels(element.inverterID).set(element.currentPower);
      panelVoltage.labels(element.inverterID).set(element.gridVoltage);
      panelHz.labels(element.inverterID).set(element.gridFrequency);
      panelTemp.labels(element.inverterID).set(element.temperature);
    });
    console.log(register.contentType);
    res.set("Content-Type", register.contentType);
    res.send(register.metrics());
  } catch (e) {
    next(e);
  }
});

module.exports = router;
