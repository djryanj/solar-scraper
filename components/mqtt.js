/**
 * Implements MQTT export functionality of scraper metrics
 */

var mqtt = require('async-mqtt')
const getResults = require("./scraper");
const vars = require("./vars");

const mqttConnectString = vars.mqttHost + ":" + vars.mqttPort;
const baseTopic = vars.mqttTopic;
const haBaseTopic = vars.haMqttTopic;

// build the configuration payloads for HomeAssistant discovery topics
const dailyGenConfig = {
    name: "Solar Power Generated Today",
    unit_of_meas: "kWh",
    stat_t: haBaseTopic + "/sensor/dailyGen/state",
    icon: "mdi:solar-power"
}

const totalGenConfig = {
    name: "Lifetime Solar Power Generated",
    unit_of_meas: "kWh",
    stat_t: haBaseTopic + "/sensor/totalGen/state",
    icon: "mdi:solar-power"
}

const currGenConfig = {
    name: "Current Solar Power Output",
    unit_of_meas: "W",
    stat_t: haBaseTopic + "/sensor/currGen/state",
    icon: "mdi:solar-power",
    dev_cla: "power"
}

const treesConfig = {
    name: "Carbon Offset: Trees Planted",
    unit_of_meas: "trees",
    stat_t: haBaseTopic + "/sensor/carbonOffset/state",
    icon: "mdi:pine-tree",
    value_template: "{{ value_json.trees }}"
}

const gallonsConfig = {
    name: "Carbon Offset: Gallons of Gasoline Saved",
    unit_of_meas: "gal",
    stat_t: haBaseTopic + "/sensor/carbonOffset/state",
    icon: "mdi:gas-station",
    value_template: "{{ value_json.gallons }}"
}

const carbonConfig = {
    name: "Carbon Offset: kg of CO2",
    unit_of_meas: "kg",
    stat_t: haBaseTopic + "/sensor/carbonOffset/state",
    icon: "mdi:periodic-table-co2",
    value_template: "{{ value_json.carbon }}"
}

const panelPowerConfig = {
    name: "", // will be set dynamically
    device_class: "power",
    unit_of_meas: "W",
    stat_t: "", // will be set dynamically 
    icon: "mdi:solar-panel",
    value_template: "{{ value_json.power }}",
}

const panelTempConfig = {
    name: "", // will be set dynamically
    device_class: "temperature",
    unit_of_meas: "°C",
    stat_t: "", // will be set dynamically
    icon: "mdi:thermometer",
    value_template: "{{ value_json.temperature }}",
}

const panelFreqConfig = {
    name: "", // will be set dynamically
    unit_of_meas: "Hz",
    stat_t: "", // will be set dynamically
    icon: "mdi:waves",
    value_template: "{{ value_json.frequency }}",
}

const panelVoltageConfig = {
    name: "", // will be set dynamically
    unit_of_meas: "V",
    stat_t: "", // will be set dynamically
    icon: "mdi:power-socket-us",
    value_template: "{{ value_json.voltage }}",
}

