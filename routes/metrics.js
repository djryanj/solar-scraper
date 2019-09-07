const client = require('prom-client');
const express = require("express");
const router = express.Router();
const getResults = require("../scraper");
const register = new client.Registry();

const powers = [];
const voltages = [];
const temperatures = [];
const frequencies = [];

// register stuff we know about for sure
const totalGen = new client.Gauge({
    name: "total_generated",
    help: "Total generated solar as reported by the ECU in kWh"
});

const dailyGen = new client.Gauge({
    name: "daily_generated",
    help: "Solar generated today as reported by the ECU in kWh"
});

const currentPower = new client.Gauge({
    name: "current_total_power",
    help: "Current solar generation as reported by the ECU in Watts (W)"
});

const panelVoltage = new client.Gauge({
    name: "panel_voltage",
    help: "Current grid voltage for panel in Volts AC (V)",
    labelNames: [ 'inverterId' ]
})

const panelPower = new client.Gauge({
    name: "panel_power",
    help: "Current power generation for panel in Watts (W)",
    labelNames: [ 'inverterId' ]
})

const panelTemp = new client.Gauge({
    name: "panel_temperature",
    help: "Current inverter temperature for panel in degrees C",
    labelNames: [ 'inverterId' ]
})

const panelHz = new client.Gauge({
    name: "panel_frequency",
    help: "Current grid frequency for panel in Hertz (Hz)",
    labelNames: [ 'inverterId' ]
})

register.registerMetric(totalGen);
register.registerMetric(dailyGen);
register.registerMetric(currentPower);
register.registerMetric(panelPower);
register.registerMetric(panelHz);
register.registerMetric(panelTemp);
register.registerMetric(panelVoltage);

/* GET metrics page. */
router.get("/", async function(req, res, next) {
    const result = await getResults();

    dailyGen.set(parseFloat(result.dailyGen.replace(/[^0-9.]/g, "")));
    totalGen.set(parseFloat(result.totalGen.replace(/[^0-9.]/g, "")));
    currentPower.set(parseFloat(result.currentPower.replace(/[^0-9.]/g, "")));
    // these don't really seem to work so they're commented out for now
    // client.register.clear();
    // register.clear();
    result.data.forEach((element, index) => {
        panelPower.labels(element.inverterID).set(element.currentPower);
        panelVoltage.labels(element.inverterID).set(element.gridVoltage);
        panelHz.labels(element.inverterID).set(element.gridFrequency);
        panelTemp.labels(element.inverterID).set(element.temperature);  
    });
    res.set('Content-Type', register.contentType);
    res.end(register.metrics());
});

module.exports = router;