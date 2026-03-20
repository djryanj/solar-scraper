const test = require("node:test");
const assert = require("node:assert/strict");

const vars = require("../../components/vars");

test("parseBoolean handles truthy, falsy, defaults, and invalid values", () => {
  assert.equal(vars.parseBoolean(undefined, true), true);
  assert.equal(vars.parseBoolean("yes"), true);
  assert.equal(vars.parseBoolean("OFF"), false);
  assert.throws(() => vars.parseBoolean("sometimes"), /Invalid boolean value/);
});

test("parseInteger enforces numeric ranges", () => {
  assert.equal(vars.parseInteger(undefined, 42), 42);
  assert.equal(vars.parseInteger("10", 0, { min: 1, max: 20 }), 10);
  assert.throws(() => vars.parseInteger("abc", 0), /Invalid integer value/);
  assert.throws(() => vars.parseInteger("0", 0, { min: 1 }), /Value must be >= 1/);
});

test("buildMqttUrl adds protocol and default port", () => {
  assert.equal(vars.buildMqttUrl("broker.local", 1883), "mqtt://broker.local:1883");
  assert.equal(
    vars.buildMqttUrl("mqtts://broker.local", 8883),
    "mqtts://broker.local:8883",
  );
});

test("toShortGitSha truncates to seven characters", () => {
  assert.equal(vars.toShortGitSha("abcdef123456"), "abcdef1");
});

test("createConfig builds derived URLs and public config", () => {
  const config = vars.createConfig(
    {
      PORT: "3001",
      SCRAPE_INTERVAL_MS: "5000",
      REQUEST_TIMEOUT_MS: "2500",
      ECUHOST: "10.0.0.5",
      SITENAME: "Roof",
      USE_MQTT: "true",
      USE_HA_MQTT: "false",
      MQTT_HOST: "mqtt://broker.local",
      MQTT_PORT: "1884",
      MQTT_TOPIC: "lab/solar",
      HA_MQTT_TOPIC: "ha",
      GIT_SHA: "abcdef123456",
      GIT_REF: "main",
      RELEASE_VERSION: "v9.9.9",
    },
    {
      fsModule: { readFileSync() { throw new Error("should not read git"); } },
      osModule: { hostname() { return "test-host"; } },
      packageVersion: "9.9.9",
    },
  );

  assert.equal(config.port, 3001);
  assert.equal(config.summaryUrl, "http://10.0.0.5/index.php/home");
  assert.equal(config.realTimeDataURL, "http://10.0.0.5/index.php/realtimedata");
  assert.equal(config.mqttUrl, "mqtt://broker.local:1884");
  assert.equal(config.gitSha, "abcdef1");
  assert.equal(config.gitRef, "main");
  assert.equal(config.releaseVersion, "v9.9.9");
  assert.equal(config.vers, "v9.9.9-main-abcdef1");
  assert.deepEqual(config.toPublicConfig(), {
    port: 3001,
    scrapeIntervalMs: 5000,
    requestTimeoutMs: 2500,
    summaryUrl: "http://10.0.0.5/index.php/home",
    realTimeDataURL: "http://10.0.0.5/index.php/realtimedata",
    siteName: "Roof",
    ecuHost: "10.0.0.5",
    useMqtt: true,
    useHaMqtt: false,
    mqttUrl: "mqtt://broker.local:1884",
    mqttTopic: "lab/solar",
    haMqttTopic: "ha",
    hostname: "test-host",
    gitSha: "abcdef1",
    gitRef: "main",
    releaseVersion: "v9.9.9",
    vers: "v9.9.9-main-abcdef1",
  });
});