async function mqttReports() {
    const client = await mqtt.connect(mqttConnectString, {
        username: vars.mqttUserName,
        password: vars.mqttPass
    })
    
    client.on("connect", () => {
        var d = new Date();
        console.log("Sending metrics to MQTT server " + mqttConnectString + " at " + d.toISOString() + "; base topic: " + baseTopic + "; HomeAssistant base topic: " + haBaseTopic);
    });

    const result = await getResults();
    // sort the inverter data so we get consistent panel names for homeasssistant
    result.data.sort(compare);

    const carbon = {
        trees: result.treesPlanted,
        gallons: result.gallonsSaved,
        carbon: result.carbonOffset
    }

    try {
        if (vars.useMqtt) {
            // publish baseline stuff to the non-HomeAssistant topic
            await client.publish(baseTopic + "/dailyGen", String(result.dailyGen));
            await client.publish(baseTopic + "/totalGen", String(result.totalGen));
            await client.publish(baseTopic + "/currentSystemPower", String(result.currentSystemPower));
            await client.publish(baseTopic + "/treesPlanted", String(result.treesPlanted));
            await client.publish(baseTopic + "/gallonsSaved", String(result.gallonsSaved));
            await client.publish(baseTopic + "/carbonOffset", String(result.carbonOffset));
            await client.publish(baseTopic + "/scraper/version", vars.vers);
            await client.publish(baseTopic + "/scraper/hostname", vars.hostname);
            await client.publish(baseTopic + "/scraper/azureBuildNumber", vars.azureBuildNumber);
            await client.publish(baseTopic + "/scraper/ecuHost", vars.ecuHost);
        }

        if (vars.useHaMqtt) {
            // publish to the HomeAssistant discovery topics
            // HomeAssistant provides the ability to read a JSON-encoded payload, so dump all things to that
            // outputted JSON will be equivalent to browsing the /json endpoint directly
            await client.publish(haBaseTopic + "/json", JSON.stringify(result));
            await client.publish(haBaseTopic + "/sensor/dailyGen/config", JSON.stringify(dailyGenConfig));
            await client.publish(haBaseTopic + "/sensor/dailyGen/state", String(result.dailyGen));
            await client.publish(haBaseTopic + "/sensor/currGen/config", JSON.stringify(currGenConfig));
            await client.publish(haBaseTopic + "/sensor/currGen/state", String(result.currentSystemPower));
            await client.publish(haBaseTopic + "/sensor/totalGen/config", JSON.stringify(totalGenConfig));
            await client.publish(haBaseTopic + "/sensor/totalGen/state", String(result.totalGen));
            await client.publish(haBaseTopic + "/sensor/carbonOffset/trees/config", JSON.stringify(treesConfig));
            await client.publish(haBaseTopic + "/sensor/carbonOffset/gallons/config", JSON.stringify(gallonsConfig));
            await client.publish(haBaseTopic + "/sensor/carbonOffset/carbon/config", JSON.stringify(carbonConfig));
            await client.publish(haBaseTopic + "/sensor/carbonOffset/state", JSON.stringify(carbon));
        }

        // sort the 


        result.data.forEach((element, index) => { // per-panel stats
            // publish homeassistant data
            if (vars.useHaMqtt) {
                var thisHaPanelTopic = haBaseTopic + "/sensor/solar_panel_" + element.inverterID;
                panelPowerConfig.name = "Solar Panel " + (index+1) + " Power";
                panelPowerConfig.stat_t = thisHaPanelTopic + "/state";
                panelTempConfig.name = "Solar Panel " + (index+1) + " Temperature";
                panelTempConfig.stat_t = thisHaPanelTopic + "/state";
                panelVoltageConfig.name = "Solar Panel " + (index+1) + " Voltage";
                panelVoltageConfig.stat_t = thisHaPanelTopic + "/state";
                panelFreqConfig.name = "Solar Panel " + (index+1) + " Frequency";
                panelFreqConfig.stat_t = thisHaPanelTopic + "/state";

                thisHaPanelData = {
                    power: element.currentPower,
                    voltage: element.gridVoltage,
                    frequency: element.gridFrequency,
                    temperature: element.temperature
                };

                client.publish(thisHaPanelTopic + "/power/config", JSON.stringify(panelPowerConfig));
                client.publish(thisHaPanelTopic + "/frequency/config", JSON.stringify(panelFreqConfig));
                client.publish(thisHaPanelTopic + "/temperature/config", JSON.stringify(panelTempConfig));
                client.publish(thisHaPanelTopic + "/voltage/config", JSON.stringify(panelVoltageConfig));
                client.publish(thisHaPanelTopic + "/state", JSON.stringify(thisHaPanelData));
            }

            if (vars.useMqtt) {
                // publish regular mqtt data
                var thisTopic = baseTopic + "/panels/" + element.inverterID;
                client.publish(thisTopic + "/currentPower", String(element.currentPower));
                client.publish(thisTopic + "/gridVoltage", String(element.gridVoltage));
                client.publish(thisTopic + "/gridFrequency", String(element.gridFrequency));
                client.publish(thisTopic + "/temperature", String(element.temperature));
            }
        });
        if (vars.useMqtt || vars.useHaMqtt)
        {
            await client.publish(baseTopic + "/ping", String(Date.now()));
            await client.end();
        }

    } catch (e) {
        console.log(e.stack);
    }
}

function compare(a, b) {
    // Use toUpperCase() to ignore character casing
    const inverterA = a.inverterID.toUpperCase();
    const inverterB = b.inverterID.toUpperCase();

    let comparison = 0;
    if (inverterA > inverterB) {
      comparison = 1;
    } else if (inverterA < inverterB) {
      comparison = -1;
    }
    return comparison;
}
  

function start() {
    if (vars.useMqtt || vars.useHaMqtt) {
        mqttReports(); // run this once at startup, otherwise it waits 5 minutes to run the first time
        setInterval(mqttReports, 300000) // hard coded to 5 minutes because that's how often the ECU updates
    }
}


module.exports = start;