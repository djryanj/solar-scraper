const mqtt = require("mqtt");
const defaultVars = require("./vars");

function comparePanels(a, b) {
  return a.inverterID.localeCompare(b.inverterID, undefined, {
    sensitivity: "base",
  });
}

function publishAsync(client, topic, payload, options = {}) {
  return new Promise((resolve, reject) => {
    client.publish(topic, payload, options, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function getPanelDiscoveryConfigs(panelTopic, panelName) {
  return [
    {
      topic: `${panelTopic}/power/config`,
      payload: {
        name: `${panelName} Power`,
        device_class: "power",
        unit_of_meas: "W",
        stat_t: `${panelTopic}/state`,
        value_template: "{{ value_json.power }}",
        icon: "mdi:solar-panel",
      },
    },
    {
      topic: `${panelTopic}/temperature/config`,
      payload: {
        name: `${panelName} Temperature`,
        device_class: "temperature",
        unit_of_meas: "°C",
        stat_t: `${panelTopic}/state`,
        value_template: "{{ value_json.temperature }}",
        icon: "mdi:thermometer",
      },
    },
    {
      topic: `${panelTopic}/frequency/config`,
      payload: {
        name: `${panelName} Frequency`,
        unit_of_meas: "Hz",
        stat_t: `${panelTopic}/state`,
        value_template: "{{ value_json.frequency }}",
        icon: "mdi:waves",
      },
    },
    {
      topic: `${panelTopic}/voltage/config`,
      payload: {
        name: `${panelName} Voltage`,
        unit_of_meas: "V",
        stat_t: `${panelTopic}/state`,
        value_template: "{{ value_json.voltage }}",
        icon: "mdi:power-socket-us",
      },
    },
  ];
}

function getHomeAssistantConfigs(snapshot, config = defaultVars) {
  const haBaseTopic = config.haMqttTopic;

  return [
    {
      topic: `${haBaseTopic}/sensor/dailyGen/config`,
      payload: {
        name: "Solar Power Generated Today",
        unit_of_meas: "kWh",
        stat_t: `${haBaseTopic}/sensor/dailyGen/state`,
        icon: "mdi:solar-power",
      },
    },
    {
      topic: `${haBaseTopic}/sensor/totalGen/config`,
      payload: {
        name: "Lifetime Solar Power Generated",
        unit_of_meas: "kWh",
        stat_t: `${haBaseTopic}/sensor/totalGen/state`,
        icon: "mdi:solar-power",
      },
    },
    {
      topic: `${haBaseTopic}/sensor/currGen/config`,
      payload: {
        name: "Current Solar Power Output",
        unit_of_meas: "W",
        stat_t: `${haBaseTopic}/sensor/currGen/state`,
        device_class: "power",
        icon: "mdi:solar-power",
      },
    },
    {
      topic: `${haBaseTopic}/sensor/carbonOffset/trees/config`,
      payload: {
        name: "Carbon Offset: Trees Planted",
        unit_of_meas: "trees",
        stat_t: `${haBaseTopic}/sensor/carbonOffset/state`,
        value_template: "{{ value_json.trees }}",
        icon: "mdi:pine-tree",
      },
    },
    {
      topic: `${haBaseTopic}/sensor/carbonOffset/gallons/config`,
      payload: {
        name: "Carbon Offset: Gallons of Gasoline Saved",
        unit_of_meas: "gal",
        stat_t: `${haBaseTopic}/sensor/carbonOffset/state`,
        value_template: "{{ value_json.gallons }}",
        icon: "mdi:gas-station",
      },
    },
    {
      topic: `${haBaseTopic}/sensor/carbonOffset/carbon/config`,
      payload: {
        name: "Carbon Offset: kg of CO2",
        unit_of_meas: "kg",
        stat_t: `${haBaseTopic}/sensor/carbonOffset/state`,
        value_template: "{{ value_json.carbon }}",
        icon: "mdi:periodic-table-co2",
      },
    },
    ...snapshot.data.flatMap((panel, index) => {
      const panelTopic = `${haBaseTopic}/sensor/solar_panel_${panel.inverterID}`;
      return getPanelDiscoveryConfigs(panelTopic, `Solar Panel ${index + 1}`);
    }),
  ];
}

function getPublishJobs(snapshot) {
  return getPublishJobsForConfig(snapshot, defaultVars);
}

function getPublishJobsForConfig(snapshot, config) {
  const baseTopic = config.mqttTopic;
  const haBaseTopic = config.haMqttTopic;
  const sortedPanels = [...snapshot.data].sort(comparePanels);
  const jobs = [];

  if (config.useMqtt) {
    jobs.push(
      {
        topic: `${baseTopic}/dailyGen`,
        payload: String(snapshot.dailyGen),
        retain: true,
      },
      {
        topic: `${baseTopic}/totalGen`,
        payload: String(snapshot.totalGen),
        retain: true,
      },
      {
        topic: `${baseTopic}/currentSystemPower`,
        payload: String(snapshot.currentSystemPower),
        retain: true,
      },
      {
        topic: `${baseTopic}/treesPlanted`,
        payload: String(snapshot.treesPlanted),
        retain: true,
      },
      {
        topic: `${baseTopic}/gallonsSaved`,
        payload: String(snapshot.gallonsSaved),
        retain: true,
      },
      {
        topic: `${baseTopic}/carbonOffset`,
        payload: String(snapshot.carbonOffset),
        retain: true,
      },
      {
        topic: `${baseTopic}/scraper/version`,
        payload: config.vers,
        retain: true,
      },
      {
        topic: `${baseTopic}/scraper/hostname`,
        payload: config.hostname,
        retain: true,
      },
      {
        topic: `${baseTopic}/scraper/releaseVersion`,
        payload: config.releaseVersion,
        retain: true,
      },
      {
        topic: `${baseTopic}/scraper/gitSha`,
        payload: config.gitSha,
        retain: true,
      },
      {
        topic: `${baseTopic}/scraper/ecuHost`,
        payload: config.ecuHost,
        retain: true,
      },
    );

    sortedPanels.forEach((panel) => {
      const panelTopic = `${baseTopic}/panels/${panel.inverterID}`;
      jobs.push(
        {
          topic: `${panelTopic}/currentPower`,
          payload: String(panel.currentPower),
          retain: true,
        },
        {
          topic: `${panelTopic}/gridVoltage`,
          payload: String(panel.gridVoltage),
          retain: true,
        },
        {
          topic: `${panelTopic}/gridFrequency`,
          payload: String(panel.gridFrequency),
          retain: true,
        },
        {
          topic: `${panelTopic}/temperature`,
          payload: String(panel.temperature),
          retain: true,
        },
      );
    });
  }

  if (config.useHaMqtt) {
    const carbon = {
      trees: snapshot.treesPlanted,
      gallons: snapshot.gallonsSaved,
      carbon: snapshot.carbonOffset,
    };

    jobs.push(
      {
        topic: `${haBaseTopic}/json`,
        payload: JSON.stringify(snapshot),
        retain: true,
      },
      {
        topic: `${haBaseTopic}/sensor/dailyGen/state`,
        payload: String(snapshot.dailyGen),
        retain: true,
      },
      {
        topic: `${haBaseTopic}/sensor/currGen/state`,
        payload: String(snapshot.currentSystemPower),
        retain: true,
      },
      {
        topic: `${haBaseTopic}/sensor/totalGen/state`,
        payload: String(snapshot.totalGen),
        retain: true,
      },
      {
        topic: `${haBaseTopic}/sensor/carbonOffset/state`,
        payload: JSON.stringify(carbon),
        retain: true,
      },
    );

    getHomeAssistantConfigs({ ...snapshot, data: sortedPanels }, config).forEach(
      (job) => {
        jobs.push({
          topic: job.topic,
          payload: JSON.stringify(job.payload),
          retain: true,
        });
      },
    );

    sortedPanels.forEach((panel) => {
      const panelTopic = `${haBaseTopic}/sensor/solar_panel_${panel.inverterID}`;
      jobs.push({
        topic: `${panelTopic}/state`,
        payload: JSON.stringify({
          power: panel.currentPower,
          voltage: panel.gridVoltage,
          frequency: panel.gridFrequency,
          temperature: panel.temperature,
        }),
        retain: true,
      });
    });
  }

  if (config.useMqtt || config.useHaMqtt) {
    jobs.push({
      topic: `${baseTopic}/ping`,
      payload: String(Date.now()),
      retain: true,
    });
  }

  return jobs;
}

function createMqttPublisher(config = defaultVars, mqttLib = mqtt) {
  return function start(snapshotStore) {
    const baseTopic = config.mqttTopic;
    const haBaseTopic = config.haMqttTopic;

    if (!config.useMqtt && !config.useHaMqtt) {
      console.log("MQTT publishing disabled.");
      return null;
    }

    const client = mqttLib.connect(config.mqttUrl, {
      username: config.mqttUserName || undefined,
      password: config.mqttPass || undefined,
      connectTimeout: config.requestTimeoutMs,
      reconnectPeriod: 5000,
    });

    let publishQueue = Promise.resolve();

    client.on("connect", () => {
      console.log(
        `Connected to MQTT server ${config.mqttUrl}; base topic: ${baseTopic}; Home Assistant base topic: ${haBaseTopic}`,
      );
    });

    client.on("reconnect", () => {
      console.log("Reconnecting to MQTT server...");
    });

    client.on("error", (error) => {
      console.error("MQTT client error:", error.message);
    });

    snapshotStore.on("snapshot", (snapshot) => {
      publishQueue = publishQueue
        .then(async () => {
          const jobs = getPublishJobsForConfig(snapshot, config);
          await Promise.all(
            jobs.map((job) =>
              publishAsync(client, job.topic, job.payload, {
                retain: job.retain,
                qos: 1,
              }),
            ),
          );
        })
        .catch((error) => {
          console.error("Failed to publish MQTT snapshot:", error.message);
        });
    });

    snapshotStore.on("refreshError", (error) => {
      console.error(
        "Skipping MQTT publish because scrape failed:",
        error.message,
      );
    });

    return client;
  };
}

const start = createMqttPublisher();

module.exports = start;
module.exports.comparePanels = comparePanels;
module.exports.publishAsync = publishAsync;
module.exports.getPanelDiscoveryConfigs = getPanelDiscoveryConfigs;
module.exports.getHomeAssistantConfigs = getHomeAssistantConfigs;
module.exports.getPublishJobs = getPublishJobs;
module.exports.getPublishJobsForConfig = getPublishJobsForConfig;
module.exports.createMqttPublisher = createMqttPublisher;
