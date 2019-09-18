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
    stat_t: "~/state",
    icon: "mdi:solar-power"
}

const totalGenConfig = {
    name: "Lifetime Solar Power Generated",
    unit_of_meas: "kWh",
    stat_t: "~/state",
    icon: "mdi:solar-power"
}

const currGenConfig = {
    name: "Current Solar Power Output",
    unit_of_meas: "W",
    stat_t: "~/state",
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
    
    const carbon = {
        trees: result.treesPlanted,
        gallons: result.gallonsSaved,
        carbon: result.carbonOffset
    }

    try {
        // publish stuff to the non-HomeAssistant topic
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

        result.data.forEach((element, index) => {
            var thisTopic = baseTopic + "/panels/" + element.inverterID;
            client.publish(thisTopic + "/currentPower", String(element.currentPower));
            client.publish(thisTopic + "/gridVoltage", String(element.gridVoltage));
            client.publish(thisTopic + "/gridFrequency", String(element.gridFrequency));
            client.publish(thisTopic + "/temperature", String(element.temperature));
        });

        await client.publish(baseTopic + "/ping", String(Date.now()));
        await client.end();
    } catch (e) {
        console.log(e.stack);
    }
}

function start() {
    if (vars.useMqtt) {
        mqttReports(); // run this once at startup, otherwise it waits 5 minutes to run the first time
        setInterval(mqttReports, 300000) // hard coded to 5 minutes because that's how often the ECU updates
    }
};


module.exports = start;