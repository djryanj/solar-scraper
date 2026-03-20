const fs = require("fs");
const os = require("os");

const packageVersion = require("../package.json").version;

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const normalizedValue = String(value).trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalizedValue)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalizedValue)) {
    return false;
  }

  throw new Error(`Invalid boolean value: ${value}`);
}

function parseInteger(value, fallback, { min, max } = {}) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`Invalid integer value: ${value}`);
  }

  if (min !== undefined && parsedValue < min) {
    throw new Error(`Value must be >= ${min}: ${value}`);
  }

  if (max !== undefined && parsedValue > max) {
    throw new Error(`Value must be <= ${max}: ${value}`);
  }

  return parsedValue;
}

function getLocalGit(fsModule = fs) {
  try {
    const rev = fsModule.readFileSync(".git/HEAD", "utf8").trim();

    if (!rev.includes(":")) {
      return rev.substring(0, 7);
    }

    const gitRef = rev.substring(5);
    return fsModule
      .readFileSync(`.git/${gitRef}`, "utf8")
      .trim()
      .substring(0, 7);
  } catch {
    return "missingGitSha";
  }
}

function buildMqttUrl(host, port) {
  const trimmedHost = host.trim();
  const hasProtocol = /^[a-z]+:\/\//i.test(trimmedHost);
  const mqttUrl = new URL(hasProtocol ? trimmedHost : `mqtt://${trimmedHost}`);

  if (!mqttUrl.port) {
    mqttUrl.port = String(port);
  }

  return mqttUrl.toString().replace(/\/$/, "");
}

function toShortGitSha(value) {
  return String(value || "").trim().substring(0, 7);
}

function createConfig(
  env = process.env,
  dependencies = { fsModule: fs, osModule: os, packageVersion },
) {
  const { fsModule, osModule, packageVersion: version = packageVersion } =
    dependencies;

  const hostname = osModule.hostname();
  const port = parseInteger(env.PORT, 3000, { min: 1, max: 65535 });
  const scrapeIntervalMs = parseInteger(env.SCRAPE_INTERVAL_MS, 300000, {
    min: 1000,
  });
  const requestTimeoutMs = parseInteger(env.REQUEST_TIMEOUT_MS, 15000, {
    min: 1000,
  });
  const ecuHost = (env.ECUHOST || "192.168.1.1").trim();
  const siteName = (env.SITENAME || "Your House!").trim();
  const useMqtt = parseBoolean(env.USE_MQTT, false);
  const useHaMqtt = parseBoolean(env.USE_HA_MQTT, false);
  const mqttHost = (env.MQTT_HOST || "test.mosquitto.org").trim();
  const mqttPort = parseInteger(env.MQTT_PORT, 1883, {
    min: 1,
    max: 65535,
  });
  const mqttUserName = env.MQTT_USERNAME || null;
  const mqttPass = env.MQTT_PASSWORD || null;
  const mqttTopic = (env.MQTT_TOPIC || "home/solar").trim();
  const haMqttTopic = (env.HA_MQTT_TOPIC || "homeassistant").trim();
  const summaryUrl = `http://${ecuHost}/index.php/home`;
  const realTimeDataURL = `http://${ecuHost}/index.php/realtimedata`;
  const gitSha = env.GIT_SHA
    ? toShortGitSha(env.GIT_SHA)
    : env.GITHUB_SHA
      ? toShortGitSha(env.GITHUB_SHA)
      : getLocalGit(fsModule);
  const gitRef =
    env.GIT_REF ||
    env.GITHUB_REF_NAME ||
    env.NODE_ENV ||
    "local";
  const releaseVersion =
    env.RELEASE_VERSION ||
    (env.GITHUB_REF_TYPE === "tag" && env.GITHUB_REF_NAME
      ? env.GITHUB_REF_NAME
      : version);
  const vers = `${releaseVersion}-${gitRef}-${gitSha}`;
  const mqttUrl = buildMqttUrl(mqttHost, mqttPort);

  return {
    gitSha,
    gitRef,
    releaseVersion,
    vers,
    hostname,
    port,
    scrapeIntervalMs,
    requestTimeoutMs,
    summaryUrl,
    realTimeDataURL,
    siteName,
    ecuHost,
    mqttHost,
    mqttPort,
    mqttUrl,
    mqttPass,
    mqttUserName,
    mqttTopic,
    useMqtt,
    useHaMqtt,
    haMqttTopic,
    toPublicConfig() {
      return {
        port,
        scrapeIntervalMs,
        requestTimeoutMs,
        summaryUrl,
        realTimeDataURL,
        siteName,
        ecuHost,
        useMqtt,
        useHaMqtt,
        mqttUrl,
        mqttTopic,
        haMqttTopic,
        hostname,
        gitSha,
        gitRef,
        releaseVersion,
        vers,
      };
    },
  };
}

const config = createConfig();

module.exports = {
  ...config,
  parseBoolean,
  parseInteger,
  buildMqttUrl,
  toShortGitSha,
  createConfig,
  getLocalGit,
};
