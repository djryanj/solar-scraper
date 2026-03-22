/**
 * Live integration tests — require real network access to the ECU and MQTT broker.
 *
 * These tests are skipped automatically when the required environment variables
 * are not set so they never block CI. To run them locally:
 *
 *   ECU_HOST=192.168.100.2 MQTT_HOST=mqtt.mosquitto node --test test/integration/live.test.js
 *
 * Optional:
 *   MQTT_PORT=1883          (default: 1883)
 *   MQTT_USERNAME=...
 *   MQTT_PASSWORD=...
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const mqtt = require("mqtt");

const scraper = require("../../components/scraper");
const { buildMqttUrl } = require("../../components/vars");

// ---------------------------------------------------------------------------
// Skip conditions
// ---------------------------------------------------------------------------

const ecuHost = process.env.ECU_HOST;
const mqttHost = process.env.MQTT_HOST;

const skipEcu = !ecuHost;
const skipMqtt = !mqttHost;

const LIVE_TEST_MQTT_TOPIC = "solar-scraper/integration-test";
const MQTT_TIMEOUT_MS = 10_000;
const ECU_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// ECU scraper live test
// ---------------------------------------------------------------------------

test(
  "live: scrapes real ECU and returns plausible data",
  { skip: skipEcu ? "ECU_HOST not set" : false, timeout: ECU_TIMEOUT_MS },
  async () => {
    const config = {
      summaryUrl: `http://${ecuHost}/index.php/home`,
      realTimeDataURL: `http://${ecuHost}/index.php/realtimedata`,
      siteName: "live-test",
      requestTimeoutMs: ECU_TIMEOUT_MS - 1000,
    };

    const getResults = scraper.createScraper(config);
    const result = await getResults();

    // Structure
    assert.ok(typeof result.ecuName === "string" && result.ecuName.length > 0, "ecuName present");
    assert.ok(typeof result.totalGen === "number" && result.totalGen >= 0, "totalGen >= 0");
    assert.ok(typeof result.dailyGen === "number" && result.dailyGen >= 0, "dailyGen >= 0");
    assert.ok(typeof result.currentSystemPower === "number" && result.currentSystemPower >= 0, "currentSystemPower >= 0");
    assert.ok(Array.isArray(result.data) && result.data.length > 0, "at least one panel");

    // Per-panel field sanity for every panel
    for (const panel of result.data) {
      assert.ok(typeof panel.inverterID === "string" && panel.inverterID.length > 0,
        `inverterID present on panel ${panel.inverterID}`);
      assert.ok(typeof panel.currentPower === "number",
        `currentPower is a number on panel ${panel.inverterID}`);

      // Dual-channel B panels have voltage only on some ECU firmwares but must
      // never have a grid voltage value in the frequency field (the bug we fixed).
      if (panel.gridFrequency !== 0) {
        assert.ok(
          panel.gridFrequency < 100,
          `gridFrequency looks like Hz (< 100) on panel ${panel.inverterID}: got ${panel.gridFrequency}`,
        );
      }
      assert.ok(
        panel.gridVoltage < 300,
        `gridVoltage looks like V (< 300) on panel ${panel.inverterID}: got ${panel.gridVoltage}`,
      );
    }
  },
);

// ---------------------------------------------------------------------------
// MQTT live test
// ---------------------------------------------------------------------------

test(
  "live: publishes to and receives from real MQTT broker",
  { skip: skipMqtt ? "MQTT_HOST not set" : false, timeout: MQTT_TIMEOUT_MS },
  async () => {
    const mqttPort = Number.parseInt(process.env.MQTT_PORT || "1883", 10);
    const mqttUrl = buildMqttUrl(mqttHost, mqttPort);
    const connectOpts = {
      username: process.env.MQTT_USERNAME || undefined,
      password: process.env.MQTT_PASSWORD || undefined,
      connectTimeout: 5000,
      reconnectPeriod: 0, // no auto-reconnect in tests
    };

    const publisher = mqtt.connect(mqttUrl, connectOpts);
    const subscriber = mqtt.connect(mqttUrl, connectOpts);

    try {
      // Wait for both clients to connect
      await Promise.all([
        waitForEvent(publisher, "connect", MQTT_TIMEOUT_MS),
        waitForEvent(subscriber, "connect", MQTT_TIMEOUT_MS),
      ]);

      const testPayload = JSON.stringify({ ts: Date.now(), source: "solar-scraper-test" });

      // Subscribe before publishing
      await new Promise((resolve, reject) => {
        subscriber.subscribe(LIVE_TEST_MQTT_TOPIC, { qos: 1 }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Receive the message
      const receivedPayload = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Timed out waiting for MQTT message")), 5000);

        subscriber.once("message", (topic, message) => {
          clearTimeout(timeout);
          assert.equal(topic, LIVE_TEST_MQTT_TOPIC);
          resolve(message.toString());
        });

        publisher.publish(LIVE_TEST_MQTT_TOPIC, testPayload, { qos: 1, retain: false }, (err) => {
          if (err) {
            clearTimeout(timeout);
            reject(err);
          }
        });
      });

      const parsed = JSON.parse(receivedPayload);
      assert.equal(parsed.source, "solar-scraper-test");
      assert.ok(typeof parsed.ts === "number", "payload ts is a number");
    } finally {
      publisher.end(true);
      subscriber.end(true);
    }
  },
);

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function waitForEvent(emitter, event, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out waiting for "${event}"`)),
      timeoutMs,
    );
    emitter.once(event, (...args) => {
      clearTimeout(timer);
      resolve(...args);
    });
    emitter.once("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
