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
    name: "totalGen",
    help: "Total generated solar as reported by the ECU in kWh"
});

const dailyGen = new client.Gauge({
    name: "dailyGen",
    help: "Solar generated today as reported by the ECU in kWh"
});

const currentPower = new client.Gauge({
    name: "currentPower",
    help: "Current solar generation as reported by the ECU in W"
});

register.registerMetric(totalGen);
register.registerMetric(dailyGen);
register.registerMetric(currentPower);

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
        i = parseInt(index + 1);
        
        client.register.removeSingleMetric("panel_" + i + "_current_power");
        powers.push(new client.Gauge({
            name: "panel_" + i + "_current_power",
            help: "Current power generation for Panel " + i + " in W",
            labelNames: [ 'inverterId' ]
        }));
        powers[index].labels(element.inverterID).set(element.currentPower);
        

        client.register.removeSingleMetric("panel_" + i + "_current_voltage");
        voltages.push(new client.Gauge({
            name: "panel_" + i + "_current_voltage",
            help: "Current grid voltage for Panel " + i + " in V",
            labelNames: [ 'inverterId' ]
        }));
        voltages[index].labels(element.inverterID).set(element.gridVoltage);

        client.register.removeSingleMetric("panel_" + i + "_current_frequency");
        frequencies.push(new client.Gauge({
            name: "panel_" + i + "_current_frequency",
            help: "Current grid frequency for Panel " + i + " in Hz",
            labelNames: [ 'inverterId' ]
        }));
        frequencies[index].labels(element.inverterID).set(element.gridFrequency);

        client.register.removeSingleMetric("panel_" + i + "_current_temperature");
        temperatures.push(new client.Gauge({
            name: "panel_" + i + "_current_temperature",
            help: "Current inverter temperature for Panel " + i + " in degrees C",
            labelNames: [ 'inverterId' ]
        }));
        temperatures[index].labels(element.inverterID).set(element.temperature);
        
    });

    // for reasons I can't quite work out, prom-client doesn't seem to
    // remove metrics correctly when I ask it to. I'm probably doing it
    // wrong, even though the docs say it should work (and numerous tests
    // I have run say it does too, but the thing still errors after the 
    // first run), so in typical fashion I have (probably) overcomplicated
    // things by wrapping these in a try/catch.
    powers.forEach(val => {
        try {
            register.registerMetric(val);
        }
        catch {
        }
    });
    voltages.forEach(val => {
        try {
            register.registerMetric(val);
        }
        catch {
        }
    });
    frequencies.forEach(val => {
        try {
            register.registerMetric(val);
        } 
        catch {
        }
       
    });
    temperatures.forEach(val => {
        try {
            register.registerMetric(val);
        }
        catch {
        }
    });

    res.set('Content-Type', register.contentType);
    res.end(register.metrics());
});

module.exports = router;