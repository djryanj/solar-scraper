const test = require("node:test");
const assert = require("node:assert/strict");
const EventEmitter = require("node:events");

const mqttModule = require("../../components/mqtt");
const { createSnapshot } = require("../fixtures/snapshot");

function createConfig(overrides = {}) {
  return {
    mqttTopic: "home/solar",
    haMqttTopic: "homeassistant",
    useMqtt: true,
    useHaMqtt: true,
    vers: "0.3.0-test-build1234",
    releaseVersion: "0.3.0",
    gitSha: "build12",
    hostname: "test-host",
    ecuHost: "ecu.local",
    mqttUrl: "mqtt://broker.local:1883",
    mqttUserName: null,
    mqttPass: null,
    requestTimeoutMs: 1500,
    ...overrides,
  };
}

test("getPublishJobsForConfig sorts panels and emits MQTT plus Home Assistant topics", () => {
  const jobs = mqttModule.getPublishJobsForConfig(createSnapshot(), createConfig());

  const panelTopics = jobs
    .map((job) => job.topic)
    .filter((topic) => topic.includes("/panels/") && topic.endsWith("/currentPower"));

  assert.deepEqual(panelTopics, [
    "home/solar/panels/A-1/currentPower",
    "home/solar/panels/Z-2/currentPower",
  ]);
  assert.ok(jobs.some((job) => job.topic === "homeassistant/sensor/dailyGen/config"));
  assert.ok(jobs.some((job) => job.topic === "home/solar/scraper/releaseVersion"));
  assert.ok(jobs.some((job) => job.topic === "home/solar/scraper/gitSha"));
  assert.ok(jobs.some((job) => job.topic === "home/solar/ping"));
});

test("createMqttPublisher returns null when MQTT publishing is disabled", () => {
  const start = mqttModule.createMqttPublisher(
    createConfig({ useMqtt: false, useHaMqtt: false }),
    { connect() { throw new Error("should not connect"); } },
  );

  assert.equal(start(new EventEmitter()), null);
});

test("createMqttPublisher publishes snapshot jobs through the MQTT client", async () => {
  const published = [];
  const fakeClient = {
    on() {},
    publish(topic, payload, options, callback) {
      published.push({ topic, payload, options });
      callback(null);
    },
  };
  const store = new EventEmitter();
  const start = mqttModule.createMqttPublisher(createConfig(), {
    connect() {
      return fakeClient;
    },
  });

  start(store);
  store.emit("snapshot", createSnapshot());
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));

  assert.ok(published.length > 0);
  assert.ok(published.every((entry) => entry.options.qos === 1));
  assert.ok(published.some((entry) => entry.topic === "homeassistant/json"));
});